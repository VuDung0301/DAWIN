const aviationApi = require('../services/aviationApiService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Flight = require('../models/Flight');

/**
 * @desc    Lấy tất cả chuyến bay
 * @route   GET /api/flights
 * @access  Public
 */
exports.getFlights = catchAsync(async (req, res, next) => {
  // Lấy các tham số từ query string
  const { 
    departure_iata, arrival_iata, departure_date, 
    airline_iata, flight_number, flight_status, limit, offset,
    country, domestic_only, international_only
  } = req.query;
  
  // Tạo truy vấn
  let query = {};
  
  // Nếu chỉ muốn chuyến bay trong nước
  if (domestic_only === 'true') {
    query.isDomestic = true;
  }
  
  // Nếu chỉ muốn chuyến bay quốc tế
  if (international_only === 'true') {
    query.isDomestic = false;
  }
  
  // Nếu chỉ định quốc gia cụ thể
  if (country) {
    query.$or = [
      { departureCountry: country },
      { arrivalCountry: country }
    ];
  }
  
  // Nếu chỉ định sân bay khởi hành
  if (departure_iata) {
    query.departureAirport = departure_iata;
  }
  
  // Nếu chỉ định sân bay đến
  if (arrival_iata) {
    query.arrivalAirport = arrival_iata;
  }
  
  // Nếu chỉ định hãng hàng không
  if (airline_iata) {
    query.airline = airline_iata;
  }
  
  // Nếu chỉ định số hiệu chuyến bay
  if (flight_number) {
    query.flightNumber = flight_number;
  }
  
  // Nếu chỉ định trạng thái chuyến bay
  if (flight_status) {
    query.status = flight_status;
  }
  
  // Phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (page - 1) * pageSize;
  
  // Lấy chuyến bay từ database
  const flights = await Flight.find(query)
    .sort({ departureTime: 1 })
    .skip(skip)
    .limit(pageSize);
  
  // Đếm tổng số chuyến bay
  const total = await Flight.countDocuments(query);
  
  // Trả về response
  res.status(200).json({
    success: true,
    count: flights.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / pageSize),
      limit: pageSize
    },
    data: flights
  });
});

/**
 * @desc    Lấy các chuyến bay nội địa Việt Nam
 * @route   GET /api/flights/domestic
 * @access  Public
 */
exports.getDomesticFlights = catchAsync(async (req, res, next) => {
  // Phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * pageSize;
  
  // Lấy chuyến bay nội địa
  const flights = await Flight.find({
    departureCountry: 'Việt Nam',
    arrivalCountry: 'Việt Nam'
  })
    .sort({ departureTime: 1 })
    .skip(skip)
    .limit(pageSize);
  
  // Đếm tổng số chuyến bay nội địa
  const total = await Flight.countDocuments({
    departureCountry: 'Việt Nam',
    arrivalCountry: 'Việt Nam'
  });
  
  // Trả về response
  res.status(200).json({
    success: true,
    count: flights.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / pageSize),
      limit: pageSize
    },
    data: flights
  });
});

/**
 * @desc    Lấy các chuyến bay quốc tế từ/đến Việt Nam
 * @route   GET /api/flights/international
 * @access  Public
 */
exports.getInternationalFlights = catchAsync(async (req, res, next) => {
  // Phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * pageSize;
  
  // Lấy chuyến bay quốc tế có liên quan đến Việt Nam
  const flights = await Flight.find({
    $or: [
      { departureCountry: 'Việt Nam', arrivalCountry: { $ne: 'Việt Nam' } },
      { departureCountry: { $ne: 'Việt Nam' }, arrivalCountry: 'Việt Nam' }
    ]
  })
    .sort({ departureTime: 1 })
    .skip(skip)
    .limit(pageSize);
  
  // Đếm tổng số chuyến bay quốc tế có liên quan đến Việt Nam
  const total = await Flight.countDocuments({
    $or: [
      { departureCountry: 'Việt Nam', arrivalCountry: { $ne: 'Việt Nam' } },
      { departureCountry: { $ne: 'Việt Nam' }, arrivalCountry: 'Việt Nam' }
    ]
  });
  
  // Trả về response
  res.status(200).json({
    success: true,
    count: flights.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / pageSize),
      limit: pageSize
    },
    data: flights
  });
});

/**
 * @desc    Tìm kiếm chuyến bay
 * @route   GET /api/flights/search
 * @access  Public
 */
exports.searchFlights = catchAsync(async (req, res, next) => {
  const { 
    departureIata, arrivalIata, departureDate,
    departureCity, arrivalCity, airline,
    domestic_only
  } = req.query;
  
  // Tạo query
  let query = {};
  
  // Tìm theo mã IATA sân bay
  if (departureIata) query.departureAirport = departureIata;
  if (arrivalIata) query.arrivalAirport = arrivalIata;
  
  // Tìm theo tên thành phố
  if (departureCity) query.departureCity = { $regex: departureCity, $options: 'i' };
  if (arrivalCity) query.arrivalCity = { $regex: arrivalCity, $options: 'i' };
  
  // Tìm theo hãng hàng không
  if (airline) query.airline = { $regex: airline, $options: 'i' };
  
  // Tìm theo ngày khởi hành
  if (departureDate) {
    const startDate = new Date(departureDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(departureDate);
    endDate.setHours(23, 59, 59, 999);
    
    query.departureTime = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  // Lọc chuyến bay nội địa nếu có yêu cầu
  if (domestic_only === 'true') {
    query.isDomestic = true;
  }
  
  // Phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * pageSize;
  
  // Tìm kiếm trong database
  const flights = await Flight.find(query)
    .sort({ departureTime: 1 })
    .skip(skip)
    .limit(pageSize);
  
  // Đếm tổng số kết quả
  const total = await Flight.countDocuments(query);
  
  // Trả về kết quả
  res.status(200).json({
    success: true,
    count: flights.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / pageSize),
      limit: pageSize
    },
    data: flights
  });
});

/**
 * @desc    Lấy chi tiết chuyến bay
 * @route   GET /api/flights/:flightIata/:date
 * @access  Public
 */
exports.getFlightDetails = catchAsync(async (req, res, next) => {
  const { flightIata, date } = req.params;
  
  if (!flightIata || !date) {
    return next(new AppError('Vui lòng cung cấp mã chuyến bay và ngày', 400));
  }
  
  // Lấy chi tiết chuyến bay
  const flight = await aviationApi.getFlightDetails(flightIata, date);
  
  if (!flight) {
    return next(new AppError('Không tìm thấy thông tin chuyến bay', 404));
  }
  
  res.status(200).json({
    success: true,
    data: flight
  });
});

/**
 * @desc    Lấy danh sách sân bay
 * @route   GET /api/flights/airports
 * @access  Public
 */
exports.getAirports = catchAsync(async (req, res, next) => {
  const { search, limit, offset } = req.query;
  
  const params = {};
  if (search) params.search = search;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  
  const airports = await aviationApi.getAirports(params);
  
  res.status(200).json({
    success: true,
    data: airports
  });
});

/**
 * @desc    Lấy danh sách hãng hàng không
 * @route   GET /api/flights/airlines
 * @access  Public
 */
exports.getAirlines = catchAsync(async (req, res, next) => {
  const { search, limit, offset } = req.query;
  
  const params = {};
  if (search) params.search = search;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  
  const airlines = await aviationApi.getAirlines(params);
  
  res.status(200).json({
    success: true,
    data: airlines
  });
});

/**
 * @desc    Lấy lịch trình chuyến bay hiện tại của một sân bay
 * @route   GET /api/flights/schedules/:iataCode/:type
 * @access  Public
 */
exports.getFlightSchedules = catchAsync(async (req, res, next) => {
  const { iataCode, type } = req.params;
  const { airline_iata, flight_status, limit, offset } = req.query;
  
  if (!iataCode || !type) {
    return next(new AppError('Vui lòng cung cấp mã IATA sân bay và loại (arrival/departure)', 400));
  }
  
  if (type !== 'arrival' && type !== 'departure') {
    return next(new AppError('Loại lịch trình phải là "arrival" hoặc "departure"', 400));
  }
  
  const params = {};
  if (airline_iata) params.airline_iata = airline_iata;
  if (flight_status) params.status = flight_status;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  
  const schedules = await aviationApi.getFlightSchedules(iataCode, type, params);
  
  res.status(200).json({
    success: true,
    data: schedules
  });
});

/**
 * @desc    Lấy lịch trình chuyến bay tương lai
 * @route   GET /api/flights/future/:iataCode/:type/:date
 * @access  Public
 */
exports.getFutureFlights = catchAsync(async (req, res, next) => {
  const { iataCode, type, date } = req.params;
  const { airline_iata, flight_number, limit, offset } = req.query;
  
  if (!iataCode || !type || !date) {
    return next(new AppError('Vui lòng cung cấp đầy đủ thông tin mã IATA, loại và ngày', 400));
  }
  
  if (type !== 'arrival' && type !== 'departure') {
    return next(new AppError('Loại lịch trình phải là "arrival" hoặc "departure"', 400));
  }
  
  // Kiểm tra định dạng ngày
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return next(new AppError('Định dạng ngày không hợp lệ, vui lòng sử dụng định dạng YYYY-MM-DD', 400));
  }
  
  const params = {};
  if (airline_iata) params.airline_iata = airline_iata;
  if (flight_number) params.flight_number = flight_number;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  
  const futureFlights = await aviationApi.getFutureFlights(iataCode, type, date, params);
  
  res.status(200).json({
    success: true,
    data: futureFlights
  });
});

// Lấy chi tiết chuyến bay bằng mã IATA và ngày
exports.getFlightDetailsByIata = async (req, res) => {
  try {
    const { flightIata, date } = req.params;
    
    console.log(`[flightController] Đang xử lý yêu cầu chi tiết chuyến bay: ${flightIata}, ngày: ${date}`);
    
    // Kiểm tra xem có đủ tham số không
    if (!flightIata || !date) {
      console.error('[flightController] Thiếu tham số flightIata hoặc date');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả mã chuyến bay (flightIata) và ngày (date)'
      });
    }
    
    // Kiểm tra định dạng ngày
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error(`[flightController] Định dạng ngày không hợp lệ: ${date}`);
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD'
      });
    }
    
    // Kiểm tra định dạng mã chuyến bay
    if (!/^[A-Z0-9]{2,}[0-9]{1,4}$/.test(flightIata)) {
      console.error(`[flightController] Định dạng mã chuyến bay không hợp lệ: ${flightIata}`);
      return res.status(400).json({
        success: false,
        message: 'Định dạng mã chuyến bay không hợp lệ. Ví dụ đúng: VN123, KE4567'
      });
    }

    // Gọi service để lấy chi tiết chuyến bay
    const flightDetail = await aviationApi.getFlightDetails(flightIata, date);
    
    console.log(`[flightController] Hoàn tất xử lý chi tiết chuyến bay ${flightIata}`);
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      data: flightDetail,
      message: 'Lấy thông tin chi tiết chuyến bay thành công',
      // Thêm thông báo nếu đang sử dụng mock data
      isMockData: aviationApi.useMockData ? true : false,
      note: aviationApi.useMockData ? 
        'Dữ liệu này được tạo tự động do API thật đang gặp hạn chế về quyền truy cập. Dữ liệu có thể không chính xác so với thực tế.' : 
        undefined
    });
  } catch (error) {
    console.error('[flightController] Lỗi khi lấy chi tiết chuyến bay:', error.message);
    
    // Xử lý các loại lỗi cụ thể
    if (error.response) {
      const statusCode = error.response.status;
      
      if (statusCode === 403) {
        return res.status(503).json({
          success: false,
          message: 'Dịch vụ tìm kiếm chuyến bay hiện không khả dụng do giới hạn API. Vui lòng liên hệ bộ phận CSKH.',
          error: {
            code: error.response.data?.error?.code || 'service_unavailable',
            details: 'API subscription plan không hỗ trợ tính năng này'
          }
        });
      }
      
      if (statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thông tin chuyến bay ${flightIata} ngày ${date}`,
          error: {
            code: 'flight_not_found',
            details: 'Chuyến bay không tồn tại hoặc chưa được cập nhật trong hệ thống'
          }
        });
      }
      
      return res.status(statusCode).json({
        success: false,
        message: 'Lỗi khi truy vấn thông tin chuyến bay',
        error: {
          code: error.response.data?.error?.code || 'api_error',
          details: error.response.data?.error?.message || error.message
        }
      });
    }
    
    // Lỗi không xác định
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin chi tiết chuyến bay. Vui lòng thử lại sau.',
      error: {
        code: 'server_error',
        details: error.message
      }
    });
  }
}; 