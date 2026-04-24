const app = require("./app");
const config = require("./config/config");
const dbConnection = require("./config/database");
const { SUCCESS_MESSAGES } = require("./helper/messages");
const { Server } = require("socket.io");
const User = require("./model/user.schema");

let server;

const startServer = async () => {
  try {
    await dbConnection();

    server = app.listen(config.port, () => {
      console.log(`${SUCCESS_MESSAGES.SERVER_STARTED} ${config.port}`);
    });

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    const activeUsers = new Map();
    const groupCallRooms = new Map();

    const getActiveUserIds = () => Array.from(activeUsers.keys());

    const addActiveSocket = (userId, socketId) => {
      const socketIds = activeUsers.get(userId) || new Set();
      socketIds.add(socketId);
      activeUsers.set(userId, socketIds);
    };

    const removeActiveSocket = (userId, socketId) => {
      if (!userId || !activeUsers.has(userId)) return false;

      const socketIds = activeUsers.get(userId);
      socketIds.delete(socketId);

      if (socketIds.size === 0) {
        activeUsers.delete(userId);
        return true;
      }

      activeUsers.set(userId, socketIds);
      return false;
    };

    const getTargetSockets = (userId) => {
      const socketIds = activeUsers.get(userId);
      return socketIds?.size ? Array.from(socketIds) : [];
    };

    const emitToUserIds = (userIds, eventName, payload) => {
      const targetSocketIds = [...new Set(userIds.flatMap((userId) => getTargetSockets(userId)))];
      if (targetSocketIds.length) {
        io.to(targetSocketIds).emit(eventName, payload);
      }
    };

    const getParticipantIds = (chat) => {
      if (!chat?.users?.length) return [];

      return chat.users
        .map((user) => {
          if (!user) return "";
          if (typeof user === "string") return user;
          return user._id?.toString?.() || user.toString?.() || "";
        })
        .filter(Boolean);
    };

    const emitMessageToParticipants = (eventName, message) => {
      const participantIds = getParticipantIds(message?.chat);
      const targetSocketIds = [
        ...new Set(participantIds.flatMap((userId) => getTargetSockets(userId))),
      ];

      if (targetSocketIds.length) {
        io.to(targetSocketIds).emit(eventName, message);
        return;
      }

      if (message?.chat?._id) {
        io.to(message.chat._id).emit(eventName, message);
      }
    };

    const normalizeParticipant = (participant) => {
      if (!participant) return null;

      const userId =
        participant._id?.toString?.() ||
        participant.userId?.toString?.() ||
        participant.id?.toString?.() ||
        "";

      if (!userId) return null;

      return {
        _id: userId,
        name: participant.name || participant.userName || "Unknown",
        profilePicture: participant.profilePicture || participant.userAvatar || "",
      };
    };

    const ensureGroupCallRoom = (chatId, meta = {}) => {
      if (!groupCallRooms.has(chatId)) {
        groupCallRooms.set(chatId, {
          chatId,
          chatName: meta.chatName || "",
          chatPicture: meta.chatPicture || "",
          participants: new Map(),
        });
      }

      const room = groupCallRooms.get(chatId);
      if (meta.chatName) room.chatName = meta.chatName;
      if (meta.chatPicture) room.chatPicture = meta.chatPicture;
      return room;
    };

    const serializeGroupParticipants = (chatId) => {
      const room = groupCallRooms.get(chatId);
      if (!room) return [];
      return Array.from(room.participants.values());
    };

    const addGroupParticipant = (chatId, participant, meta = {}) => {
      const normalizedParticipant = normalizeParticipant(participant);
      if (!normalizedParticipant) return null;

      const room = ensureGroupCallRoom(chatId, meta);
      room.participants.set(normalizedParticipant._id, normalizedParticipant);
      return room;
    };

    const removeGroupParticipant = (chatId, userId) => {
      const room = groupCallRooms.get(chatId);
      if (!room) return { participants: [], notifyUserIds: [] };

      room.participants.delete(userId);
      const participants = Array.from(room.participants.values());
      const notifyUserIds = participants.map((participant) => participant._id);

      if (!participants.length) {
        groupCallRooms.delete(chatId);
      }

      return { participants, notifyUserIds };
    };

    const removeUserFromAllGroupCalls = (userId) => {
      const leaveEvents = [];

      groupCallRooms.forEach((room, chatId) => {
        if (!room.participants.has(userId)) return;

        const { participants, notifyUserIds } = removeGroupParticipant(chatId, userId);
        leaveEvents.push({ chatId, participants, notifyUserIds });
      });

      return leaveEvents;
    };

    io.on("connection", (socket) => {
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
      });

      socket.on("userConnected", async (userId) => {
        if (!userId) return;

        socket.data.userId = userId;
        addActiveSocket(userId, socket.id);

        try {
          const user = await User.findById(userId).select("status");
          if (user) {
            io.emit("updateUserStatus", { userId, status: user.status });
          }
        } catch (error) {
          console.error("Failed to sync user status on connect:", error.message);
        }

        io.emit("activeUsersList", getActiveUserIds());
      });

      socket.on("getActiveUsers", () => {
        socket.emit("activeUsersList", getActiveUserIds());
      });

      socket.on("userStatusChanged", ({ userId, status }) => {
        if (!userId) return;
        io.emit("updateUserStatus", { userId, status });
      });

      socket.on("userProfileUpdated", ({ userId, profile }) => {
        if (!userId || !profile) return;
        io.emit("userProfileUpdated", { userId, profile });
      });

      socket.on("userDisconnected", (userId) => {
        const disconnectedUserId = userId || socket.data.userId;
        removeActiveSocket(disconnectedUserId, socket.id);
        io.emit("activeUsersList", getActiveUserIds());
      });

      socket.on("sendMessage", (messageData) => {
        if (Array.isArray(messageData)) {
          messageData.forEach((msg) => {
            emitMessageToParticipants("receiveMessage", msg);
          });
        } else {
          emitMessageToParticipants("receiveMessage", messageData);
        }
      });

      socket.on("messageReactionUpdated", (messageData) => {
        if (!messageData) return;
        emitMessageToParticipants("messageReactionUpdated", messageData);
      });

      socket.on("deleteMessage", ({ messageId, chatId }) => {
        io.to(chatId).emit("messageDeleted", { messageId });
      });

      socket.on("call:init", ({ fromUserId, toUserId, mediaType, callerName, callerAvatar }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("call:incoming", {
            fromUserId,
            callerName,
            callerAvatar,
            mediaType,
          });
          return;
        }

        const callerSockets = getTargetSockets(fromUserId);
        if (callerSockets.length) {
          io.to(callerSockets).emit("call:unavailable", { toUserId });
        }
      });

      socket.on(
        "group-call:init",
        ({
          chatId,
          fromUserId,
          callerName,
          callerAvatar,
          chatName,
          chatPicture,
          participantIds = [],
          participants = [],
        }) => {
          if (!chatId || !fromUserId) return;

          addGroupParticipant(
            chatId,
            { _id: fromUserId, name: callerName, profilePicture: callerAvatar },
            { chatName, chatPicture }
          );

          const payloadParticipants = [
            normalizeParticipant({ _id: fromUserId, name: callerName, profilePicture: callerAvatar }),
            ...participants.map(normalizeParticipant).filter(Boolean),
          ];

          emitToUserIds(participantIds, "group-call:incoming", {
            chatId,
            fromUserId,
            callerName,
            callerAvatar,
            chatName,
            chatPicture,
            participants: payloadParticipants,
          });

          emitToUserIds([fromUserId], "group-call:participants", {
            chatId,
            participants: serializeGroupParticipants(chatId),
          });
        }
      );

      socket.on("group-call:join", ({ chatId, userId, userName, userAvatar }) => {
        if (!chatId || !userId) return;

        const room = addGroupParticipant(
          chatId,
          { _id: userId, name: userName, profilePicture: userAvatar },
          {}
        );
        if (!room) return;

        const participants = serializeGroupParticipants(chatId);
        const otherUserIds = participants
          .map((participant) => participant._id)
          .filter((participantId) => participantId !== userId);

        emitToUserIds([userId], "group-call:participants", { chatId, participants });
        emitToUserIds(otherUserIds, "group-call:user-joined", {
          chatId,
          participant: normalizeParticipant({ _id: userId, name: userName, profilePicture: userAvatar }),
          participants,
        });
      });

      socket.on("group-call:leave", ({ chatId, userId }) => {
        if (!chatId || !userId) return;
        const { participants, notifyUserIds } = removeGroupParticipant(chatId, userId);
        emitToUserIds(notifyUserIds, "group-call:user-left", {
          chatId,
          userId,
          participants,
        });
      });

      socket.on("group-call:reject", ({ chatId, userId, toUserId }) => {
        if (!chatId || !userId || !toUserId) return;
        emitToUserIds([toUserId], "group-call:rejected", { chatId, userId });
      });

      socket.on("call:accept", ({ fromUserId, toUserId }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("call:accepted", { fromUserId });
        }
      });

      socket.on("call:reject", ({ fromUserId, toUserId }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("call:rejected", { fromUserId });
        }
      });

      socket.on("call:end", ({ fromUserId, toUserId }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("call:ended", { fromUserId });
        }
      });

      socket.on("webrtc:offer", ({ fromUserId, toUserId, sdp, callMode, chatId, userName, userAvatar }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:offer", {
            fromUserId,
            sdp,
            callMode,
            chatId,
            userName,
            userAvatar,
          });
        }
      });

      socket.on("webrtc:answer", ({ fromUserId, toUserId, sdp, callMode, chatId, userName, userAvatar }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:answer", {
            fromUserId,
            sdp,
            callMode,
            chatId,
            userName,
            userAvatar,
          });
        }
      });

      socket.on("webrtc:ice-candidate", ({ fromUserId, toUserId, candidate, callMode, chatId }) => {
        if (!candidate) return;

        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:ice-candidate", {
            fromUserId,
            candidate,
            callMode,
            chatId,
          });
        }
      });

      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (removeActiveSocket(userId, socket.id)) {
          io.emit("call:ended", { fromUserId: userId });
          const leaveEvents = removeUserFromAllGroupCalls(userId);
          leaveEvents.forEach(({ chatId, participants, notifyUserIds }) => {
            emitToUserIds(notifyUserIds, "group-call:user-left", {
              chatId,
              userId,
              participants,
            });
          });
        }
        io.emit("activeUsersList", getActiveUserIds());
      });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
