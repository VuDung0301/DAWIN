/**
 * Các hàm tiện ích cho controllers
 */

/**
 * Tạo phản hồi thành công
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object|Array} data - Dữ liệu để trả về
 * @param {String} message - Thông báo tùy chọn
 */
exports.sendSuccessResponse = (res, statusCode, data, message = '') => {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Tạo phản hồi lỗi
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Thông báo lỗi
 */
exports.sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Tạo đối tượng phân trang
 * @param {Number} total - Tổng số item
 * @param {Number} page - Trang hiện tại
 * @param {Number} limit - Số item trên một trang
 * @returns {Object} - Đối tượng pagination
 */
exports.createPagination = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};
