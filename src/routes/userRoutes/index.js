const express = require('express')
const { userController } = require('../../controller')
const auth = require('../../middleware/auth');
const { uploadFiles } = require('../../middleware/uploadFiles');
const Router = express.Router()

Router.post(
  "/status",
  auth.isAuthenticatedUser,
  userController.statusUpdate
);

Router.put(
  "/upload-profile-picture",
  auth.isAuthenticatedUser,
    uploadFiles,
  userController.uploadProfilePicture
);

Router.put(
  "/update-profile",
  auth.isAuthenticatedUser,
  userController.uploadProfile
);

Router.put(
  "/reset-password",
  auth.isAuthenticatedUser,
  userController.resetPassword
);


Router.put(
  "/toggle-status",
  auth.isAuthenticatedUser,
  userController.toggleUserStatus
);

Router.delete(
  "/delete-account",
  auth.isAuthenticatedUser,
  userController.deleteUserAccount
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