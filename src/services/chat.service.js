const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const chatModel = require("../model/chat.schema");

const accessChat = async (authId, userId) => {
  // Prevent self-chat logic
  let chat
  if (String(authId) === String(userId)) {
    chat = await chatModel.findOne({
      isGroupChat: false,
      $and: [{users: {$eq: userId}}, {users: {$size: 1}}], // exact match with only one user
    }).populate("users", "-password").populate("latestMessage");
  }
else{
     chat = await chatModel.findOne({
    isGroupChat: false,
    users: { $all: [authId, userId], $size: 2 } // exactly those 2 users
  }).populate("users", "-password").populate("latestMessage");
}

  if (chat) return chat;

  // Create new chat if not found
  chat = await chatModel.create({
    chatName: "sender",
    isGroupChat: false,
    users: (String(authId) === String(userId) ? [authId] : [authId, userId]),
  });

  return chat;
};


module.exports = {
accessChat
};