const Joi = require('joi');
const { password } = require("./custom.validation");

const register = {
  body: Joi.object().keys({
    name: Joi.string() .min(5)
    .max(10),
    email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().required().custom(password),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
};
   
