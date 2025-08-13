const express = require('express')
const authValidation = require('../../validatiors/auth.validation')
const { authController } = require('../../controller')
const validate = require('../../middleware/validate')
const auth = require('../../middleware/auth')
const Router = express.Router()

Router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);

Router.post(
  "/login",
  validate(authValidation.login),
  authController.login
);

Router.post("/google",  authController.googleLogin);

Router.post(
  "/logout",
  validate(authValidation.logout),
  authController.logout
);
Router.get(
  "/profile",
  auth.isAuthenticatedUser,
  authController.loggedInUserDetails
);

module.exports = Router