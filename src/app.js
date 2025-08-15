const express = require('express')
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const cors = require('cors')
const baseRoutes = require('./routes');
const { authLimiter } = require('./middleware/rateLimiter');
const { errorConverter, errorHandler } = require('./middleware/error');
const config = require('./config/config');
const morgan = require("./utils/morgan");
const ApiError = require('./utils/ApiError');
const { HTTP_STATUS_CODES } = require('@simple-node/http-status-codes');
const app = express()

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
//middleware
app.use(cors());
app.options("*", cors());
app.use(express.json({ limit: '10kb' }))

app.use(
  helmet({
    dnsPrefetchControl: false,
    frameguard: false,
    ieNoOpen: false
  })
)

app.use(
  mongoSanitize({
    allowDots: true,
  }),
);
app.use(xss())
// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use("/api/v1/auth", authLimiter);
}

// Base routes
app.use('/api/v1', baseRoutes)

app.use("/ping", (req, res) => {
  return res.json({});
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Not found"));
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size cannot exceed 10 MB' });
  }
  next(err);
});

app.use(errorConverter);

// handle error
app.use(errorHandler);

//export app
module.exports = app
