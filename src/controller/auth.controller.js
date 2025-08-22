const { HTTP_STATUS_CODES } = require("@simple-node/http-status-codes");
const catchAsyncError = require("../utils/catchAsync");
const { userService, tokenService, authService } = require("../services");
const { SUCCESS_MESSAGES } = require("../helper/messages");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const { generateStrongPassword } = require("../utils/passwordGenerator");
const e = require("express");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = catchAsyncError(async (req, res, next) => {
    const user = await userService.createUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(HTTP_STATUS_CODES.CREATED).send({ data: user, tokens, message: SUCCESS_MESSAGES.CREATED });
})

exports.login = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(HTTP_STATUS_CODES.OK).send({ data: user, tokens });
});



exports.googleLogin = async (req, res, next) => {
    try {
        const { access_token } = req.body;

        // 1. Get Google user profile
        const googleUser = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const { email, name } = googleUser.data;

        if (googleUser.data) {
            // 2. Find or create local user
            let user = await userService.userDetailsByEmail(email);
            if (!user) {
                user = await userService.createUser({
                    email,
                    name,
                    password: generateStrongPassword(16), 
                });
            }
            user.status = "Available";
            await user.save();
            const tokens = await tokenService.generateAuthTokens(user);
            return res.status(HTTP_STATUS_CODES.OK).send({ data: user, tokens });
        }


    } catch (err) {
        next(err);
    }
};

exports.logout = catchAsyncError(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(HTTP_STATUS_CODES.NO_CONTENT).send();
});


exports.loggedInUserDetails = catchAsyncError(async (req, res) => {
    let user = req.user
    res.status(HTTP_STATUS_CODES.OK).send({ data: user });
})







