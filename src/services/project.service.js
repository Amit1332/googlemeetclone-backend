const Project = require("../model/project.schema");
const ApiError = require("../utils/ApiError");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");
const chatService = require("./chat.service");

const createProject = async (ownerId, projectBody) => {
  const { name, organization, members } = projectBody;
  
  // Create a group chat for the project
  // Filter out the owner from members if they are already there to avoid duplicates in allUsers
  const otherMembers = (members || []).filter(m => m.toString() !== ownerId.toString());
  
  const groupChat = await chatService.createGroupChat(ownerId, `Project: ${name}`, otherMembers);

  // 🔥 Set project context on the chat document immediately
  groupChat.broadcastSource = null; // We'll set it properly after project is created
  await groupChat.save();

  const project = await Project.create({
    name,
    organization,
    owner: ownerId,
    members: members || [],
    chatId: groupChat._id,
  });

  // Now link the chat back to the project
  groupChat.broadcastSource = project._id;
  await groupChat.save();

  return project;
};

const getProjectsByOrg = async (orgId) => {
  return await Project.find({ organization: orgId }).populate("members", "-password");
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId).populate("members", "-password");
  if (!project) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Project not found");
  }
  return project;
};

const addMembers = async (projectId, memberIds) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Project not found");
  }

  // Add only unique members
  const currentMembers = project.members.map(m => m.toString());
  const newMembers = memberIds.filter(id => !currentMembers.includes(id));
  
  project.members.push(...newMembers);
  await project.save();

  // Sync with group chat
  if (project.chatId) {
    await chatService.inviteUserToGroupChat(project.owner, project.members.map(m => m.toString()), project.chatId);
  }

  return project;
};

module.exports = {
  createProject,
  getProjectsByOrg,
  getProjectById,
  addMembers,
};
