const express = require('express');
const {
  getAllFlightBookings,
  getMyFlightBookings,
  createFlightBooking,
  getFlightBookingById,
  updateBookingStatus,
  deleteFlightBooking,
  cancelFlightBooking,
  getFlightBookingDetails
} = require('../controllers/flightBookingController');
const { protect, authorize } = require('../middlewares/auth');
const FlightBooking = require('../models/FlightBooking');
const Payment = require('../models/Payment');

const router = express.Router();

// API chi tiết booking với thông tin đầy đủ (công khai)
router.get('/:id/details', getFlightBookingDetails);

// Các route yêu cầu xác thực
router.use(protect);

// Route để lấy đặt vé máy bay của người dùng đăng nhập
router.get('/me', getMyFlightBookings);

// Route để tạo đặt vé máy bay mới - cả admin và user đều có thể dùng
router.post('/', createFlightBooking);

// Route để lấy chi tiết đặt vé theo ID - cả admin và user (chủ booking) đều có thể xem
router.get('/:id', getFlightBookingById);

// Route để hủy đặt vé - cả admin và user (chủ booking) đều có thể hủy
router.put('/:id/cancel', cancelFlightBooking);

// Các route chỉ dành cho admin
router.get('/all', authorize('admin'), getAllFlightBookings);
router.delete('/:id', authorize('admin'), deleteFlightBooking);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

// Lấy thông tin thanh toán cho booking
router.get('/:id/payment', protect, async (req, res) => {
  try {
    // Cache response 30 phút để tránh spam
    res.set('Cache-Control', 'public, max-age=1800');
    
    const bookingId = req.params.id;
    
    // Kiểm tra xem booking tồn tại không
    const booking = await FlightBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đặt vé'
      });
    }
    
    // Kiểm tra quyền truy cập (chỉ user tạo booking hoặc admin mới có quyền)
    const bookingUserId = booking.user?._id || booking.user;
    if ((bookingUserId && bookingUserId.toString() !== req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông tin này'
      });
    }
    
    // Chuyển hướng sang payment controller để xử lý thống nhất
    res.redirect(307, `/api/payments/booking/flight/${bookingId}`);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thanh toán',
      error: error.message
    });
  }
});

module.exports = router; 