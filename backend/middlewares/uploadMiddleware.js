const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('File upload destination set to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `face_${Date.now()}${path.extname(file.originalname)}`;
    console.log('Generated filename for upload:', fileName);
    cb(null, fileName);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log('File filter check:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    isValidExt: extname,
    isValidMime: mimetype
  });

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB max file size
  fileFilter: fileFilter
});

module.exports = upload; 