const jwt = require('jsonwebtoken');
const config = require("../config/config")
const User = require("../model/user.schema");
const catchAsync = require('../utils/catchAsync');
const { HTTP_STATUS_CODES } = require('@simple-node/http-status-codes');
const ApiError = require('../utils/ApiError');

exports.isAuthenticatedUser = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "please login first"));
  }

  const token = authHeader.split(' ')[1];
  try {
      const decodedData = jwt.verify(token, config.jwt.secret);
      console.log(decodedData)
    req.user = await User.findById(decodedData.sub);

    if (!req.user) {
        return next(new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Not found"));
    }

    next();
  } catch (err) {
    return next(new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Invalid or expired token"));
  }
});
