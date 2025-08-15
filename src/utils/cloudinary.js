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
      const ext = file.originalname.split(".").pop().toLowerCase();

      const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
      const videoFormats = ["mp4", "mov", "avi", "mkv"];
      const rawFormats = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "xlsm", "ods"];
      const audioFormats = ["mp3", "wav", "ogg", "m4a"];

      let resource_type = "image"; // default

      if (videoFormats.includes(ext) || audioFormats.includes(ext)) {
        resource_type = "video";
      } else if (rawFormats.includes(ext)) {
        resource_type = "raw";
      }

      const baseParams = {
        folder: "chat_uploads",
        resource_type,
      };

      // Only add allowed_formats and transformation for images/videos
      if (resource_type === "image") {
        baseParams.allowed_formats = imageFormats;
        baseParams.transformation = [{ width: 800, height: 800, crop: "limit" }];
      } else if (resource_type === "video") {
        baseParams.allowed_formats = [...videoFormats, ...audioFormats]
      }

      return baseParams;
    } catch (error) {
      console.error("Error in Cloudinary params:", error);
      throw new Error("Failed to set Cloudinary params");
    }
  },
});
;

module.exports = { cloudinary, storage };
