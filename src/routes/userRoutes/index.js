const express = require('express')
const { userController } = require('../../controller')
const auth = require('../../middleware/auth')
const Router = express.Router()

Router.post(
  "/status",
  auth.isAuthenticatedUser,
  userController.statusUpdate
);

Router.get(
  "/users",
  auth.isAuthenticatedUser,
  userController.users
);

Router.get(
  "/chatted-users",
  auth.isAuthenticatedUser,
  userController.chattedUsers 
);
Router.get(
  "/:id",
  auth.isAuthenticatedUser,
  userController.getUserDetails
);



module.exports = Router