
const express = require('express')
const { chatController } = require('../../controller');
const auth = require('../../middleware/auth');
const { uploadFiles } = require('../../middleware/uploadFiles');
const Router = express.Router()

Router.post(
  "/",
  auth.isAuthenticatedUser,
  chatController.accessChatHistory
);

Router.delete(
  "/:userId",
  auth.isAuthenticatedUser,
  chatController.deleteChatHistory
);


// Group chat
Router.post("/group", auth.isAuthenticatedUser, chatController.createGroupChat);
Router.put("/group/update", auth.isAuthenticatedUser, uploadFiles, chatController.updateGroupChat);
Router.put("/group/exit/:chatId", auth.isAuthenticatedUser, chatController.exitGroupChat);
Router.put("/group/remove-user", auth.isAuthenticatedUser, chatController.removeUserFromGroupChat);
Router.put("/group/invite-user", auth.isAuthenticatedUser, chatController.inviteUserToGroupChat);
Router.delete("/group/delete/:chatId", auth.isAuthenticatedUser, chatController.deleteGroupChat);

module.exports = Router