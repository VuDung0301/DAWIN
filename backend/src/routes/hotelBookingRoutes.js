const express = require('express');
const router = express.Router();
const hotelBookingController = require('../controllers/hotelBookingController');
const authMiddleware = require('../middlewares/auth');

// Route công khai cho kiểm tra phòng khả dụng
router.post('/check-availability', hotelBookingController.checkRoomAvailability);
router.post('/check-auto-availability', hotelBookingController.checkAutoRoomAvailability);

// API chi tiết booking với thông tin đầy đủ (công khai)
router.get('/:id/details', hotelBookingController.getHotelBookingDetails);

// Các route yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Lấy đặt phòng của user hiện tại (phải đặt TRƯỚC route /:id)
router.get('/me', hotelBookingController.getMyHotelBookings);

// Tạo đặt phòng mới
router.post('/', hotelBookingController.createHotelBooking);

// Hủy đặt phòng
router.put('/:id/cancel', hotelBookingController.cancelHotelBooking);

// Lấy payment của booking - cần đăng nhập nhưng không giới hạn quyền
router.get('/:id/payment', hotelBookingController.getBookingPayment);

// Route xem chi tiết đặt phòng - phải đặt SAU /me
router.get('/:id', hotelBookingController.getHotelBooking);

// Các route chỉ dành cho admin
router.use(authMiddleware.restrictTo('admin'));

// Quản lý đặt phòng (chỉ admin)
router.get('/admin/all-bookings', hotelBookingController.getAllHotelBookings);
router.get('/', hotelBookingController.getAllHotelBookings);
router.put('/:id/status', hotelBookingController.updateBookingStatus);

module.exports = router; 