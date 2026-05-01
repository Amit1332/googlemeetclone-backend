const { integrationService } = require("../services");
const catchAsync = require("../utils/catchAsync");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");

/**
 * Middleware to authenticate requests using Client ID and Client Secret.
 * Expects headers: x-client-id and x-client-secret
 */
const apiAuth = catchAsync(async (req, res, next) => {
  const clientId = req.headers["x-client-id"];
  const clientSecret = req.headers["x-client-secret"];

  if (!clientId || !clientSecret) {
    throw new ApiError(HTTP_STATUS_CODES.UNAUTHORIZED, "x-client-id and x-client-secret headers are required");
  }

  // Validate credentials against DB
  const integration = await integrationService.validateCredentials(clientId, clientSecret);
  
  // Attach integration info to request
  req.integration = integration;

  next();
});

module.exports = apiAuth;
