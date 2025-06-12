const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token và thiết lập cookie
 * @param {Object} user - Thông tin người dùng
 * @param {Object} res - Response object
 */
exports.sendToken = (user, statusCode, res) => {
  // Tạo JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Thiết lập options cho cookie
  const cookieOptions = {
    httpOnly: true,
  };

  // Tính toán thời gian hết hạn cho cookie
  const expiresInValue = process.env.JWT_EXPIRES_IN;
  if (expiresInValue) {
    let expiresInMs = 0;
    
    if (expiresInValue.endsWith('d')) {
      // Nếu là ngày (ví dụ: 7d)
      const days = parseInt(expiresInValue.slice(0, -1), 10);
      expiresInMs = days * 24 * 60 * 60 * 1000;
    } else if (expiresInValue.endsWith('h')) {
      // Nếu là giờ (ví dụ: 12h)
      const hours = parseInt(expiresInValue.slice(0, -1), 10);
      expiresInMs = hours * 60 * 60 * 1000;
    } else if (expiresInValue.endsWith('m')) {
      // Nếu là phút (ví dụ: 30m)
      const minutes = parseInt(expiresInValue.slice(0, -1), 10);
      expiresInMs = minutes * 60 * 1000;
    } else {
      // Nếu là số nguyên (milliseconds)
      expiresInMs = parseInt(expiresInValue, 10);
    }

    // Thiết lập thời gian hết hạn
    cookieOptions.expires = new Date(Date.now() + expiresInMs);
  }

  // Secure cookie nếu ở môi trường production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // Loại bỏ password từ output
  user.password = undefined;

  // Thiết lập cookie
  res.cookie('jwt', token, cookieOptions);

  // Trả về response
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
}; 