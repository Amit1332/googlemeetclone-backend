const { chatService } = require("../services");
const catchAsyncError = require("../utils/catchAsync");
const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");

exports.accessChatHistory = catchAsyncError(async (req, res) => {
      const { userId } = req.body;
      const chat = await chatService.accessChat(req.user._id, userId);
      res.status(HTTP_STATUS_CODES.OK).send({data:chat})
})

exports.deleteChatHistory = catchAsyncError(async (req, res) => {
  const { userId } = req.params; // assuming you send chatId in URL like DELETE /chats/:chatId
  const response = await chatService.deleteChat(req.user._id, userId);

  res.status(HTTP_STATUS_CODES.OK).send(response);
});
