const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const User = require("../model/user.schema");
const email = require("../services/email.service");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const chatModel = require("../model/chat.schema");


const createUser = async (userBody) => {
  if (await User.findOne({ email: userBody.email })) {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
  }
  let data = {...userBody, status: "Available"}
  const info = User.create(data);
  // await email.sendWelcomeEmail(userBody.email);
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



const getChattedUsers = async (authUserId) => {
  // 1. Find all chats where logged in user is included
  const chats = await chatModel.find({
    users: authUserId,
    isGroupChat: false // Only one-to-one chats; remove if you want group users too
  }).populate("users", "-password");

  // 2. Extract other users from chats
  const otherUsers = [];
  chats.forEach(chat => {
    chat.users.forEach(u => {
      if (u._id.toString() !== authUserId.toString()) {
        otherUsers.push(u);
      }
    });
  });

  // 3. Remove duplicates based on _id
  const uniqueUsersMap = new Map();
  otherUsers.forEach(u => {
    uniqueUsersMap.set(u._id.toString(), u);
  });

  return Array.from(uniqueUsersMap.values());
};




const userDetailsByEmail = async (email) => {
  return await User.findOne({ email });
};



module.exports = {
  createUser,
  updateUserStatus,
  userList,
  userDetails,
  userDetailsByEmail,
  getChattedUsers
};