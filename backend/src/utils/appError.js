/**
 * Lớp định nghĩa lỗi ứng dụng để xử lý lỗi nhất quán
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Tạo một instance của AppError
   * @param {string} message - Thông báo lỗi
   * @param {number} statusCode - HTTP Status code
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; 