const jwt = require("jsonwebtoken");
const moment = require("moment");
const { tokenTypes } = require("../helper/token");
const config = require("../config/config");

const generateToken = (
  userId,
  expires,
  type,
//   role,
  secret = config.jwt.secret
) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    // role,
  };
  return jwt.sign(payload, secret);
};

const generateAuthTokens = async (user) => {
    const accessTokenExpires = moment().add(
      config.jwt.accessExpirationMinutes,
      "minutes"
    );
    const accessToken = generateToken(
      user._id,
      accessTokenExpires,
      tokenTypes.ACCESS
    );
  
    const refreshTokenExpires = moment().add(
      config.jwt.refreshExpirationDays,
      "days"
    );
    const refreshToken = generateToken(
      user._id,
      refreshTokenExpires,
      tokenTypes.REFRESH
    );
  
    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
    };
  };

module.exports = {
  generateToken,
  generateAuthTokens,
};