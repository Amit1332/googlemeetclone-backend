const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const messageModel = require("../model/message.schema");
const chatModel = require("../model/chat.schema");
const cloudinary = require("cloudinary").v2

const sendMessage = async (authId, userBody, fileUrls = []) => {
  const { message, chatId, replyTo } = userBody;

  const filesArray = fileUrls.map((file) => ({
    url: file.path,
    fileName: file.originalName,
    type: file.mimetype?.split("/")[0] || "file", // auto-detect "image", "video", etc.
    public_id: file.filename,
  }));

  let newMessage = await messageModel.create({
    sender: authId,
    chat: chatId,
    content: {
      message: message || "",
      files: filesArray,
    },
     replyTo: replyTo || null,
  });

  newMessage = await newMessage.populate([
    { path: "sender", select: "name" },
    { path: "chat" }, { path: "replyTo", select: "content sender" }
  ]);
  await chatModel.findByIdAndUpdate(chatId, { latestMessage: newMessage });
  return newMessage;
};


const getMessages = async (authId, chatId) => {
   const chat = await chatModel.findById(chatId);
  // Extra safety: check if user is allowed to access this chat
  if (!chat.users.includes(authId)) {
    throw new Error("Unauthorized access to this chat");
  }

  return await messageModel.find({ chat: chatId })
    .populate("sender", "name")
    .populate("chat").populate("replyTo")
};



const deleteMessage = async (authId, messageId) => {
  const message = await messageModel.findById(messageId);
  if (!message) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Message not found");
  }

  if (message.sender.toString() !== authId.toString()) {
    throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Not authorized to delete this message");
  }

  // Delete files from Cloudinary
  const files = message.content?.files || [];
  for (const file of files) {
    if (file.public_id) {
      try {
        await cloudinary.uploader.destroy(file.public_id);
      } catch (err) {
        console.error(`Failed to delete Cloudinary file ${file.public_id}`, err);
      }
    }
  }

  // Delete the message
  await messageModel.findByIdAndDelete(messageId);

  // Update chat latestMessage
  const chat = await chatModel.findById(message.chat);
  if (chat.latestMessage?.toString() === messageId) {
    const latestMsg = await messageModel
      .findOne({ chat: message.chat })
      .sort({ createdAt: -1 });
    await chatModel.findByIdAndUpdate(message.chat, {
      latestMessage: latestMsg || null,
    });
  }

  return { message: "Message and associated files deleted successfully" };
};

module.exports = { 
 sendMessage ,
 getMessages,
 deleteMessage
};