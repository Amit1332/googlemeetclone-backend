// middleware/superAdmin.js
module.exports = function isSuperAdmin(req, res, next) {
  try {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Superadmin only."
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