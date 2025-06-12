const express = require('express');
const flightController = require('../controllers/flightController');

const router = express.Router();

// Route để lấy danh sách tất cả chuyến bay
router.get('/', flightController.getFlights);

// Route để lấy chuyến bay nội địa Việt Nam
router.get('/domestic', flightController.getDomesticFlights);

// Route để lấy chuyến bay quốc tế có liên quan đến Việt Nam
router.get('/international', flightController.getInternationalFlights);

// Route để tìm kiếm chuyến bay
router.get('/search', flightController.searchFlights);

// Route để lấy danh sách sân bay
router.get('/airports', flightController.getAirports);

// Route để lấy danh sách hãng hàng không
router.get('/airlines', flightController.getAirlines);

// Route để lấy lịch trình chuyến bay hiện tại (arrival/departure)
router.get('/schedules/:iataCode/:type', flightController.getFlightSchedules);

// Route để lấy lịch trình chuyến bay tương lai
router.get('/future/:iataCode/:type/:date', flightController.getFutureFlights);

// Route để lấy chi tiết chuyến bay theo mã và ngày
router.get('/:flightIata/:date', flightController.getFlightDetailsByIata);

module.exports = router; 