const express = require('express')
const { messageController } = require('../../controller');
const auth = require('../../middleware/auth');
const upload = require('../../utils/multer');
const Router = express.Router()

Router.post(
  "/",
  upload.array("files", 10),
  auth.isAuthenticatedUser,
  messageController.sendMessage
);
Router.get('/:chatId',  auth.isAuthenticatedUser, messageController.getMessages);
Router.get('/documents/:userId',auth.isAuthenticatedUser, messageController.getDocuments);

Router.delete("/:messageId", auth.isAuthenticatedUser, messageController.deleteMessage);




module.exports = Router