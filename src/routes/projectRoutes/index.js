const express = require("express");
const { projectController } = require("../../controller");
const auth = require("../../middleware/auth");

const router = express.Router();

router.post(
  "/",
  auth.isAuthenticatedUser,
  projectController.createProject
);

router.get(
  "/",
  auth.isAuthenticatedUser,
  projectController.getProjects
);

router.post(
  "/add-members",
  auth.isAuthenticatedUser,
  projectController.addMembers
);

module.exports = router;
