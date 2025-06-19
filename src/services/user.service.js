const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const User = require("../model/user.schema");
const email = require("../services/email.service");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");

const createUser = async (userBody) => {
  if (await User.findOne({ email: userBody.email })) {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
  }
  const info = User.create(userBody);
  await email.sendWelcomeEmail(userBody.email);
  return info;
};

const updateUserStatus = async (userDetails, status) => {
  const updatedUser = await User.findByIdAndUpdate(userDetails._id, status,
  {
    new: true,       
    runValidators: true 
  })

  return updatedUser
};

const userList = async () => {
  const data = await User.find()
  return data
};

const userDetails = async (id) => {
  const data = await User.findById(id)
  return data
};



module.exports = {
  createUser,
  updateUserStatus,
  userList,
  userDetails
};