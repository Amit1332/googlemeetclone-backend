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

const organizationService = require("./organization.service");

/**
 * Advanced Broadcast system handling 4 major cases:
 * 1. Org-wide: message + no projectId
 * 2. Project-wide: message + projectId
 * 3. Selective Project: message + projectId + targetUserIds
 * 4. Personalized: personalizedMessages array
 */
const broadcast = async (payload, orgId) => {
  const { senderId, message, projectId, targetUserIds, personalizedMessages } = payload;
  const results = [];

  // Case 4: Personalized Messages (Highest Priority)
  if (Array.isArray(personalizedMessages) && personalizedMessages.length > 0) {
    let project = null;
    if (projectId) {
      project = await projectService.getProjectById(projectId);
      if (project.organization.toString() !== orgId.toString()) {
        throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Unauthorized: Project belongs to another organization");
      }
    }

    for (const item of personalizedMessages) {
      const { userId, message: individualMessage } = item;
      try {
        const chat = await chatService.accessChat(senderId, { userId, isGroupChat: false });
        const newMessage = await messageService.sendMessage(senderId, {
          chatId: chat._id,
          message: individualMessage,
          broadcastSource: project ? project._id : null, // Add project branding if projectId was provided
        });
        results.push({ userId, status: "success", messageId: newMessage._id });
      } catch (error) {
        results.push({ userId, status: "failed", error: error.message });
      }
    }
    return { type: "personalized", projectId: projectId || null, processed: results };
  }

  // Case 1: Organization-wide Broadcast (No projectId provided)
  if (!projectId && message) {
    const members = await organizationService.getMembers(orgId);
    for (const member of members) {
      const userId = member.user?._id || member.user;
      if (userId.toString() === senderId.toString()) continue; // Skip sender

      try {
        const chat = await chatService.accessChat(senderId, { userId, isGroupChat: false });
        const newMessage = await messageService.sendMessage(senderId, {
          chatId: chat._id,
          message: message,
        });
        results.push({ userId, status: "success", messageId: newMessage._id });
      } catch (error) {
        results.push({ userId, status: "failed", error: error.message });
      }
    }
    return { type: "organization_wide", processed: results };
  }

  // Case 2 & 3: Project-based Broadcast
  if (projectId && message) {
    const project = await projectService.getProjectById(projectId);
    
    if (project.organization.toString() !== orgId.toString()) {
      throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Unauthorized: Project belongs to another organization");
    }

    const isSelective = Array.isArray(targetUserIds) && targetUserIds.length > 0;

    if (isSelective) {
      // Case 3: Selective Project Broadcast (DMs with Project Badge)
      const recipients = project.members.filter(m => targetUserIds.includes(m._id.toString()));
      
      for (const member of recipients) {
        try {
          const chat = await chatService.accessChat(senderId, { userId: member._id, isGroupChat: false });
          const newMessage = await messageService.sendMessage(senderId, {
            chatId: chat._id,
            message: message,
            broadcastSource: project._id,
          });
          results.push({ userId: member._id, status: "success", messageId: newMessage._id });
        } catch (error) {
          results.push({ userId: member._id, status: "failed", error: error.message });
        }
      }
      return { type: "selective_project", projectId, processed: results };
    } else {
      // Case 2: Project-wide Broadcast (Group Chat)
      if (!project.chatId) {
        throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Project does not have an associated group chat");
      }

      await chatService.inviteUserToGroupChat(project.owner, [senderId], project.chatId);
      const newMessage = await messageService.sendMessage(senderId, {
        chatId: project.chatId,
        message: message,
        broadcastSource: project._id,
      });
      
      return { type: "project_wide", projectId, chatId: project.chatId, messageId: newMessage._id, status: "success" };
    }
  }

  throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Invalid broadcast payload. Provide 'message' or 'personalizedMessages'.");
};

module.exports = {
  generateCredentials,
  getOrganizationCredentials,
  validateCredentials,
  broadcast,
};
