const express = require('express');
const router = express.Router();
const tourBookingController = require('../controllers/tourBookingController');
const authMiddleware = require('../middlewares/auth');

// Route công khai cho kiểm tra khả dụng tour
router.post('/check-availability', tourBookingController.checkTourAvailability);

// API chi tiết booking với thông tin đầy đủ (công khai)
router.get('/:id/details', tourBookingController.getTourBookingDetails);

// Các route cần đăng nhập
router.use(authMiddleware.protect);

// Lấy tất cả booking của user hiện tại
router.get('/me', tourBookingController.getMyBookings);

// Tạo booking mới (chỉ user thường)
router.post('/', authMiddleware.restrictTo('user'), tourBookingController.createBooking);

// Chi tiết booking cho confirmation - cần đăng nhập
router.get('/:id', tourBookingController.getTourBooking);

// Lấy payment của booking - cần đăng nhập nhưng không giới hạn quyền
router.get('/:id/payment', tourBookingController.getBookingPayment);

// Cập nhật trạng thái booking
router.put('/:id/status', tourBookingController.updateBookingStatus);

// Hủy booking - người dùng có thể hủy booking của chính họ
router.delete('/:id', tourBookingController.cancelBooking);
router.post('/:id/cancel', tourBookingController.cancelBooking);

// Route dành cho admin
router.use(authMiddleware.restrictTo('admin'));

// API riêng cho admin lấy tất cả bookings
router.get('/admin/all-bookings', tourBookingController.getAllBookings);
router.get('/', tourBookingController.getAllBookings); // Giữ lại cho tương thích

module.exports = router; 