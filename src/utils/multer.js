// utils/multer.js
const multer = require("multer");
const { storage } = require("./cloudinary");

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB in bytes
});

module.exports = upload;
