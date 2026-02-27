const multer = require('multer');

// ✅ MUST use memoryStorage so the buffer is passed to Python
const storage = multer.memoryStorage(); 

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per frame
});

module.exports = upload;