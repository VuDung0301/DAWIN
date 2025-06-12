const asyncHandler = require('express-async-handler');
const FlightBooking = require('../models/FlightBooking');
const AppError = require('../utils/appError');
const Flight = require('../models/Flight');
const aviationApi = require('../services/aviationApiService');
const Payment = require('../models/Payment');

// @desc    Lấy tất cả đặt vé máy bay (chỉ cho admin)
// @route   GET /api/flight-bookings
// @access  Private/Admin
const getAllFlightBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  let query = {};
  
  // Lọc theo trạng thái nếu được cung cấp
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Lọc theo ngày đặt (từ - đến)
  if (req.query.fromDate && req.query.toDate) {
    query.createdAt = {
      $gte: new Date(req.query.fromDate),
      $lte: new Date(req.query.toDate)
    };
  }

  const total = await FlightBooking.countDocuments(query);
  const bookings = await FlightBooking.find(query)
    .populate('user', 'name email phone')
    .populate('flight', 'flightNumber airline departureAirport arrivalAirport departureTime arrivalTime')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: bookings
  });
});

// @desc    Lấy danh sách đặt vé máy bay của người dùng đăng nhập
// @route   GET /api/flight-bookings/my-bookings
// @access  Private
const getMyFlightBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  let query = { user: req.user._id };
  
  // Lọc theo trạng thái nếu được cung cấp
  if (req.query.status) {
    query.status = req.query.status;
  }

  const total = await FlightBooking.countDocuments(query);
  const bookings = await FlightBooking.find(query)
    .populate('flight', 'flightNumber airline departureAirport arrivalAirport departureTime arrivalTime')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: bookings
  });
});

// @desc    Lấy chi tiết đặt vé máy bay theo ID
// @route   GET /api/flight-bookings/:id
// @access  Private
const getFlightBookingById = asyncHandler(async (req, res) => {
  const booking = await FlightBooking.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('flight', 'flightNumber airline departureAirport arrivalAirport departureTime arrivalTime price');

  if (!booking) {
    throw new AppError('Không tìm thấy thông tin đặt vé', 404);
  }

  // Kiểm tra xem người dùng có quyền xem đặt vé này không
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Không có quyền truy cập thông tin này', 403);
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Tạo đặt vé máy bay mới
// @route   POST /api/flight-bookings
// @access  Private
const createFlightBooking = asyncHandler(async (req, res) => {
  try {
    // Log request để debug
    console.log('Flight booking request:', JSON.stringify(req.body, null, 2));
    
    // Thêm user ID từ người dùng đăng nhập
    req.body.user = req.user._id;
    
    // Kiểm tra và chuẩn hóa dữ liệu hành khách
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
      req.body.passengers = req.body.passengers.map(passenger => {
        // Nếu có fullName nhưng không có firstName và lastName, tách ra
        if (passenger.fullName && (!passenger.firstName || !passenger.lastName)) {
          const nameParts = passenger.fullName.trim().split(' ').filter(part => part.length > 0);
          if (nameParts.length > 1) {
            passenger.lastName = nameParts.pop();
            passenger.firstName = nameParts.join(' ');
          } else {
            passenger.firstName = passenger.fullName.trim();
            passenger.lastName = '';
          }
        }
        
        // Đảm bảo firstName không rỗng
        if (!passenger.firstName || passenger.firstName.trim() === '') {
          passenger.firstName = passenger.fullName || 'Unnamed';
        }
        
        // Đảm bảo có title
        if (!passenger.title) {
          passenger.title = passenger.gender === 'Female' ? 'Ms' : 'Mr';
        }
        
        // Đảm bảo có nationality
        if (!passenger.nationality) {
          passenger.nationality = 'Vietnamese';
        }
        
        return passenger;
      });
    }
    
    // Kiểm tra xem có flightId hoặc flight
    if (!req.body.flight && req.body.flightId) {
      // Tìm Flight từ flightId
      const flight = await Flight.findOne({ 
        flightNumber: req.body.flightId 
      });
      
      if (flight) {
        req.body.flight = flight._id;
      } else {
        console.log(`Không tìm thấy chuyến bay với mã ${req.body.flightId}, tạo mới`);
        
        // Tạo Flight mới từ mock data
        try {
          const mockFlight = await createMockFlightFromId(req.body.flightId, req.body.flightDate);
          if (mockFlight) {
            req.body.flight = mockFlight._id;
          }
        } catch (error) {
          console.error('Lỗi khi tạo mock flight:', error);
        }
      }
    }
    
    // Kiểm tra xem đã có flight chưa
    if (!req.body.flight) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin chuyến bay. Vui lòng cung cấp thông tin chuyến bay hợp lệ',
      });
    }
    
    // Tạo đặt vé mới
    const booking = await FlightBooking.create(req.body);

    // Populate thông tin để trả về
    const populatedBooking = await FlightBooking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('flight', 'flightNumber airline departureAirport arrivalAirport departureTime arrivalTime price');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    console.error('Lỗi khi tạo đặt vé:', error);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: error.name,
        message: messages.join(', ')
      });
    }
    
    // Các lỗi khác
    res.status(500).json({
      success: false,
      message: 'Không thể tạo đặt vé. Vui lòng thử lại sau',
      error: error.message
    });
  }
});

// Hàm phụ trợ để tạo Flight từ mock data
const createMockFlightFromId = async (flightId, flightDate) => {
  try {
    // Gọi aviation service để lấy thông tin mock data
    const flightDetails = await aviationApi.getFlightDetails(flightId, flightDate);
    
    if (flightDetails) {
      // Tạo mới Flight từ dữ liệu
      const flight = new Flight({
        flightNumber: flightId,
        airline: flightDetails.airline?.name || 'Unknown Airline',
        departureAirport: flightDetails.departure?.iata || 'Unknown',
        departureCity: flightDetails.departure?.city || 'Unknown',
        arrivalAirport: flightDetails.arrival?.iata || 'Unknown',
        arrivalCity: flightDetails.arrival?.city || 'Unknown',
        departureTime: new Date(flightDetails.departure?.scheduled || Date.now()),
        arrivalTime: new Date(flightDetails.arrival?.scheduled || Date.now()),
        status: flightDetails.flight_status || 'scheduled',
        aircraft: flightDetails.aircraft?.model || 'Unknown',
        price: flightDetails.price?.economy || 2000000,
        seatClasses: [
          {
            name: 'economy',
            price: flightDetails.price?.economy || 2000000,
            availableSeats: flightDetails.seatsAvailable?.economy || 30
          },
          {
            name: 'business',
            price: flightDetails.price?.business || 4000000,
            availableSeats: flightDetails.seatsAvailable?.business || 10
          }
        ],
        departureTerminal: flightDetails.departure?.terminal || 'Unknown',
        arrivalTerminal: flightDetails.arrival?.terminal || 'Unknown',
        flightDuration: {
          hours: flightDetails.duration?.hours || 2,
          minutes: flightDetails.duration?.minutes || 0
        },
        baggage: {
          checkedBaggage: 20,
          cabinBaggage: 7
        }
      });
      
      await flight.save();
      return flight;
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi tạo mock flight:', error);
    throw error;
  }
};

// @desc    Cập nhật trạng thái đặt vé (admin)
// @route   PATCH /api/flight-bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    throw new AppError('Vui lòng cung cấp trạng thái mới', 400);
  }

  // Các trạng thái hợp lệ
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Trạng thái không hợp lệ', 400);
  }

  const booking = await FlightBooking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Không tìm thấy thông tin đặt vé', 404);
  }

  booking.status = status;
  booking.updatedAt = Date.now();

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Cập nhật trạng thái thanh toán (admin)
// @route   PATCH /api/flight-bookings/:id/payment
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  if (!paymentStatus) {
    throw new AppError('Vui lòng cung cấp trạng thái thanh toán mới', 400);
  }

  // Các trạng thái thanh toán hợp lệ
  const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
  if (!validPaymentStatuses.includes(paymentStatus)) {
    throw new AppError('Trạng thái thanh toán không hợp lệ', 400);
  }

  const booking = await FlightBooking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Không tìm thấy thông tin đặt vé', 404);
  }

  booking.paymentStatus = paymentStatus;
  booking.updatedAt = Date.now();

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Hủy đặt vé (người dùng hoặc admin)
// @route   PATCH /api/flight-bookings/:id/cancel
// @access  Private
const cancelFlightBooking = asyncHandler(async (req, res) => {
  const booking = await FlightBooking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Không tìm thấy thông tin đặt vé', 404);
  }

  // Kiểm tra quyền - chỉ người dùng tạo hoặc admin có thể hủy
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Không có quyền thực hiện thao tác này', 403);
  }

  // Kiểm tra nếu đặt vé đã hoàn thành thì không thể hủy
  if (booking.status === 'completed') {
    throw new AppError('Không thể hủy đặt vé đã hoàn thành', 400);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Người dùng hủy';
  booking.updatedAt = Date.now();

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Xóa đặt vé máy bay (chỉ admin)
// @route   DELETE /api/flight-bookings/:id
// @access  Private/Admin
const deleteFlightBooking = asyncHandler(async (req, res) => {
  const booking = await FlightBooking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Không tìm thấy thông tin đặt vé', 404);
  }

  await booking.remove();

  res.status(200).json({
    success: true,
    message: 'Đã xóa thông tin đặt vé thành công'
  });
});

// @desc    Lấy chi tiết đặt vé kèm thông tin thanh toán
// @route   GET /api/flight-bookings/:id/details
// @access  Public
const getFlightBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra booking có tồn tại không
    const booking = await FlightBooking.findById(id)
      .populate({
        path: 'flight',
        select: 'airline flightNumber departureCity arrivalCity departureTime arrivalTime price',
      })
      .populate({
        path: 'user',
        select: 'name email phone',
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đặt vé',
      });
    }
    
    // Tìm thông tin thanh toán
    const payment = await Payment.findOne({ 
      bookingId: id, 
      bookingType: 'flight' 
    });
    
    // Đảm bảo thông tin liên hệ được hiển thị đúng
    if (!booking.contactInfo || !booking.contactInfo.fullName) {
      // Nếu không có thông tin liên hệ, sử dụng thông tin từ user
      booking.contactInfo = booking.contactInfo || {};
      
      if (booking.user && typeof booking.user !== 'string') {
        booking.contactInfo.fullName = booking.contactInfo.fullName || booking.user.name || '';
        booking.contactInfo.email = booking.contactInfo.email || booking.user.email || '';
        booking.contactInfo.phone = booking.contactInfo.phone || booking.user.phone || '';
      }
    }
    
    // Tạo mã tham chiếu booking nếu chưa có
    const bookingReference = booking.bookingReference || `FLT${booking._id.toString().slice(-8).toUpperCase()}`;
    
    // Cập nhật response với thông tin đầy đủ
    const responseData = booking.toObject();
    
    // Thêm thông tin payment nếu có
    if (payment) {
      responseData.payment = payment;
    }
    
    // Thêm bookingReference nếu chưa có
    if (!responseData.bookingReference) {
      responseData.bookingReference = bookingReference;
      
      // Cập nhật vào database nếu chưa có
      await FlightBooking.findByIdAndUpdate(id, { bookingReference });
    }
    
    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error getting flight booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết đặt vé',
      error: error.message,
    });
  }
};

module.exports = {
  getAllFlightBookings,
  getMyFlightBookings,
  getFlightBookingById,
  createFlightBooking,
  updateBookingStatus,
  updatePaymentStatus,
  cancelFlightBooking,
  deleteFlightBooking,
  getFlightBookingDetails
}; 