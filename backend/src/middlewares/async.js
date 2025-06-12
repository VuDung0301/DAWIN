/**
 * Middleware bọc hàm async để xử lý lỗi
 * @param {Function} fn - Hàm async cần được bọc
 * @returns {Function} - Hàm middleware mới đã được bọc
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 