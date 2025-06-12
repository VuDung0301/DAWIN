const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authMiddleware = require('../middlewares/auth');

// Routes công khai cho mọi người dùng 
router.get('/', tourController.getAllTours);
router.get('/top-5-cheap', tourController.getTop5CheapTours);
router.get('/stats', tourController.getTourStats);

// Routes cho trang khám phá
router.get('/categories', tourController.getAllCategories);
router.get('/category/:category', tourController.getToursByCategory);
router.get('/popular-destinations', tourController.getPopularDestinations);
router.get('/destination/:destination', tourController.getToursByDestination);

// Routes mới cho trang khám phá nâng cao
router.get('/featured', tourController.getFeaturedTours);
router.get('/popular', tourController.getPopularTours);
router.get('/newest', tourController.getNewestTours);
router.get('/budget', tourController.getBudgetTours);

// Chi tiết tour
router.get('/:id', tourController.getTour);

// Routes cần quyền admin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Tạo và cập nhật tour với xử lý ảnh tích hợp
router.post('/', tourController.createTour);
router.put('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);

module.exports = router; 