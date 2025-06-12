const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getStats,
  getRecentBookings,
  getUpcomingFlights,
  getNotifications
} = require('../controllers/dashboardController');

// Tất cả các routes này đều yêu cầu xác thực và quyền admin
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/recent-bookings', getRecentBookings);
router.get('/upcoming-flights', getUpcomingFlights);
router.get('/notifications', getNotifications);

module.exports = router; 