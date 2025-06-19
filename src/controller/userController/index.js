const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const catchAsyncError = require("../../utils/catchAsync");
const { userService } = require("../../services");

exports.statusUpdate = catchAsyncError(async (req, res, next) => {
    const user = await userService.updateUserStatus(req.user, req.body);
    res.status(HTTP_STATUS_CODES.OK).send({data:user})
})


exports.users = catchAsyncError(async (req, res, next) => {
    const users = await userService.userList();
    res.status(HTTP_STATUS_CODES.OK).send({data:users})
})

exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    const user = await userService.userDetails(req.params.id);
    res.status(HTTP_STATUS_CODES.OK).send({data:user})
})