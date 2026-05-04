const auth = require("./auth");
const apiAuth = require("./apiAuth");

/**
 * Middleware that allows EITHER JWT Auth (req.user) OR Client ID/Secret Auth (req.integration).
 */
const flexibleAuth = (req, res, next) => {
  if (req.headers["x-client-id"] || req.headers["x-client-secret"]) {
    return apiAuth(req, res, next);
  }
  return auth.isAuthenticatedUser(req, res, next);
};

module.exports = flexibleAuth;
