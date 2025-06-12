const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/auth');

// Lấy tất cả reviews hoặc reviews của tour/hotel cụ thể
router.get('/', reviewController.getAllReviews);
router.get('/tour/:id/check-user', authMiddleware.protect, reviewController.checkUserReviewForTour);
router.get('/hotel/:id/check-user', authMiddleware.protect, reviewController.checkUserReviewForHotel);
router.get('/tour/:id', reviewController.getTourReviews);
router.get('/hotel/:id', reviewController.getHotelReviews);
router.get('/:id', reviewController.getReview);

// Các route yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Tạo review mới (chỉ user thường)
router.post('/', authMiddleware.restrictTo('user'), reviewController.createReview);

// Cập nhật và xóa review (chỉ user sở hữu và admin)
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Admin routes
router.put('/:id/approve', authMiddleware.restrictTo('admin'), reviewController.approveReview);
router.put('/:id/reject', authMiddleware.restrictTo('admin'), reviewController.rejectReview);

module.exports = router; 