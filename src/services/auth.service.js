const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");
const bcrypt = require("bcryptjs");
const User = require("../model/user.schema");
const { ERROR_MESSAGES } = require("../helper/messages");
const ApiError = require("../utils/ApiError");

const loginUserWithEmailAndPassword = async (email, password) => {
  let userInfo = await User.findOne({ email }).select("+password"); // include password only for comparison
   userInfo.status = "Available";
    await userInfo.save();
  if (await bcrypt.compare(password, userInfo.password)) {
    userInfo = userInfo.toObject();
    delete userInfo.password;
    return userInfo;
  } else {
    throw new ApiError(
      HTTP_STATUS_CODES.UNAUTHORIZED,
      ERROR_MESSAGES.INCORRECT_CREDENTIALS
    );
  }
};


const logout = async (refreshToken) => {

}
module.exports = {
  loginUserWithEmailAndPassword,
  logout
};
