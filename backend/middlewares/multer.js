const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const imageFilesPath = path.join(__dirname, '..', 'public', 'images', 'posts');

if (!fs.existsSync(imageFilesPath)) {
    fs.mkdirSync(imageFilesPath, { recursive: true });
}

// Storage for other files
const postImagesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imageFilesPath);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4();
        cb(null, uniqueFilename + path.extname(file.originalname));
    }
});

// Create Multer instances
const uploadImagesFiles = multer({ storage: postImagesStorage });

module.exports = {
    uploadImagesFiles
};
