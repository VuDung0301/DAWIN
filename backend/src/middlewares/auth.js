const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware để bảo vệ các route yêu cầu đăng nhập
 */
exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra token từ header hoặc cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập để truy cập',
    });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin người dùng từ token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Lưu thông tin người dùng vào request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

/**
 * Middleware kiểm tra quyền truy cập
 * @param  {...String} roles Các quyền được phép truy cập
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tính năng này',
      });
    }
    next();
  };
};

/**
 * Middleware giới hạn truy cập theo vai trò (role)
 * @param  {...String} roles Các vai trò được phép truy cập
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tính năng này',
      });
    }
    next();
  };
}; 