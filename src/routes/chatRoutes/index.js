
const express = require('express')
const { chatController } = require('../../controller');
const auth = require('../../middleware/auth')
const Router = express.Router()

Router.post(
  "/",
  auth.isAuthenticatedUser,
  chatController.accessChatHistory
);

module.exports = Router