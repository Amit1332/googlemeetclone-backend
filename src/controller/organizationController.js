const organizationService = require("../services/organization.service");

// ? Create Org
exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;

    const org = await organizationService.createOrganization(
      req.user._id,
      name
    );

    res.status(201).json({
      success: true,
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ? Get My Org
exports.getMyOrganization = async (req, res) => {
  try {
    const org = await organizationService.getMyOrganization(req.user._id);

    res.json({
      success: true,
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ? Add Member
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const org = await organizationService.addMember(
      req.params.id,
      userId,
      role
    );

    res.json({
      success: true,
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createMemberAccount = async (req, res) => {
  try {
    const result = await organizationService.createMemberAccount(req.params.id, req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: "Organization member account created successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ? Get Members
exports.getMembers = async (req, res) => {
  try {
    const members = await organizationService.getMembers(req.params.id);

    res.json({
      success: true,
      data: members,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const result = await organizationService.updateMember(req.params.id, req.params.userId, req.body);
    res.json({
      success: true,
      data: result,
      message: "Member updated successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetMemberPassword = async (req, res) => {
  try {
    const result = await organizationService.resetMemberPassword(req.params.id, req.params.userId);
    res.json({
      success: true,
      data: result,
      message: "Password reset successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ? Remove Member
exports.removeMember = async (req, res) => {
  try {
    const org = await organizationService.removeMember(
      req.params.id,
      req.params.userId
    );

    res.json({
      success: true,
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await organizationService.getAllOrganizations();

    res.status(200).json({
      success: true,
      count: orgs.length,
      data: orgs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ? Delete Organization (SuperAdmin)
exports.deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;

    await organizationService.deleteOrganization(orgId);

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
