/**
 * Hàm bọc async để bắt lỗi và chuyển cho middleware xử lý lỗi
 * Tương tự express-async-handler và catchAsync
 * @param {Function} fn - Hàm async cần bọc
 * @returns {Function} - Middleware function
 */
module.exports = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 