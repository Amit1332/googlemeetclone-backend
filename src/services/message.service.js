const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const messageModel = require("../model/message.schema");
const chatModel = require("../model/chat.schema");

const sendMessage = async (authId, userBody, fileUrls = []) => {
  const { content, chatId } = userBody;

  const filesArray = fileUrls.map((file) => ({
    url: file.path,
    fileName: file.originalName,
    type: file.mimetype?.split("/")[0] || "file", // auto-detect "image", "video", etc.
  }));

  let newMessage = await messageModel.create({
    sender: authId,
    chat: chatId,
    content: {
      message: content?.message || "",
      files: filesArray,
    },
  });

  newMessage = await newMessage.populate([
    { path: "sender", select: "name" },
    { path: "chat" },
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
    .populate("chat");
};


const fileHanlder = async (authId, chatId, fileUrls) => {
  // Create all messages
  let messages = await Promise.all(
    fileUrls.map((file) =>
      messageModel.create({
        sender: authId,
        chat: chatId,
        content: {
          files: [
            {
              url: file.path,
              fileName: file.originalName,
              type: file.mimetype?.split("/")[0] || "file", // auto-detect "image", "video", "application"
            },
          ],
        },
      })
    )
  );

  // Populate all messages using model-level populate
  messages = await messageModel.populate(messages, [
    { path: "sender", select: "name" },
    { path: "chat" },
  ]);

  // Update latest message in chat (usually you update with the last one only)
  const latestMessage = messages[messages.length - 1];
  await chatModel.findByIdAndUpdate(chatId, { latestMessage });
  return messages;
};




module.exports = { 
 sendMessage ,
 getMessages,
 fileHanlder
};