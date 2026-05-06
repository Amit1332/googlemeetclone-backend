const express = require("express");
const { integrationController } = require("../../controller");
const apiAuth = require("../../middleware/apiAuth");
const auth = require("../../middleware/auth");

const flexibleAuth = require("../../middleware/flexibleAuth");

const router = express.Router();

/**
 * Management Routes (JWT Protected)
 */
router.post(
  "/credentials",
  auth.isAuthenticatedUser,
  integrationController.generateCredentials
);

router.get(
  "/credentials",
  auth.isAuthenticatedUser,
  integrationController.getCredentials
);

/**
 * Integration Endpoints (Flexible Protected)
 * Allows EITHER JWT (our UI) OR Client ID/Secret (n8n)
 */
router.post(
  "/broadcast",
  flexibleAuth,
  integrationController.broadcastToProject
);

module.exports = router;
