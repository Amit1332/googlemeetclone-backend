const Project = require("../model/project.schema");
const ApiError = require("../utils/ApiError");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");

const createProject = async (ownerId, projectBody) => {
  const { name, organization, members } = projectBody;
  
  const project = await Project.create({
    name,
    organization,
    owner: ownerId,
    members: members || [],
  });

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
  return project;
};

module.exports = {
  createProject,
  getProjectsByOrg,
  getProjectById,
  addMembers,
};
