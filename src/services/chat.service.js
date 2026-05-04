const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const ApiError = require("../utils/ApiError");
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../helper/messages");
const chatModel = require("../model/chat.schema");
const messageModel = require("../model/message.schema");
const userModel = require("../model/user.schema")


const accessChat = async (authId, payload) => {
  // Prevent self-chat logic
  const { userId, isGroupChat } = payload;
  
  if (isGroupChat) {
    console.log("userId", userId);
    let groupChat = await chatModel
    .findOne({
      _id: userId,
      isGroupChat: true,
    })
      .populate("users", "-password")
      .populate("latestMessage");
       console.log("groupChat", groupChat);
      if (!groupChat) {
        throw new Error("Group chat not found");
      }
      
     
      return groupChat;
    }


 let chat;

  if (String(authId) === String(userId)) {
    chat = await chatModel
      .findOne({
        isGroupChat: false,
        users: { $eq: userId },
        $and: [
          { users: { $eq: userId } },
          { users: { $size: 1 } }, // Only one user in "self chat"
        ],
      })
      .populate("users", "-password")
      .populate("latestMessage");
  } else {
    chat = await chatModel
      .findOne({
        isGroupChat: false,
        users: { $all: [authId, userId], $size: 2 },
      })
      .populate("users", "-password")
      .populate("latestMessage");
  }

  if (chat) return chat;

  /** Otherwise → Create new chat */
  chat = await chatModel.create({
    chatName: "sender",
    isGroupChat: false,
    users:
      String(authId) === String(userId)
        ? [authId]
        : [authId, userId],
  });

  return chat;
};



const deleteChat = async (authUserId, otherUserId) => {
  // Find the chat between the authenticated user and the given userId
  console.log("authUserId", authUserId, "otherUserId", otherUserId);
  
  const chat = await chatModel.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: authUserId } } },
      { users: { $elemMatch: { $eq: otherUserId } } }
    ]
  });

  if (!chat) {
    throw new ApiError(
      HTTP_STATUS_CODES.NOT_FOUND,
      ERROR_MESSAGES.CHAT_NOT_FOUND || "Chat not found"
    );
  }

  // Delete all messages linked to this chat
  await messageModel.deleteMany({ chat: chat._id });

  // Delete the chat itself
  await chatModel.findByIdAndDelete(chat._id);

 return { message: SUCCESS_MESSAGES.DELETED_CHAT };
};


const createGroupChat = async (authUserId, groupName, users) => {
  if (!groupName || !users || users.length === 0) {
    throw new ApiError(
      HTTP_STATUS_CODES.BAD_REQUEST,
      "Group name and users are required"
    );
  }

  // Ensure auth user is included
  const allUsers = [...new Set([...users, authUserId])];

  if (allUsers.length < 2) {
    throw new ApiError(
      HTTP_STATUS_CODES.BAD_REQUEST,
      "A group must include at least 1 member + admin"
    );
  }
    const userDocs = await userModel.find({ _id: { $in: allUsers } });

  // 🔥 Get org of creator
  const creator = userDocs.find(u => u._id.toString() === authUserId.toString());
  const orgId = creator.organization;

  // 🔥 Check all users belong to same org
  const isSameOrg = userDocs.every(
    u => String(u.organization) === String(orgId)
  );

    if (!isSameOrg) {
    throw new ApiError(403, "All users must belong to same organization");
  }

 const groupChat = await chatModel.create({
    chatName: groupName,
    isGroupChat: true,
    users: allUsers,
    groupAdmin: authUserId,
    organization: orgId // ✅ important
  });

  return await chatModel
    .findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
};


const updateGroupChat = async (authUser, chatId, newName, groupPicture) => {
  const chat = await chatModel.findById(chatId);

  if (!chat || !chat.isGroupChat) {
    throw new ApiError(
      HTTP_STATUS_CODES.NOT_FOUND,
      ERROR_MESSAGES.CHAT_NOT_FOUND || "Group not found"
    );
  }
  if (String(chat.organization) !== String(authUser.organization)) {
  throw new Error("Access denied (different organization)");
}

  if (String(chat.groupAdmin) !== String(authUser._id)) {
    throw new ApiError(
      HTTP_STATUS_CODES.FORBIDDEN,
      "Only the group admin can rename the group"
    );
  }

  chat.chatName = newName;
  if(groupPicture){
    chat.groupPicture = groupPicture;
  }
  await chat.save();

  return chat;
};



const  exitGroupChat = async (authUser, chatId) => {
  const chat = await chatModel.findById(chatId);

  if (!chat) throw new Error("Group not found");
  if (!chat.isGroupChat) throw new Error("Not a group chat");

   if (String(chat.organization) !== String(authUser.organization)) {
  throw new Error("Access denied (different organization)");
}

  // Check if user is already not in group
  if (!chat.users.includes(authUser._id)) {
    throw new Error("You are not a member of this group");
  }

  // Prevent group admin from leaving if they are the only admin
  if (chat.groupAdmin.toString() === authUser._id.toString()) {
    throw new Error("Group admin cannot leave. Transfer admin first.");
  }

  // Remove user from group
 chat.users = chat.users.filter(u => u.toString() !== authUser._id.toString());


  await chat.save();

  return chat;
};

const  removeUserFromGroupChat = async (userId, chatId) => {
  const chat = await chatModel.findById(chatId);

  if (!chat) throw new Error("Group not found");
  if (!chat.isGroupChat) throw new Error("Not a group chat");

  // Check if user is already not in group
  if (!chat.users.includes(userId)) {
    throw new Error("You are not a member of this group");
  }

  // Prevent group admin from leaving if they are the only admin
  if (chat.groupAdmin.toString() === userId.toString()) {
    throw new Error("Group admin cannot leave. Transfer admin first.");
  }

  // Remove user from group
 chat.users = chat.users.filter(u => u.toString() !== userId.toString());


  await chat.save();

  return chat;
};


const  inviteUserToGroupChat = async (authId, userIds, chatId) => {
  const chat = await chatModel.findById(chatId);

  if (!chat) throw new Error("Group not found");
  if (!chat.isGroupChat) throw new Error("Not a group chat");

  // Prevent group admin from leaving if they are the only admin
  if (chat.groupAdmin.toString() !== authId.toString()) {
    throw new Error("Only Group admin can invite users.");
  }

 const uniqueUsers = new Set([
  ...chat.users.map(u => u.toString()),
  ...userIds
]);

chat.users = Array.from(uniqueUsers);


  await chat.save();

  return chat;
};




const  deleteGroupChat = async (authUser, chatId) => {
  const chat = await chatModel.findById(chatId);

  if (!chat) throw new Error("Group not found");
  if (!chat.isGroupChat) throw new Error("Not a group chat");

  if (String(chat.organization) !== String(authUser.organization)) {
  throw new Error("Access denied");
}

  // Check if user is group admin
  if (chat.groupAdmin.toString() !== authUser._id.toString()) {
    throw new Error("Only group admin can delete this group");
  }

  // Delete all messages first (optional but recommended)
  await messageModel.deleteMany({ chat: chatId });

  // Delete group chat
  await chatModel.findByIdAndDelete(chatId);

  return "Group deleted successfully";
};






module.exports = {
accessChat,
deleteChat,
createGroupChat,
updateGroupChat,
exitGroupChat,
deleteGroupChat,
removeUserFromGroupChat,
inviteUserToGroupChat
};