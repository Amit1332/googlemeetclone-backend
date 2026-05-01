const express = require("express");
const { integrationController } = require("../../controller");
const apiAuth = require("../../middleware/apiAuth");
const auth = require("../../middleware/auth");

const router = express.Router();

/**
 * Management Routes (JWT Protected)
 * Used by organization admins to manage their platform connections.
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
 * Integration Endpoints (Client ID/Secret Protected)
 * Used by third-party platforms (n8n, MS Teams, etc.)
 */
router.post(
  "/broadcast",
  apiAuth,
  integrationController.broadcastToProject
);

module.exports = router;
