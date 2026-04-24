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
        ...new Set(
          participantIds.flatMap((userId) => getTargetSockets(userId))
        ),
      ];

      if (targetSocketIds.length) {
        io.to(targetSocketIds).emit(eventName, message);
        return;
      }

      if (message?.chat?._id) {
        io.to(message.chat._id).emit(eventName, message);
      }
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

      socket.on("webrtc:offer", ({ fromUserId, toUserId, sdp }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:offer", { fromUserId, sdp });
        }
      });

      socket.on("webrtc:answer", ({ fromUserId, toUserId, sdp }) => {
        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:answer", { fromUserId, sdp });
        }
      });

      socket.on("webrtc:ice-candidate", ({ fromUserId, toUserId, candidate }) => {
        if (!candidate) return;

        const targetSockets = getTargetSockets(toUserId);
        if (targetSockets.length) {
          io.to(targetSockets).emit("webrtc:ice-candidate", {
            fromUserId,
            candidate,
          });
        }
      });

      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (removeActiveSocket(userId, socket.id)) {
          io.emit("call:ended", { fromUserId: userId });
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

