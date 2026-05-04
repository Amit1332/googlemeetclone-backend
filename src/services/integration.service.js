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
 * Broadcasts a message to all members of a project.
 * @param {string} projectId 
 * @param {string} senderId 
 * @param {string} messageText 
 * @param {string} orgId - To ensure multi-tenant safety
 */
const broadcastToProject = async (projectId, senderId, messageText, orgId) => {
  const project = await projectService.getProjectById(projectId);
  
  // Ensure the project belongs to the same organization that owns the credentials
  if (project.organization.toString() !== orgId.toString()) {
    throw new ApiError(HTTP_STATUS_CODES.FORBIDDEN, "Unauthorized: Project belongs to another organization");
  }

  if (!project.chatId) {
    throw new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, "Project does not have an associated group chat");
  }

  // Ensure the sender is in the group chat so the message is visible and valid
  await chatService.inviteUserToGroupChat(project.owner, [senderId], project.chatId);

  const newMessage = await messageService.sendMessage(senderId, {
    chatId: project.chatId,
    message: messageText,
  });

  return {
    projectId,
    chatId: project.chatId,
    messageId: newMessage._id,
    status: "success",
  };
};

module.exports = {
  generateCredentials,
  getOrganizationCredentials,
  validateCredentials,
  broadcastToProject,
};
