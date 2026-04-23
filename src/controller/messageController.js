const { messageService } = require("../services");
const catchAsyncError = require("../utils/catchAsync");
const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");

exports.sendMessage  = catchAsyncError(async (req, res) => {
  if (req.files && req.files.some(file => file.size > 10 * 1024 * 1024)) {
    return res.status(400).json({ message: "File size cannot exceed 10 MB" });
  }
       const fileUrls = req.files && req.files.map(file => ({path:file.path, originalName: file.originalname, filename:file.filename, mimetype:file.mimetype}));
       const newMessage = await messageService.sendMessage(req.user._id, req.body, fileUrls);
        res.status(HTTP_STATUS_CODES.OK).send({data:newMessage})
})


exports.getMessages = catchAsyncError(async (req, res, next) => {
    const messages = await messageService.getMessages(req.user._id,req.params.chatId);
    res.status(HTTP_STATUS_CODES.OK).send({data:messages});
  
})



exports.deleteMessage = catchAsyncError(async (req, res) => {
  const { messageId } = req.params;
  const result = await messageService.deleteMessage(req.user._id, messageId);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    data: result,
  });
});

exports.toggleReaction = catchAsyncError(async (req, res) => {
  const { messageId } = req.params;
  const result = await messageService.toggleReaction(req.user._id, messageId, req.body?.emoji);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    data: result,
  });
});


exports.getDocuments = catchAsyncError(async (req, res) => {
  const { userId } = req.params;
  const result = await messageService.getDocuments(req.user._id,userId);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    data: result,
  });
});
