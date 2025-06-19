const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");

const ApiError = require("../utils/ApiError");
const config = require("../config/config");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || HTTP_STATUS_CODES[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === "production" && !err.isOperational) {
    statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    message = HTTP_STATUS_CODES[HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR];
  } 

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (config.env === "development") {
    console.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};