// middleware/orgAdmin.js

const Organization = require("../model/organization.schema");

module.exports = async function isOrgAdmin(req, res, next) {
  try {
    const orgId = req.params.id; // from route

    const org = await Organization.findById(orgId);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    const member = org.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this organization"
      });
    }

    if (member.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};