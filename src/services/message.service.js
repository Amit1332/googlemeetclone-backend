const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const messageModel = require("../model/message.schema");
const chatModel = require("../model/chat.schema");
const cloudinary = require("cloudinary").v2

const messagePopulate = [
  { path: "sender", select: "-password" },
  { path: "broadcastSource", select: "name" },
  {
    path: "chat",
    populate: [
      { path: "users", select: "-password" },
      { path: "groupAdmin", select: "-password" },
    ],
  },
  {
    path: "replyTo",
    select: "content sender reactions",
    populate: { path: "sender", select: "-password" },
  },
];

const sendMessage = async (authId, userBody, fileUrls = []) => {
  const { message, chatId, replyTo, broadcastSource } = userBody;


  const filesArray = fileUrls.map((file) => ({
    url: file.path,
    fileName: file.originalName,
    type: file.mimetype?.split("/")[0] || "file",
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
    broadcastSource: broadcastSource || null,
  });

  newMessage = await newMessage.populate(messagePopulate);
  await chatModel.findByIdAndUpdate(chatId, { latestMessage: newMessage });
  return newMessage;
};


const getMessages = async (authId, chatId) => {
   const chat = await chatModel.findById(chatId);
  if (!chat.users.includes(authId)) {
    throw new Error("Unauthorized access to this chat");
  }

  return await messageModel.find({ chat: chatId })
    .populate(messagePopulate);
};


const getDocuments = async (authId, userId) => {
   chat = await chatModel.findOne({
    isGroupChat: false,
    users: { $all: [authId, userId], $size: 2 }
  })
   if (!chat.users.includes(authId)) {
    throw new Error("Unauthorized access to this chat");
  }

  let data =  await messageModel.find({ chat: chat._id })
  data =  data.map((el) => el.content.files)

  return data
  
   
};

const toggleReaction = async (authId, messageId, emoji) => {
  if (!emoji?.trim()) {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Emoji is required");
  }

  const message = await messageModel.findById(messageId).populate({
    path: "chat",
    populate: [
      { path: "users", select: "-password" },
      { path: "groupAdmin", select: "-password" },
    ],
  });

  if (!message) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Message not found");
  }

  const isParticipant = message.chat?.users?.some(
    (user) => String(user?._id || user) === String(authId)
  );

  if (!isParticipant) {
    throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Not authorized to react to this message");
  }

  const normalizedEmoji = emoji.trim();
  const existingReactionIndex = message.reactions.findIndex(
    (reaction) => reaction.emoji === normalizedEmoji
  );

  if (existingReactionIndex === -1) {
    message.reactions.push({
      emoji: normalizedEmoji,
      users: [authId],
    });
  } else {
    const reactionUsers = message.reactions[existingReactionIndex].users.map(String);
    const hasReacted = reactionUsers.includes(String(authId));

    if (hasReacted) {
      message.reactions[existingReactionIndex].users = message.reactions[existingReactionIndex].users.filter(
        (userId) => String(userId) !== String(authId)
      );

      if (message.reactions[existingReactionIndex].users.length === 0) {
        message.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      message.reactions[existingReactionIndex].users.push(authId);
    }
  }

  await message.save();

  return await messageModel.findById(messageId).populate(messagePopulate);
};


const deleteMessage = async (authId, messageId) => {
  const message = await messageModel.findById(messageId);
  if (!message) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Message not found");
  }

  if (message.sender.toString() !== authId.toString()) {
    throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Not authorized to delete this message");
  }

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

  await messageModel.findByIdAndDelete(messageId);

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
 deleteMessage,
 getDocuments,
 toggleReaction,
};
