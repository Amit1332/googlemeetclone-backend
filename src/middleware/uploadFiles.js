const upload = require('../utils/multer');
exports.uploadFiles = (req, res, next) => {
    try {
        upload.array("files", 10)(req, res, (err) => {
          if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return res.status(400).json({ message: "File size cannot exceed 10 MB" });
            }
            return res.status(400).json({ message: err.message });
          }
          next();
        }); 
    } catch (error) {
        console.error("Error in uploadFiles middleware:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};