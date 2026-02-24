const multer = require('multer');

// Use memory storage so we don't clog up your server's hard drive with temporary files
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
    }
});

module.exports = upload;