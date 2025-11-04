const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const catchAsyncError = require("../../utils/catchAsync");
const { userService } = require("../../services");

exports.statusUpdate = catchAsyncError(async (req, res, next) => {
    const user = await userService.updateUserStatus(req.user, req.body);
    res.status(HTTP_STATUS_CODES.OK).send({data:user})
})


exports.uploadProfilePicture = catchAsyncError(async (req, res) => {
  // Validate file size (max 10 MB per file)
  if (req.files && req.files.some(file => file.size > 10 * 1024 * 1024)) {
    return res.status(400).json({ message: "File size cannot exceed 10 MB" });
  }
  console.log("Files received:", req.files);

  if (!req.files || req.files.length === 0) {
    return res.status(404).json({ message: "No files uploaded" });
  }

  // Prepare file URLs (assuming you’re using multer for upload)
  const fileUrls = req.files.map(file => ({
    path: file.path,
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
  }));

  // Only take the first file if user can have one profile picture
  const newProfile = await userService.uploadProfilePicture(
    req.user._id,
    fileUrls[0]
  );

  res.status(HTTP_STATUS_CODES.OK).json({
    message: "Profile picture uploaded successfully",
    data: newProfile,
  });
});


exports.uploadProfile = catchAsyncError(async (req, res, next) => {
    const updatedUser = await userService.updateProfile(req.user._id, req.body);
    res.status(HTTP_STATUS_CODES.OK).send({data:updatedUser, message: "Profile updated successfully"})
})


exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const updatedUser = await userService.resetPassword(req.user._id, req.body);
    res.status(HTTP_STATUS_CODES.OK).send({data:updatedUser, message: "Password updated successfully"})
})


exports.toggleUserStatus = catchAsyncError(async (req, res) => {
  const { isActive } = req.body;
  const user = await userService.toggleUserStatus(req.user._id, isActive);

  res.status(HTTP_STATUS_CODES.OK).json({
    message: isActive ? 'Account activated successfully' : 'Account deactivated successfully',
    data: user,
  });
});


exports.deleteUserAccount = catchAsyncError(async (req, res) => {
  const user = await userService.deleteUserAccount(req.user._id);

  res.status(HTTP_STATUS_CODES.OK).json({
    message: 'Account deleted successfully (soft delete)',
    data: { userId: user._id },
  });
});

exports.users = catchAsyncError(async (req, res, next) => {
    const users = await userService.userList();
    res.status(HTTP_STATUS_CODES.OK).send({data:users})
})

exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    const user = await userService.userDetails(req.params.id);
    res.status(HTTP_STATUS_CODES.OK).send({data:user})
})

exports.chattedUsers = catchAsyncError(async (req, res, next) => {
    const users = await userService.getChattedUsers(req.user._id);
    res.status(HTTP_STATUS_CODES.OK).send({ data: users });
});