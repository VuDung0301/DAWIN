const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * @desc    Lấy tất cả tour bookings
 * @route   GET /api/tour-bookings
 * @access  Private/Admin
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    console.log('GET ALL TOUR BOOKINGS (ADMIN):', req.query);
    
    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Lọc theo trạng thái booking
    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Lọc theo trạng thái thanh toán
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }
    
    // Lọc theo ID tour
    if (req.query.tourId) {
      query.tour = req.query.tourId;
    }
    
    // Lọc theo ngày booking
    if (req.query.startDate && req.query.endDate) {
      query.bookingDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }
    
    console.log('Query:', JSON.stringify(query));
    
    const bookings = await TourBooking.find(query)
      .populate({
        path: 'user',
        select: 'name email phone',
      })
      .populate({
        path: 'tour',
        select: 'name duration difficulty price',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Tìm thấy ${bookings.length} đặt tour`);
    
    // Đếm tổng số bookings
    const total = await TourBooking.countDocuments(query);
    
    console.log('Tổng số đặt tour:', total);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: bookings,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt tour:', error);
    next(error);
  }
};

/**
 * @desc    Lấy tất cả đặt tour của người dùng hiện tại
 * @route   GET /api/tour-bookings/my-bookings
 * @access  Private
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    console.log('GET MY TOUR BOOKINGS:', req.user.id);
    
    // Phân trang (nếu cần)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const bookings = await TourBooking.find({ user: req.user.id })
      .populate({
        path: 'tour',
        select: 'name duration difficulty price imageCover startLocation'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Tìm thấy ${bookings.length} đặt tour cho user ${req.user.id}`);
    
    // Đếm tổng số bookings
    const total = await TourBooking.countDocuments({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: bookings,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt tour của user:', error);
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết một đặt tour (không cần login)
 * @route   GET /api/tour-bookings/:id
 * @access  Public
 */
exports.getTourBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Kiểm tra ID có phải là ObjectId hợp lệ không
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID đặt tour không hợp lệ'
      });
    }

    const booking = await TourBooking.findById(bookingId)
      .populate({
        path: 'tour',
        select: 'name duration difficulty price imageCover startLocation locations description'
      })
      .populate({
        path: 'user',
        select: 'name email phone'
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt tour'
      });
    }
    
    // Kiểm tra quyền truy cập - người dùng phải là chủ booking hoặc là admin
    let userId;
    if (booking.user) {
      // Nếu user là ObjectId hoặc string
      if (typeof booking.user === 'string' || booking.user instanceof mongoose.Types.ObjectId) {
        userId = booking.user.toString();
      } 
      // Nếu user đã populate thành công
      else if (booking.user._id) {
        userId = booking.user._id.toString();
      }
    }

    // Kiểm tra quyền truy cập 
    if (req.user && req.user.role !== 'admin' && userId !== req.user.id) {
      // Kiểm tra nếu API này được gọi từ frontend (công khai)
      const isFrontendRequest = req.headers.origin && req.headers.origin.includes('localhost:3009');
      // Cho phép truy cập nếu là request từ frontend người dùng
      if (!isFrontendRequest) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập thông tin này',
        });
      }
    }
    
    // Đảm bảo thông tin liên hệ được hiển thị đúng
    if (!booking.contactInfo || !booking.contactInfo.name) {
      // Nếu không có thông tin liên hệ, sử dụng thông tin từ user
      booking.contactInfo = booking.contactInfo || {};
      
      if (booking.user && typeof booking.user !== 'string') {
        booking.contactInfo.name = booking.contactInfo.name || booking.user.name || '';
        booking.contactInfo.email = booking.contactInfo.email || booking.user.email || '';
        booking.contactInfo.phone = booking.contactInfo.phone || booking.user.phone || '';
      }
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin đặt tour:', error);
    next(error);
  }
};

/**
 * @desc    Tạo đặt tour mới
 * @route   POST /api/tour-bookings
 * @access  Private
 */
exports.createTourBooking = async (req, res, next) => {
  try {
    const {
      tourId,
      participants,
      tourDate,
      contactInfo,
      specialRequests,
      additionalServices,
    } = req.body;
    
    // Kiểm tra tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour',
      });
    }
    
    // Tính tổng giá tiền
    let totalPrice = tour.price * participants.length;
    
    // Cộng thêm giá dịch vụ bổ sung nếu có
    if (additionalServices) {
      for (const [key, service] of Object.entries(additionalServices)) {
        if (service.selected) {
          totalPrice += service.price * (service.quantity || 1);
        }
      }
    }
    
    // Tạo đặt tour mới
    const booking = await TourBooking.create({
      tour: tourId,
      user: req.user.id,
      price: tour.price,
      participants,
      tourDate,
      contactInfo,
      specialRequests,
      totalPrice,
      additionalServices,
      bookingReference: 'TMP', // Sẽ được tạo tự động bởi pre-save middleware
    });
    
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái đặt tour
 * @route   PUT /api/tour-bookings/:id/status
 * @access  Private/Admin
 */
exports.updateTourBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái đặt tour',
      });
    }
    
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt tour',
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái thanh toán
 * @route   PUT /api/tour-bookings/:id/payment
 * @access  Private/Admin
 */
exports.updateTourPaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái thanh toán',
      });
    }
    
    const updateData = {
      paymentStatus,
      paymentMethod: paymentMethod || undefined,
    };
    
    if (paymentStatus === 'Đã thanh toán') {
      updateData.paymentDate = Date.now();
    }
    
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt tour',
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hủy đặt tour
 * @route   PUT /api/tour-bookings/:id/cancel
 * @access  Private
 */
exports.cancelTourBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const booking = await TourBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt tour',
      });
    }
    
    // Kiểm tra quyền truy cập
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đặt tour này',
      });
    }
    
    // Cập nhật booking
    booking.bookingStatus = 'Hủy';
    booking.paymentStatus = 'Đã hủy';
    booking.cancellationReason = reason || 'Không có lý do';
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy booking theo ID
exports.getBooking = catchAsync(async (req, res, next) => {
  const booking = await TourBooking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Không tìm thấy booking với ID này', 404));
  }

  // Chỉ cho phép admin hoặc người dùng liên quan đến booking này xem thông tin
  if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user.id) {
    return next(new AppError('Bạn không có quyền xem booking này', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// Tạo booking mới
exports.createBooking = catchAsync(async (req, res, next) => {
  try {
    console.log('Nhận yêu cầu tạo booking:', JSON.stringify(req.body));
    
    // Không cho phép người dùng tự ý đặt trường user
    if (!req.body.user) req.body.user = req.user.id;
    
    // Nếu người dùng gửi lên user_id khác với id của họ và không phải admin
    if (req.body.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thể đặt tour cho người dùng khác'
      });
    }

    const {
      tourId,
      startDate,
      numOfPeople,
      contactName,
      contactEmail,
      contactPhone,
      specialRequests,
      totalPrice,
      status,
      paymentMethod
    } = req.body;
    
    // Kiểm tra tour có tồn tại không
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour với ID này'
      });
    }
    
    // Tạo đối tượng booking để lưu
    const bookingData = {
      tour: tourId,
      user: req.user.id,
      price: totalPrice || tour.price * numOfPeople,
      participants: numOfPeople,
      status: status || 'pending',
      paymentMethod: paymentMethod || 'cash',
      specialRequests,
      contactInfo: {
        phone: contactPhone,
        email: contactEmail,
        name: contactName
      }
    };
    
    if (startDate) {
      bookingData.startDate = new Date(startDate);
    }
    
    console.log('Tạo booking với dữ liệu:', JSON.stringify(bookingData));
    
    // Tạo booking mới
    const newBooking = await TourBooking.create(bookingData);

    res.status(201).json({
      success: true,
      data: newBooking
    });
  } catch (error) {
    console.error('Lỗi khi tạo tour booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tour booking: ' + error.message
    });
  }
});

// Cập nhật trạng thái booking
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  // Chỉ cho phép cập nhật trạng thái
  const { status } = req.body;
  
  // Kiểm tra status hợp lệ
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Trạng thái không hợp lệ', 400));
  }
  
  const booking = await TourBooking.findById(req.params.id);
  
  if (!booking) {
    return next(new AppError('Không tìm thấy booking với ID này', 404));
  }
  
  // Kiểm tra quyền: admin có thể cập nhật bất kỳ booking nào, 
  // người dùng thường chỉ có thể cập nhật booking của chính họ
  if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user.id) {
    return next(new AppError('Bạn không có quyền cập nhật booking này', 403));
  }
  
  // Người dùng thường chỉ có thể hủy booking, không thể chuyển sang trạng thái khác
  if (req.user.role !== 'admin' && status !== 'cancelled') {
    return next(new AppError('Bạn chỉ có thể hủy booking của mình', 403));
  }
  
  booking.status = status;
  await booking.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// Hủy booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await TourBooking.findById(req.params.id);
  
  if (!booking) {
    return next(new AppError('Không tìm thấy booking với ID này', 404));
  }
  
  // Không thể hủy booking đã hoàn thành
  if (booking.status === 'completed') {
    return next(new AppError('Không thể hủy booking đã hoàn thành', 400));
  }
  
  // Kiểm tra quyền: admin có thể hủy bất kỳ booking nào, 
  // người dùng thường chỉ có thể hủy booking của chính họ
  console.log('User ID từ request:', req.user.id);
  console.log('User ID từ booking:', booking.user);
  console.log('User ID từ body (nếu có):', req.body.userId);
  
  let bookingUserId;
  
  // Kiểm tra booking.user là ObjectId hay đã được populate
  if (booking.user) {
    if (mongoose.Types.ObjectId.isValid(booking.user)) {
      bookingUserId = booking.user.toString();
    } else if (booking.user._id) {
      bookingUserId = booking.user._id.toString();
    }
  }
  
  console.log('Booking user ID đã xử lý:', bookingUserId);
  console.log('So sánh với user ID hiện tại:', req.user.id);
  
  // Kiểm tra quyền truy cập
  if (req.user.role !== 'admin' && bookingUserId !== req.user.id) {
    // Nếu có userId trong body và userID đó khớp với bookingUserId, thì cho phép hủy
    if (req.body.userId && req.body.userId === bookingUserId) {
      console.log('Cho phép hủy dựa trên userId trong body');
    } else {
      return next(new AppError('Bạn không có quyền hủy booking này', 403));
    }
  }
  
  booking.status = 'cancelled';
  await booking.save();
  
  res.status(200).json({
    success: true,
    message: 'Đã hủy đặt tour thành công',
    data: {
      booking
    }
  });
});

/**
 * @desc    Kiểm tra tính khả dụng của tour
 * @route   POST /api/tour-bookings/check-availability
 * @access  Public
 */
exports.checkTourAvailability = async (req, res, next) => {
  try {
    console.log('Kiểm tra khả dụng tour:', JSON.stringify(req.body));
    
    const { tourId, startDate, numOfPeople } = req.body;
    
    // Kiểm tra tour có tồn tại
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour với ID đã cung cấp'
      });
    }
    
    // Kiểm tra ngày khởi hành
    if (startDate) {
      const requestedDate = new Date(startDate);
      const validStartDate = tour.startDates.some(date => {
        const tourDate = new Date(date);
        return tourDate.getDate() === requestedDate.getDate() &&
               tourDate.getMonth() === requestedDate.getMonth() &&
               tourDate.getFullYear() === requestedDate.getFullYear();
      });
      
      if (!validStartDate) {
        return res.status(400).json({
          success: false,
          message: 'Ngày khởi hành không hợp lệ hoặc không có sẵn'
        });
      }
    }
    
    // Kiểm tra số lượng người
    if (numOfPeople > tour.maxGroupSize) {
      return res.status(400).json({
        success: false,
        message: `Số người vượt quá giới hạn cho phép (tối đa ${tour.maxGroupSize} người)`
      });
    }
    
    // Kiểm tra thành công
    return res.status(200).json({
      success: true,
      message: 'Tour khả dụng và có thể đặt',
      data: {
        tour: {
          _id: tour._id,
          name: tour.name,
          duration: tour.duration,
          maxGroupSize: tour.maxGroupSize,
          price: tour.price,
          priceDiscount: tour.priceDiscount,
          startDates: tour.startDates
        },
        price: (tour.priceDiscount || tour.price) * numOfPeople
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra khả dụng tour:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra khả dụng tour'
    });
  }
};

/**
 * @desc    Lấy thông tin payment từ booking
 * @route   GET /api/tour-bookings/:id/payment
 * @access  Private
 */
exports.getBookingPayment = asyncHandler(async (req, res) => {
  const booking = await TourBooking.findById(req.params.id).populate({
    path: 'user',
    strictPopulate: false
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy booking',
    });
  }

  // Kiểm tra quyền truy cập - người dùng phải là chủ booking hoặc là admin
  let userId;
  if (booking.user) {
    // Nếu user là ObjectId hoặc string
    if (typeof booking.user === 'string' || booking.user instanceof mongoose.Types.ObjectId) {
      userId = booking.user.toString();
    } 
    // Nếu user đã populate thành công
    else if (booking.user._id) {
      userId = booking.user._id.toString();
    }
  } else if (booking.userId) {
    // Trường hợp dùng userId thay vì user
    userId = booking.userId.toString();
  }

  // Kiểm tra quyền truy cập
  if ((!userId || userId !== req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập thông tin này',
    });
  }

  // Tìm payment liên quan đến booking
  const Payment = require('../models/Payment');
  const payment = await Payment.findOne({ 
    booking: booking._id, 
    bookingModel: 'TourBooking'
  }).sort({ createdAt: -1 });

  if (!payment) {
    // Nếu không tìm thấy payment, tạo một payment mới với SEPAY
    const { v4: uuidv4 } = require('uuid');
    const { SEPAY } = require('../config/constants');
    
    // Tạo reference cho SePay
    const pattern = 'SEVQR';
    const orderType = 'TUR';
    const cleanedOrderId = req.params.id.substring(req.params.id.length - 6);
    const timestamp = Date.now().toString().substring(8, 13);
    const sePayReference = `${pattern} ${orderType}${cleanedOrderId}${timestamp}`;
    
    // Cấu hình SePay
    const accountNumber = SEPAY.ACCOUNT_NUMBER;
    const bankCode = SEPAY.BANK_CODE;
    
    // URL trực tiếp đến QR code
    const encodedContent = encodeURIComponent(sePayReference);
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${booking.price * booking.participants}&des=${encodedContent}&template=compact`;
    
    // Tạo mới payment
    const newPayment = await Payment.create({
      booking: booking._id,
      bookingModel: 'TourBooking',
      amount: booking.price * booking.participants,
      paymentMethod: 'sepay',
      status: 'pending',
      paidBy: req.user.id,
      createdBy: req.user.id,
      sePayInfo: {
        transactionId: uuidv4(),
        qrCodeUrl,
        reference: sePayReference
      }
    });
    
    return res.status(201).json({
      success: true,
      data: newPayment
    });
  }
  
  // Trả về payment đã tìm thấy
  return res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Lấy chi tiết đầy đủ của một đặt tour
 * @route   GET /api/tour-bookings/:id/details
 * @access  Public
 */
exports.getTourBookingDetails = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;

  // Kiểm tra ID có phải là ObjectId hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({
      success: false,
      message: 'ID đặt tour không hợp lệ'
    });
  }

  // Tìm booking với các thông tin liên quan đầy đủ
  const booking = await TourBooking.findById(bookingId)
    .populate({
      path: 'tour',
      select: 'name duration difficulty price images startLocation locations description guides',
      populate: {
        path: 'guides',
        select: 'name photo role'
      }
    })
    .populate({
      path: 'user',
      select: 'name email phone photo'
    });
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy đặt tour'
    });
  }
  
  // Lấy thông tin thanh toán nếu có
  const Payment = require('../models/Payment');
  const payment = await Payment.findOne({ 
    booking: booking._id, 
    bookingModel: 'TourBooking'
  }).sort({ createdAt: -1 });

  // Đảm bảo thông tin liên hệ được hiển thị đúng
  if (!booking.contactInfo || !booking.contactInfo.name) {
    booking.contactInfo = booking.contactInfo || {};
    
    if (booking.user && typeof booking.user !== 'string') {
      booking.contactInfo.name = booking.contactInfo.name || booking.user.name || '';
      booking.contactInfo.email = booking.contactInfo.email || booking.user.email || '';
      booking.contactInfo.phone = booking.contactInfo.phone || booking.user.phone || '';
    }
  }
  
  // Bổ sung thông tin thanh toán vào kết quả
  const result = booking.toObject();
  if (payment) {
    result.payment = {
      _id: payment._id,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
    
    // Thêm thông tin SePay nếu có
    if (payment.sePayInfo) {
      result.payment.sePayInfo = payment.sePayInfo;
    }
  }

  res.status(200).json({
    success: true,
    data: result
  });
}); 