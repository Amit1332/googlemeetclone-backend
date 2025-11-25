const { chatService } = require("../services");
const catchAsyncError = require("../utils/catchAsync");
const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");

exports.accessChatHistory = catchAsyncError(async (req, res) => {
      const chat = await chatService.accessChat(req.user._id, req.body);
      res.status(HTTP_STATUS_CODES.OK).send({data:chat})
})

exports.deleteChatHistory = catchAsyncError(async (req, res) => {
  const { userId } = req.params; // assuming you send chatId in URL like DELETE /chats/:chatId
  const response = await chatService.deleteChat(req.user._id, userId);

  res.status(HTTP_STATUS_CODES.OK).send(response);
});


exports.createGroupChat = catchAsyncError(async (req, res) => {
  const { groupName, users } = req.body;

  const chat = await chatService.createGroupChat(
    req.user._id,
    groupName,
    users
  );

  res.status(HTTP_STATUS_CODES.CREATED).send({ data: chat });
});


exports.updateGroupChat = catchAsyncError(async (req, res) => {
  const { chatId, newName } = req.body;
  console.log("req.files", req.files);

    const fileUrls = req.files.map(file => ({
    path: file.path,
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
  }));


  const chat = await chatService.updateGroupChat(
    req.user._id,
    chatId,
    newName,
    groupPicture =   fileUrls[0]?.path
  );

  res.status(HTTP_STATUS_CODES.OK).send({ data: chat });
});


exports.exitGroupChat = catchAsyncError(async (req, res) => {
  const { chatId } = req.params;

  const chat = await chatService.exitGroupChat(req.user._id, chatId);

  res.status(HTTP_STATUS_CODES.OK).send({ data: chat });
});

exports.removeUserFromGroupChat = catchAsyncError(async (req, res) => {
  const { userId, chatId } = req.body;

  const chat = await chatService.removeUserFromGroupChat(userId, chatId);

  res.status(HTTP_STATUS_CODES.OK).send({ data: chat });
});

exports.inviteUserToGroupChat = catchAsyncError(async (req, res) => {
  const { userIds, chatId } = req.body;

  const chat = await chatService.inviteUserToGroupChat(req.user._id, userIds, chatId);
  res.status(HTTP_STATUS_CODES.OK).send({ data: chat });
});


exports.deleteGroupChat = catchAsyncError(async (req, res) => {
  const { chatId } = req.params;

  const response = await chatService.deleteGroupChat(req.user._id, chatId);

  res.status(HTTP_STATUS_CODES.OK).send({ message: response });
});
