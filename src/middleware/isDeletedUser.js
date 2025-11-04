// middlewares/checkIsDeleted.js

const User = require("../model/user.schema");

const isDeletedUser = async (req, res, next) => {
  try {
 
    const user = await User.findOne({email:req.body.email})
   

    if (user && user.isDeleted) {
      return res.status(403).json({
        message: 'Your account has been deleted. Please contact support if this is an error.',
      });
    }
    next();

    // Proceed to next middleware or controller
  } catch (error) {
    console.error('checkIsDeleted error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = isDeletedUser;
