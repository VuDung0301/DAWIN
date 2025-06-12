/**
 * Hàm bọc async để bắt lỗi và chuyển cho middleware xử lý lỗi
 * @param {Function} fn - Hàm async cần bọc
 * @returns {Function} - Middleware function
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 