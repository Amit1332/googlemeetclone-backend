// utils/multer.js
const multer = require("multer");
const { storage } = require("./cloudinary");

const upload = multer({ storage }); // ✅ stores files directly to Cloudinary

module.exports = upload;
