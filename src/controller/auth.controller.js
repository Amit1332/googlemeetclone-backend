const {HTTP_STATUS_CODES} = require("@simple-node/http-status-codes");
const catchAsyncError = require("../utils/catchAsync");
const { userService, tokenService, authService } = require("../services");
const { SUCCESS_MESSAGES } = require("../helper/messages");

exports.register = catchAsyncError(async (req, res, next) => {
    const user = await userService.createUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(HTTP_STATUS_CODES.CREATED).send({ data:user, tokens, message: SUCCESS_MESSAGES.CREATED});
})

exports.login = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(HTTP_STATUS_CODES.OK).send({ data:user, tokens});
  });
  
exports.logout = catchAsyncError(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(HTTP_STATUS_CODES.NO_CONTENT).send();
});


exports.loggedInUserDetails = catchAsyncError(async (req, res) => {
    let user = req.user
    res.status(HTTP_STATUS_CODES.OK).send({ data:user});
})







