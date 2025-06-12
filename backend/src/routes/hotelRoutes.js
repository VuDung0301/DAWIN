const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { protect, restrictTo } = require('../middlewares/auth');

// Routes công khai cho mọi người dùng
router.get('/', hotelController.getAllHotels);
router.get('/featured', hotelController.getFeaturedHotels);
router.get('/search', hotelController.searchHotels);
router.get('/categories', hotelController.getCategories);
router.get('/categories/:category', hotelController.getHotelsByCategory);
router.get('/popular-cities', hotelController.getPopularCities);
router.get('/cities/:city', hotelController.getHotelsByCity);
router.get('/:id', hotelController.getHotel);
router.post('/:id/check-availability', hotelController.checkAvailability);

// Routes cần quyền admin
router.use(protect);
router.use(restrictTo('admin'));

// Tạo và cập nhật hotel với xử lý ảnh tích hợp
router.post('/', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router; 