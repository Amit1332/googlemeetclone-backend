const express = require("express");
const { projectController } = require("../../controller");
const auth = require("../../middleware/auth");

const flexibleAuth = require("../../middleware/flexibleAuth");

const router = express.Router();

router.post(
  "/",
  auth.isAuthenticatedUser,
  projectController.createProject
);

router.get(
  "/",
  flexibleAuth,
  projectController.getProjects
);

router.get(
  "/:id",
  flexibleAuth,
  projectController.getProject
);

router.put(
  "/:id",
  auth.isAuthenticatedUser,
  projectController.updateProject
);

router.delete(
  "/:id",
  auth.isAuthenticatedUser,
  projectController.deleteProject
);

router.post(
  "/add-members",
  auth.isAuthenticatedUser,
  projectController.addMembers
);

module.exports = router;
