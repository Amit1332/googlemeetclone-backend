const express = require('express')
const { chatController, messageController } = require('../../controller');
const auth = require('../../middleware/auth');
const upload = require('../../utils/multer');
const Router = express.Router()

Router.post(
  "/",
  auth.isAuthenticatedUser,
  messageController.sendMessage
);
Router.get('/:chatId',  auth.isAuthenticatedUser, messageController.getMessages);
Router.post('/upload/file',  auth.isAuthenticatedUser,upload.array("files", 10), messageController.fileHanlder);



module.exports = Router