const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/auth');

// Tất cả các route báo cáo đều yêu cầu xác thực và quyền admin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Routes báo cáo
router.get('/revenue', reportController.getRevenueReport);
router.get('/popular-destinations', reportController.getPopularDestinationsReport);
router.get('/active-customers', reportController.getActiveCustomersReport);
router.get('/popular-tours', reportController.getPopularToursReport);
router.get('/popular-flights', reportController.getPopularFlightsReport);
router.get('/statistics', reportController.getStatistics);

module.exports = router; 