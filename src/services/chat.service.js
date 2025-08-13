const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../helper/messages");
const chatModel = require("../model/chat.schema");
const messageModel = require("../model/message.schema");


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


// const deleteChat = async (authId, chatId) => {
//   // Find the chat and ensure the auth user is part of it
//   const chat = await chatModel.findOne({
//     _id: chatId,
//     users: authId, // ensures the user is part of the chat
//   });

//   if (!chat) {
//     throw new ApiError(
//       HTTP_STATUS_CODES.NOT_FOUND,
//       ERROR_MESSAGES.CHAT_NOT_FOUND || "Chat not found"
//     );
//   }

//   // Delete all messages for that chat
//   await messageModel.deleteMany({ chat: chatId });

//   // Delete the chat itself
//   await chatModel.deleteOne({ _id: chatId });

//   return { message: SUCCESS_MESSAGES.DELETED_CHAT };
// };



const deleteChat = async (authUserId, otherUserId) => {
  // Find the chat between the authenticated user and the given userId
  console.log("authUserId", authUserId, "otherUserId", otherUserId);
  
  const chat = await chatModel.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: authUserId } } },
      { users: { $elemMatch: { $eq: otherUserId } } }
    ]
  });

  if (!chat) {
    throw new ApiError(
      HTTP_STATUS_CODES.NOT_FOUND,
      ERROR_MESSAGES.CHAT_NOT_FOUND || "Chat not found"
    );
  }

  // Delete all messages linked to this chat
  await messageModel.deleteMany({ chat: chat._id });

  // Delete the chat itself
  await chatModel.findByIdAndDelete(chat._id);

 return { message: SUCCESS_MESSAGES.DELETED_CHAT };
};




module.exports = {
accessChat,
deleteChat
};