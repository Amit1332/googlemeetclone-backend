const { projectService } = require("../services");
const catchAsync = require("../utils/catchAsync");
const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  res.status(HTTP_STATUS_CODES.CREATED).send({ data: project });
});

const getProjects = catchAsync(async (req, res) => {
  const orgId = req.user?.organization || req.integration?.organization;
  if (!orgId) {
    return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).send({ message: "Authentication required" });
  }
  const projects = await projectService.getProjectsByOrg(orgId);
  res.status(HTTP_STATUS_CODES.OK).send({ data: projects });
});

const getProject = catchAsync(async (req, res) => {
  const projectId = req.params.id;
  const project = await projectService.getProjectById(projectId);
  
  // Verify organization access
  const orgId = req.user?.organization || req.integration?.organization;
  if (project.organization.toString() !== orgId?.toString()) {
    return res.status(HTTP_STATUS_CODES.FORBIDDEN).send({ message: "Unauthorized access to this project" });
  }
  
  res.status(HTTP_STATUS_CODES.OK).send({ data: project });
});

const addMembers = catchAsync(async (req, res) => {
  const { projectId, memberIds } = req.body;
  const project = await projectService.addMembers(projectId, memberIds);
  res.status(HTTP_STATUS_CODES.OK).send({ data: project });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  addMembers,
};
