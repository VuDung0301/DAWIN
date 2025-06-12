/**
 * Middleware xử lý lỗi
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log lỗi để debug
  console.error(err.stack);

  // Lỗi ID không hợp lệ trong Mongoose
  if (err.name === 'CastError') {
    const message = 'Không tìm thấy dữ liệu';
    error = new Error(message);
    error.statusCode = 404;
  }

  // Lỗi trùng lặp key trong Mongoose
  if (err.code === 11000) {
    const message = 'Dữ liệu đã tồn tại';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Lỗi validation trong Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // Phản hồi lỗi
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Lỗi máy chủ',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler; 