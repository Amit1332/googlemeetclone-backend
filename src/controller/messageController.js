const { messageService } = require("../services");
const catchAsyncError = require("../utils/catchAsync");
const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");

exports.sendMessage  = catchAsyncError(async (req, res) => {
       const fileUrls = req.files && req.files.map(file => ({path:file.path, originalName: file.originalname}));
       const newMessage = await messageService.sendMessage(req.user._id, req.body, fileUrls);
        res.status(HTTP_STATUS_CODES.OK).send({data:newMessage})
})


exports.getMessages = catchAsyncError(async (req, res, next) => {
    const messages = await messageService.getMessages(req.user._id,req.params.chatId);
    res.status(HTTP_STATUS_CODES.OK).send({data:messages});
  
})


exports.fileHanlder =catchAsyncError( async (req, res, next) => {
     const fileUrls = req.files.map(file => ({path:file.path, originalName: file.originalname}));
    const messages = await messageService.fileHanlder(req.user._id,req.body.chatId,fileUrls);
   res.status(HTTP_STATUS_CODES.OK).send({data:messages});
})
