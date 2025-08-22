const app = require("./app");
const config = require("./config/config");
const dbConnection = require("./config/database");
const { SUCCESS_MESSAGES } = require("./helper/messages");
const { Server } = require("socket.io");

let server;

const startServer = async () => {
  try {
    await dbConnection(); // ⬅️ WAIT until DB connects first

    server = app.listen(config.port, () => {
      console.log(`${SUCCESS_MESSAGES.SERVER_STARTED} ${config.port}`);
    });

    const io = new Server(server, {
      cors: {
        origin: "*", // your frontend origin in production
        methods: ["GET", "POST"]
      }
    });
    const activeUsers = new Map();
    io.on("connection", (socket) => {
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
      });
       socket.on("userConnected", (userId) => {
        activeUsers.set(userId, socket.id);
         io.emit("updateUserStatus", { userId, status: "Available" });
      });
      socket.on("getActiveUsers", () => {
        io.emit("activeUsersList", Array.from(activeUsers.keys())); // send only to this socket
      });

      socket.on("userDisconnected", (userId) => {
        activeUsers.delete(userId);
        // io.emit("updateUserStatus", { userId, status: "Offline" });
        io.emit("activeUsersList", Array.from(activeUsers.keys()));
      });

      socket.on("sendMessage", (messageData) => {
        if (Array.isArray(messageData)) {
          messageData.forEach((msg) => {
            io.to(msg.chat._id).emit("receiveMessage", msg);
          });
        } else {
          io.to(messageData.chat._id).emit("receiveMessage", messageData);
        }
      });
      socket.on("deleteMessage", ({ messageId, chatId }) => {
        io.to(chatId).emit("messageDeleted", { messageId });
      });




      socket.on("disconnect", () => {
        for (let [userId, socketId] of activeUsers.entries()) {
          if (socketId === socket.id) {
            activeUsers.delete(userId);
            io.emit("updateUserStatus", { userId, status: "Offline" });
             io.emit("activeUsersList", Array.from(activeUsers.keys()));
            break;
          }
        }
      });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// graceful shutdown
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
