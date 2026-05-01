const { integrationService } = require("../services");
const catchAsync = require("../utils/catchAsync");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");

/**
 * Generates new credentials for the organization.
 * (Requires JWT Auth)
 */
const generateCredentials = catchAsync(async (req, res) => {
  const { appName } = req.body;
  const orgId = req.user.organization;

  if (!appName) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({ message: "appName is required" });
  }

  const result = await integrationService.generateCredentials(orgId, appName);
  res.status(HTTP_STATUS_CODES.CREATED).send({ data: result });
});

/**
 * Lists all credentials for the organization.
 * (Requires JWT Auth)
 */
const getCredentials = catchAsync(async (req, res) => {
  const orgId = req.user.organization;
  const credentials = await integrationService.getOrganizationCredentials(orgId);
  res.status(HTTP_STATUS_CODES.OK).send({ data: credentials });
});

/**
 * Broadcasts a message using Client ID/Secret.
 * (Requires Client ID/Secret Auth)
 */
const broadcastToProject = catchAsync(async (req, res) => {
  const { projectId, senderId, message } = req.body;
  const orgId = req.integration.organization; // Attached by apiAuth middleware
  
  if (!projectId || !senderId || !message) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({ 
      message: "projectId, senderId, and message are required" 
    });
  }

  const result = await integrationService.broadcastToProject(projectId, senderId, message, orgId);
  res.status(HTTP_STATUS_CODES.OK).send({ data: result });
});

module.exports = {
  generateCredentials,
  getCredentials,
  broadcastToProject,
};
