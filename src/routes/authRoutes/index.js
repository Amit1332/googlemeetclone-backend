const express = require('express')
const authValidation = require('../../validatiors/auth.validation')
const { authController } = require('../../controller')
const validate = require('../../middleware/validate')
const auth = require('../../middleware/auth')
const isDeletedUser = require('../../middleware/isDeletedUser')
const Router = express.Router()

Router.post(
  "/register",
  validate(authValidation.register),
  isDeletedUser,
  authController.register
);

Router.post(
  "/login",
  validate(authValidation.login),
  isDeletedUser,
  authController.login
);

Router.post("/google", authController.googleLogin);

Router.post(
  "/logout",
  validate(authValidation.logout),
  authController.logout
);
Router.get(
  "/profile",
  auth.isAuthenticatedUser,
  isDeletedUser,
  authController.loggedInUserDetails
);

module.exports = Router