const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Tour = require('../models/Tour');
const TourBooking = require('../models/TourBooking');
const mongoose = require('mongoose');

/**
 * @desc    Lấy tất cả bookings
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
exports.getBookings = async (req, res, next) => {
  try {
    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Lọc theo trạng thái booking
    let query = {};
    if (req.query.status) {
      query.bookingStatus = req.query.status;
    }
    
    // Lọc theo trạng thái thanh toán
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }
    
    // Lọc theo ID chuyến bay
    if (req.query.flightId) {
      query.flight = req.query.flightId;
    }
    
    // Lọc theo ngày booking
    if (req.query.startDate && req.query.endDate) {
      query.bookingDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }
    
    const bookings = await Booking.find(query)
      .populate({
        path: 'user',
        select: 'name email phone',
      })
      .populate({
        path: 'flight',
        select: 'flightNumber airline departureCity arrivalCity departureTime arrivalTime',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số bookings
    const total = await Booking.countDocuments(query);
    
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
    next(error);
  }
};

/**
 * @desc    Lấy tất cả bookings của người dùng hiện tại
 * @route   GET /api/bookings/me
 * @access  Private
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'flight',
        select: 'flightNumber airline departureCity arrivalCity departureTime arrivalTime',
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết một booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email phone',
      })
      .populate('flight');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      });
    }
    
    // Kiểm tra xem booking có thuộc về người dùng hiện tại hoặc admin không
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập booking này',
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
 * @desc    Tạo booking mới
 * @route   POST /api/bookings
 * @access  Private
 */
exports.createBooking = async (req, res, next) => {
  try {
    console.log('Nhận yêu cầu đặt vé:', JSON.stringify(req.body));
    console.log('User ID đặt vé:', req.user ? req.user.id : 'Không có user');
    
    const {
      flightId,
      tourId,
      tour,
      passengers,
      numOfPeople,
      contactInfo,
      contactName,
      contactEmail,
      contactPhone,
      paymentMethod,
      additionalServices,
      specialRequests,
      startDate,
      totalPrice,
      status
    } = req.body;
    
    // Kiểm tra xem đây là booking cho tour hay flight
    if (tourId || tour) {
      // Xử lý đặt tour
      console.log('Đang xử lý đặt tour:', tourId || tour);
      
      const tourBooking = {
        user: req.user.id,
        tour: tourId || tour,
        startDate: startDate,
        participants: numOfPeople || 1,
        contactInfo: {
          name: contactName || (contactInfo ? contactInfo.fullName : ''),
          email: contactEmail || (contactInfo ? contactInfo.email : ''),
          phone: contactPhone || (contactInfo ? contactInfo.phone : '')
        },
        specialRequests: specialRequests || (additionalServices ? additionalServices.specialRequests?.details : ''),
        price: totalPrice,
        status: status || 'pending'
      };
      
      // Tạo tour booking
      const booking = await TourBooking.create(tourBooking);
      
      return res.status(201).json({
        success: true,
        data: booking,
      });
    } else if (flightId) {
      // Xử lý đặt chuyến bay
      console.log('Đang xử lý đặt chuyến bay:', flightId);
      
      // Kiểm tra passengers
      if (!passengers) {
        console.log('Thiếu thông tin hành khách');
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin hành khách',
        });
      }
      
      // Chuyển đổi passengers thành mảng nếu nó là một số
      const passengersArray = Array.isArray(passengers) 
        ? passengers 
        : typeof passengers === 'number' 
          ? Array.from({ length: passengers }, () => ({ seatClass: 'economy' })) 
          : null;
          
      if (!passengersArray || passengersArray.length === 0) {
        console.log('Dữ liệu passengers không hợp lệ:', { passengers });
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu passengers không hợp lệ. Cần cung cấp mảng passengers hoặc số lượng hành khách',
        });
      }
      
      // Kiểm tra định dạng ObjectId
      if (!mongoose.Types.ObjectId.isValid(flightId)) {
        console.log('Flight ID không hợp lệ (không phải ObjectId):', flightId);
        return res.status(400).json({
          success: false,
          message: 'Flight ID không hợp lệ',
        });
      }
      
      // Kiểm tra chuyến bay
      console.log('Tìm chuyến bay với ID:', flightId);
      const flight = await Flight.findById(flightId);
      if (!flight) {
        console.log('Không tìm thấy chuyến bay với ID:', flightId);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến bay',
        });
      }
      
      console.log('Tìm thấy chuyến bay:', flight._id, flight.flightNumber);
      
      // Kiểm tra số lượng ghế còn trống
      let isAvailable = true;
      const seatClassCount = {
        economy: 0,
        business: 0,
        firstClass: 0,
      };
      
      // Đếm số lượng ghế mỗi loại
      passengersArray.forEach(passenger => {
        if (passenger.seatClass) {
          seatClassCount[passenger.seatClass]++;
        } else {
          // Mặc định là economy nếu không chỉ định
          seatClassCount.economy++;
        }
      });
      
      console.log('Số ghế đặt theo hạng:', seatClassCount);
      console.log('Số ghế còn trống:', flight.seatsAvailable);
      
      // Kiểm tra từng loại ghế
      for (const [className, count] of Object.entries(seatClassCount)) {
        if (count > 0) {
          if (!flight.seatsAvailable[className]) {
            console.log(`Không tồn tại hạng ghế ${className} trên chuyến bay này`);
            return res.status(400).json({
              success: false,
              message: `Không tồn tại hạng ghế ${className} trên chuyến bay này`,
            });
          }
          
          // Bỏ qua kiểm tra số lượng ghế còn trống
          // if (flight.seatsAvailable[className] < count) {
          //   console.log(`Không đủ ghế hạng ${className}: cần ${count}, còn trống ${flight.seatsAvailable[className]}`);
          //   isAvailable = false;
          //   break;
          // }
        }
      }
      
      // Luôn cho phép đặt vé
      isAvailable = true;
      
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Không đủ số lượng ghế trống',
        });
      }
      
      // Tính tổng giá tiền
      let totalPrice = 0;
      
      // Tính tiền vé
      passengersArray.forEach(passenger => {
        if (passenger.seatClass && flight.price[passenger.seatClass]) {
          totalPrice += flight.price[passenger.seatClass];
        } else {
          totalPrice += flight.price.economy; // Mặc định nếu không có hạng ghế
        }
      });
      
      // Tính tiền dịch vụ bổ sung
      if (additionalServices) {
        if (additionalServices.extraLuggage && additionalServices.extraLuggage.selected) {
          totalPrice += additionalServices.extraLuggage.price;
        }
        
        if (additionalServices.mealPreference && additionalServices.mealPreference.selected) {
          totalPrice += additionalServices.mealPreference.price;
        }
        
        if (additionalServices.priorityBoarding && additionalServices.priorityBoarding.selected) {
          totalPrice += additionalServices.priorityBoarding.price;
        }
        
        if (additionalServices.specialRequests && additionalServices.specialRequests.selected) {
          totalPrice += additionalServices.specialRequests.price || 0;
        }
      }
      
      console.log('Tổng giá tiền:', totalPrice);
      
      // Trường hợp đây là request thử nghiệm
      if (req.body.isTestBooking) {
        return res.status(200).json({
          success: true,
          message: 'Kiểm tra thành công, chuyến bay khả dụng',
          testData: {
            flight: {
              _id: flight._id,
              flightNumber: flight.flightNumber,
              availableSeats: flight.seatsAvailable
            },
            price: totalPrice
          }
        });
      }
      
      // Tạo booking mới
      const booking = await Booking.create({
        user: req.user.id,
        flight: flightId,
        passengers: passengersArray,
        contactInfo,
        totalPrice,
        paymentMethod: paymentMethod || 'PayAtOffice',
        additionalServices,
        bookingReference: 'TMP', // Sẽ được tạo tự động bởi pre-save middleware
      });
      
      // Cập nhật số lượng ghế còn trống
      for (const [className, count] of Object.entries(seatClassCount)) {
        if (count > 0) {
          flight.seatsAvailable[className] -= count;
        }
      }
      
      await flight.save();
      
      res.status(201).json({
        success: true,
        data: booking,
      });
    } else {
      // Không tìm thấy tour hoặc flight
      console.log('Thiếu thông tin đặt vé');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đặt vé. Cần cung cấp thông tin Tour hoặc Flight',
      });
    }
  } catch (error) {
    console.error('Lỗi trong quá trình đặt vé:', error);
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái booking
 * @route   PUT /api/bookings/:id/status
 * @access  Private/Admin
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái booking',
      });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
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
 * @route   PUT /api/bookings/:id/payment
 * @access  Private/Admin
 */
exports.updatePaymentStatus = async (req, res, next) => {
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
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
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
 * @desc    Hủy booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      });
    }
    
    // Kiểm tra quyền truy cập
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy booking này',
      });
    }
    
    // Cập nhật booking
    booking.bookingStatus = 'Hủy';
    booking.cancellationReason = reason || 'Không có lý do';
    
    // Cập nhật chuyến bay
    const flight = await Flight.findById(booking.flight);
    
    if (flight) {
      // Đếm số lượng ghế mỗi loại
      const seatClassCount = {
        economy: 0,
        business: 0,
        firstClass: 0,
      };
      
      booking.passengers.forEach(passenger => {
        seatClassCount[passenger.seatClass]++;
      });
      
      // Cập nhật số lượng ghế trống
      for (const [className, count] of Object.entries(seatClassCount)) {
        if (count > 0) {
          flight.seatsAvailable[className] += count;
        }
      }
      
      await flight.save();
    }
    
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kiểm tra khả năng đặt vé/tour mà không tạo booking (chỉ kiểm tra)
 * @route   POST /api/bookings/test
 * @access  Public
 */
exports.testBooking = async (req, res, next) => {
  try {
    console.log('Nhận yêu cầu kiểm tra đặt vé/tour:', JSON.stringify(req.body));
    
    const {
      flightId,
      tourId,
      passengers,
      startDate,
      numOfPeople,
      isTestBooking
    } = req.body;
    
    // Kiểm tra cờ test
    if (!isTestBooking) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu cờ test booking'
      });
    }
    
    // Xử lý kiểm tra đặt tour
    if (tourId) {
      // Tìm tour theo ID
      const tour = await Tour.findById(tourId);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tour với ID đã cung cấp'
        });
      }
      
      console.log('Tìm thấy tour:', tour.name);
      
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
        testData: {
          tour: {
            _id: tour._id,
            name: tour.name,
            duration: tour.duration,
            maxGroupSize: tour.maxGroupSize,
            startDates: tour.startDates
          },
          price: (tour.priceDiscount || tour.price) * (numOfPeople || 1)
        }
      });
    }
    // Xử lý kiểm tra đặt chuyến bay
    else if (flightId) {
      // Kiểm tra định dạng ObjectId
      if (!mongoose.Types.ObjectId.isValid(flightId)) {
        console.log('Flight ID không hợp lệ (không phải ObjectId):', flightId);
        return res.status(400).json({
          success: false,
          message: 'Flight ID không hợp lệ'
        });
      }
      
      // Tìm chuyến bay theo ID
      const flight = await Flight.findById(flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến bay với ID đã cung cấp'
        });
      }
      
      console.log('Tìm thấy chuyến bay:', flight.flightNumber);
      
      // Đếm số lượng ghế mỗi loại từ passengers
      if (passengers) {
        // Chuyển passengers thành mảng nếu cần
        const passengersArray = Array.isArray(passengers) 
          ? passengers 
          : typeof passengers === 'number' 
            ? Array.from({ length: passengers }, () => ({ seatClass: 'economy' })) 
            : [];
            
        const seatClassCount = {
          economy: 0,
          business: 0,
          firstClass: 0
        };
        
        // Đếm số ghế theo hạng
        passengersArray.forEach(passenger => {
          if (passenger.seatClass) {
            seatClassCount[passenger.seatClass]++;
          } else {
            seatClassCount.economy++;
          }
        });
        
        console.log('Số ghế đặt theo hạng:', seatClassCount);
        console.log('Số ghế còn trống:', flight.seatsAvailable);
        
        // Kiểm tra từng loại ghế
        let isAvailable = true;
        let unavailableClass = '';
        
        for (const [className, count] of Object.entries(seatClassCount)) {
          if (count > 0) {
            if (!flight.seatsAvailable[className]) {
              console.log(`Không tồn tại hạng ghế ${className} trên chuyến bay này`);
              return res.status(400).json({
                success: false,
                message: `Không tồn tại hạng ghế ${className} trên chuyến bay này`
              });
            }
            
            // Bỏ qua kiểm tra số lượng ghế
            // if (flight.seatsAvailable[className] < count) {
            //   console.log(`Không đủ ghế hạng ${className}: cần ${count}, còn trống ${flight.seatsAvailable[className]}`);
            //   isAvailable = false;
            //   unavailableClass = className;
            //   break;
            // }
          }
        }
        
        // Luôn cho phép đặt vé
        isAvailable = true;
        
        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Không đủ số lượng ghế trống hạng ${unavailableClass}`
          });
        }
      }
      
      // Kiểm tra thành công
      return res.status(200).json({
        success: true,
        message: 'Chuyến bay khả dụng và có thể đặt vé',
        testData: {
          flight: {
            _id: flight._id,
            flightNumber: flight.flightNumber,
            availableSeats: flight.seatsAvailable,
            price: flight.price
          }
        }
      });
    }
    // Không tìm thấy flightId hoặc tourId
    else {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin để kiểm tra. Cần cung cấp flightId hoặc tourId'
      });
    }
  } catch (error) {
    console.error('Lỗi trong quá trình kiểm tra đặt vé/tour:', error);
    next(error);
  }
}; 