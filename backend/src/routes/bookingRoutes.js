const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  getMyBookings,
  testBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Routes không cần đăng nhập
router.post('/test', testBooking);

// Routes cho người dùng đã đăng nhập
router.use(protect);

// Routes cho tất cả người dùng đã đăng nhập
router.get('/me', getMyBookings);
router.post('/', createBooking);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

// Routes chỉ cho admin
router.get('/admin/all-bookings', authorize('admin'), getBookings);
router.get('/', authorize('admin'), getBookings);
router.put('/:id/status', authorize('admin'), updateBookingStatus);
router.put('/:id/payment', authorize('admin'), updatePaymentStatus);

module.exports = router; 