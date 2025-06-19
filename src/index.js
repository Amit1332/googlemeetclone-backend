const app = require("./app");
const config = require("./config/config");
const dbConnection = require("./config/database");
const { SUCCESS_MESSAGES } = require("./helper/messages");
const { Server } = require("socket.io");

let server;
server = app.listen(config.port, () => {
   dbConnection()
  //  console.log(`${SUCCESS_MESSAGES.SERVER_STARTED} ${config.port}`)
});

const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend domain
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  // console.log("New client connected: ", socket.id);

  // Join a chat room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    // console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Receive and broadcast messages
  socket.on("sendMessage", (messageData) => {
    if (Array.isArray(messageData)) {
    messageData.forEach((msg) => {
      io.to(msg.chat._id).emit("receiveMessage", msg);
    });
  } else {
    io.to(messageData.chat._id).emit("receiveMessage", messageData);
  }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // console.log("Client disconnected: ", socket.id);
  });
});
const exitHandler = () => {
  if (server) {
    server.close(() => {
      // console.log("Server closed");
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