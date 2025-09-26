// utils/cloudinaryStorage.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      return {
        folder: "chat_uploads",
        resource_type: "auto", // automatically detect (image, video, raw, audio, pdf, zip, etc.)
      };
    } catch (error) {
      console.error("Error in Cloudinary params:", error);
      throw new Error("Failed to set Cloudinary params");
    }
  },
});

module.exports = { cloudinary, storage };
