const express = require('express');
const {
  createPayment,
  getPayment,
  getMyPayments,
  updatePaymentStatus,
  handleSePayWebhook,
  checkPaymentStatus,
  testWebhook,
  getPaymentById,
  deletePayment,
  forceUpdatePayment,
  getOrCreateBookingPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Routes yêu cầu xác thực
router.route('/')
  .post(protect, createPayment);

router.route('/me')
  .get(protect, getMyPayments);

router.route('/:id')
  .get(protect, getPayment)
  .delete(protect, authorize('admin'), deletePayment);

// Route cho booking payment
router.route('/booking/:type/:id')
  .get(protect, getOrCreateBookingPayment);

// Route webhook không yêu cầu xác thực
router.route('/webhook/sepay')
  .post(handleSePayWebhook);

// Route kiểm thử webhook (chỉ cho admin)
router.route('/webhook/sepay/test')
  .post(protect, authorize('admin'), testWebhook);

router.route('/:id/status')
  .put(protect, authorize('admin'), updatePaymentStatus);

router.route('/:id/check')
  .get(protect, checkPaymentStatus);

// Thêm route force-complete cho admin
router
  .route('/:id/force-complete')
  .put(protect, authorize('admin'), forceUpdatePayment);

// Tạo hoặc lấy thông tin payment từ booking
router.get('/booking/:bookingType/:bookingId', protect, getOrCreateBookingPayment);

module.exports = router; 