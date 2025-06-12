const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn lưu file
const UPLOAD_PATH = path.join(__dirname, '../../public/uploads');

// Đảm bảo thư mục upload tồn tại
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Tạo thư mục theo loại nếu chưa tồn tại
const createTypeFolder = (type) => {
  const typePath = path.join(UPLOAD_PATH, type);
  if (!fs.existsSync(typePath)) {
    fs.mkdirSync(typePath, { recursive: true });
  }
  return typePath;
};

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Xác định loại file (tours, flights, users)
    const fileType = req.params.type || 'common';
    const typePath = createTypeFolder(fileType);
    cb(null, typePath);
  },
  filename: (req, file, cb) => {
    // Tạo tên file theo định dạng: originalname-timestamp.extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${path.basename(file.originalname, fileExt)}-${Date.now()}${fileExt}`;
    cb(null, fileName);
  },
});

// Lọc file theo loại
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận image
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

// Cấu hình upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Xóa file
const deleteFile = (filePath) => {
  const fullPath = path.join(UPLOAD_PATH, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

// Lấy đường dẫn tương đối để lưu vào DB
const getRelativePath = (type, fileName) => {
  return `${type}/${fileName}`;
};

module.exports = {
  upload,
  deleteFile,
  getRelativePath,
  UPLOAD_PATH,
}; 