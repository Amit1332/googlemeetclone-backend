const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const User = require("../model/user.schema");
const email = require("../services/email.service");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES } = require("../helper/messages");
const chatModel = require("../model/chat.schema");
const bcrypt = require("bcryptjs");

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


const uploadProfilePicture = async (userId, fileData) => {
  if (!fileData || !fileData.path) {
    throw new Error("No file data provided");
  }

  // If you store images on local or cloud storage, 
  // store the accessible URL in profilePicture.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePicture: fileData.path },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedUser;
};

const updateProfile = async (userId, updateData) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,  
    updateData,
    {
      new: true,
      runValidators: true,
    })
  return updatedUser;
}


const resetPassword = async (userId, passwordData) => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;

  if (newPassword !== confirmPassword) {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Passwords do not match");
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new ApiError(
      HTTP_STATUS_CODES.UNAUTHORIZED,
      ERROR_MESSAGES.INCORRECT_CREDENTIALS
    );
  }

  user.password = newPassword;
  await user.save(); // triggers validation, timestamps, etc.

  return { message: "Password reset successful" };
};

const toggleUserStatus = async (userId, isActive) => {
  if (typeof isActive !== 'boolean') {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "isActive must be true or false");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return user;
};


/**
 * 🗑️ Soft Delete User Account
 */
const deleteUserAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true, isActive: false },
    { new: true }
  );

  if (!user) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return user;
};


    

const userList = async () => {
  const data = await User.find({isActive:true, isDeleted: { $ne: true }})
  return data
};

const userDetails = async (id) => {
  const data = await User.findById(id)
  return data
};



// const getChattedUsers = async (authUserId) => {
//   // 1. Find all chats where logged in user is included
//   const chats = await chatModel.find({
//     users: authUserId,
//     isGroupChat: false // Only one-to-one chats; remove if you want group users too
//   }).populate("users", "-password");

//   // 2. Extract other users from chats
//   const otherUsers = [];
//   chats.forEach(chat => {
//     chat.users.forEach(u => {
//       if (u._id.toString() !== authUserId.toString()) {
//         otherUsers.push(u);
//       }
//     });
//   });

//   // 3. Remove duplicates based on _id
//   const uniqueUsersMap = new Map();
//   otherUsers.forEach(u => {
//     uniqueUsersMap.set(u._id.toString(), u);
//   });

//   return Array.from(uniqueUsersMap.values());
// };

const getChattedUsers = async (authUserId) => {
  const chats = await chatModel.find({
    users: authUserId
  })
  .populate({
    path: "users",
    match: { isActive: true, isDeleted: { $ne: true } },
    select: "-password"
  })
  .populate("groupAdmin", "-password")
  .populate("latestMessage");

  const result = [];
  const seen = new Set();

  // For project-linked chats, we must find the latest message VISIBLE to this user
  // to avoid privacy leaks in the sidebar preview.
  const processedChats = await Promise.all(chats.map(async (chat) => {
    const chatObj = chat.toObject();
    
    if (chat.broadcastSource) {
      const latestVisibleMessage = await messageModel.findOne({
        chat: chat._id,
        $or: [
          { recipient: null },
          { sender: authUserId },
          { recipient: authUserId }
        ]
      })
      .sort({ createdAt: -1 })
      .populate("sender", "name")
      .populate("recipient", "name");
      
      chatObj.latestMessage = latestVisibleMessage;
    }
    
    return chatObj;
  }));

  const getLastActivityAt = (chat) =>
    chat?.latestMessage?.createdAt || chat?.updatedAt || chat?.createdAt || null;

  processedChats
  .sort((firstChat, secondChat) => {
    const firstActivity = new Date(getLastActivityAt(firstChat) || 0).getTime();
    const secondActivity = new Date(getLastActivityAt(secondChat) || 0).getTime();
    return secondActivity - firstActivity;
  })
  .forEach(chat => {
    const lastActivityAt = getLastActivityAt(chat);

    if (chat.isGroupChat) {
      if (!seen.has(String(chat._id))) {
        result.push({
          type: "group",
          lastActivityAt,
          latestMessage: chat.latestMessage || null,
          ...chat
        });
        seen.add(String(chat._id));
      }
    } else {
      chat.users.forEach(u => {
        if (u && String(u._id) !== String(authUserId)) {
          if (!seen.has(String(u._id))) {
            result.push({
              type: "user",
              lastActivityAt,
              latestMessage: chat.latestMessage || null,
              ...u
            });
            seen.add(String(u._id));
          }
        }
      });
    }
  });

  return result;
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
  getChattedUsers,
  uploadProfilePicture,
  updateProfile,
  resetPassword,
  toggleUserStatus,
  deleteUserAccount
};
