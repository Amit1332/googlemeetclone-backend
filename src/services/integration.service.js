const crypto = require("crypto");
const AppCredential = require("../model/appCredential.schema");
const projectService = require("./project.service");
const chatService = require("./chat.service");
const messageService = require("./message.service");
const ApiError = require("../utils/ApiError");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");

/**
 * Generates a new set of API credentials for an organization.
 */
const generateCredentials = async (orgId, appName) => {
  const clientId = `client_${crypto.randomBytes(8).toString("hex")}`;
  const clientSecret = crypto.randomBytes(24).toString("hex");

  const credential = await AppCredential.create({
    appName,
    organization: orgId,
    clientId,
    clientSecret,
  });

  return {
    appName,
    clientId,
    clientSecret, // Return plain secret only once
    message: "Store your clientSecret safely. It will not be shown again."
  };
};

/**
 * Lists all active integration credentials for an organization.
 */
const getOrganizationCredentials = async (orgId) => {
  return await AppCredential.find({ organization: orgId, isActive: true });
};

/**
 * Validates Client ID and Secret.
 */
const validateCredentials = async (clientId, clientSecret) => {
  const credential = await AppCredential.findOne({ clientId, isActive: true }).select("+clientSecret");
  if (!credential) {
    throw new ApiError(HTTP_STATUS_CODES.UNAUTHORIZED, "Invalid Client ID");
  }

  const isMatch = await credential.compareSecret(clientSecret);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS_CODES.UNAUTHORIZED, "Invalid Client Secret");
  }

  return credential;
};

/**
 * Broadcasts a message to project members.
 * @param {string} projectId 
 * @param {string} senderId 
 * @param {string} messageText 
 * @param {string} orgId 
 * @param {string[]} targetUserIds - Optional subset of members
 */
const broadcastToProject = async (projectId, senderId, messageText, orgId, targetUserIds = []) => {
  const project = await projectService.getProjectById(projectId);
  
  if (project.organization.toString() !== orgId.toString()) {
    throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Unauthorized: Project belongs to another organization");
  }

  // Determine who receives the message
  let recipients = project.members;
  const isSubset = targetUserIds && targetUserIds.length > 0;

  if (isSubset) {
    const memberIdSet = new Set(project.members.map(m => m._id.toString()));
    recipients = project.members.filter(m => targetUserIds.includes(m._id.toString()));
    
    // Ensure all target users are actually members of the project
    if (recipients.length !== targetUserIds.length) {
      throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "One or more target users are not members of this project");
    }
  }

  const results = [];

  if (isSubset) {
    // Private Project Broadcast: Send individual messages to selected users
    for (const member of recipients) {
      try {
        const chat = await chatService.accessChat(senderId, { userId: member._id, isGroupChat: false });
        const newMessage = await messageService.sendMessage(senderId, {
          chatId: chat._id,
          message: messageText,
          broadcastSource: project._id, // Attach project branding
        });
        results.push({ userId: member._id, status: "success", messageId: newMessage._id });
      } catch (error) {
        results.push({ userId: member._id, status: "failed", error: error.message });
      }
    }
  } else {
    // Public Project Broadcast: Send to Group Chat
    if (!project.chatId) {
      throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Project does not have an associated group chat");
    }

    await chatService.inviteUserToGroupChat(project.owner, [senderId], project.chatId);
    const newMessage = await messageService.sendMessage(senderId, {
      chatId: project.chatId,
      message: messageText,
      broadcastSource: project._id,
    });
    
    results.push({ chatId: project.chatId, status: "success", messageId: newMessage._id });
  }

  return {
    projectId,
    projectChatId: project.chatId,
    isPrivateBroadcast: isSubset,
    processed: results,
  };
};

module.exports = {
  generateCredentials,
  getOrganizationCredentials,
  validateCredentials,
  broadcastToProject,
};
