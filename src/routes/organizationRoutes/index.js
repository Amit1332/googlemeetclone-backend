
const express = require('express')
const auth = require('../../middleware/auth');
const { uploadFiles } = require('../../middleware/uploadFiles');
const orgController = require('../../controller/organizationController');
const isOrgAdmin = require('../../middleware/isOrgAdmin');
const isSuperAdmin = require('../../middleware/isSuperAdmin');
const Router = express.Router()


Router.post("/", auth.isAuthenticatedUser,  orgController.createOrganization);
Router.get("/me", auth.isAuthenticatedUser, orgController.getMyOrganization);

Router.post("/:id/members", auth.isAuthenticatedUser, isOrgAdmin, orgController.addMember);
Router.post("/:id/members/create-account", auth.isAuthenticatedUser, isOrgAdmin, orgController.createMemberAccount);
Router.get("/:id/members", auth.isAuthenticatedUser,isOrgAdmin, orgController.getMembers);
Router.put("/:id/members/:userId", auth.isAuthenticatedUser, isOrgAdmin, orgController.updateMember);
Router.post("/:id/members/:userId/reset-password", auth.isAuthenticatedUser, isOrgAdmin, orgController.resetMemberPassword);
Router.delete("/:id/members/:userId", auth.isAuthenticatedUser,isOrgAdmin, orgController.removeMember);
Router.get(
  "/",
  auth.isAuthenticatedUser,
  isSuperAdmin,
  orgController.getAllOrganizations
);

Router.delete(
  "/:id",
  auth.isAuthenticatedUser,
  isSuperAdmin,
  orgController.deleteOrganization
);

module.exports = Router
