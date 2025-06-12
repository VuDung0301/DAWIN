const Tour = require('../models/Tour');
const Flight = require('../models/Flight');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TourBooking = require('../models/TourBooking');

/**
 * @desc    Lấy thống kê tổng quan cho dashboard
 * @route   GET /api/dashboard/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res, next) => {
  try {
    // Lấy thông tin từ các model
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalTours = await Tour.countDocuments({ active: true });
    const totalFlights = await Flight.countDocuments();
    
    // Thống kê đặt chỗ
    const totalFlightBookings = await Booking.countDocuments();
    const totalTourBookings = await TourBooking.countDocuments();
    const totalBookings = totalFlightBookings + totalTourBookings;

    // Tính tổng doanh thu
    const flightBookingRevenue = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const tourBookingRevenue = await TourBooking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const totalRevenue = 
      (flightBookingRevenue.length ? flightBookingRevenue[0].total : 0) + 
      (tourBookingRevenue.length ? tourBookingRevenue[0].total : 0);

    // Tính toán tăng trưởng (giả sử là tháng này so với tháng trước)
    const thisMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const thisMonthFirstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const lastMonthFirstDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthLastDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 0);

    // Đặt chỗ tháng này
    const thisMonthBookings = await Promise.all([
      Booking.countDocuments({ 
        createdAt: { $gte: thisMonthFirstDay } 
      }),
      TourBooking.countDocuments({ 
        createdAt: { $gte: thisMonthFirstDay } 
      })
    ]);
    
    // Đặt chỗ tháng trước
    const lastMonthBookings = await Promise.all([
      Booking.countDocuments({ 
        createdAt: { $gte: lastMonthFirstDay, $lte: lastMonthLastDay } 
      }),
      TourBooking.countDocuments({ 
        createdAt: { $gte: lastMonthFirstDay, $lte: lastMonthLastDay } 
      })
    ]);

    const thisMonthTotalBookings = thisMonthBookings[0] + thisMonthBookings[1];
    const lastMonthTotalBookings = lastMonthBookings[0] + lastMonthBookings[1];

    // Doanh thu tháng này
    const thisMonthRevenue = await Promise.all([
      Booking.aggregate([
        { $match: { 
          createdAt: { $gte: thisMonthFirstDay },
          status: { $in: ['confirmed', 'completed'] }
        }},
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      TourBooking.aggregate([
        { $match: { 
          createdAt: { $gte: thisMonthFirstDay },
          status: { $in: ['confirmed', 'completed'] }
        }},
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    // Doanh thu tháng trước
    const lastMonthRevenue = await Promise.all([
      Booking.aggregate([
        { $match: { 
          createdAt: { $gte: lastMonthFirstDay, $lte: lastMonthLastDay },
          status: { $in: ['confirmed', 'completed'] }
        }},
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      TourBooking.aggregate([
        { $match: { 
          createdAt: { $gte: lastMonthFirstDay, $lte: lastMonthLastDay },
          status: { $in: ['confirmed', 'completed'] }
        }},
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    const thisMonthTotalRevenue = 
      (thisMonthRevenue[0].length ? thisMonthRevenue[0][0].total : 0) + 
      (thisMonthRevenue[1].length ? thisMonthRevenue[1][0].total : 0);
    
    const lastMonthTotalRevenue = 
      (lastMonthRevenue[0].length ? lastMonthRevenue[0][0].total : 0) + 
      (lastMonthRevenue[1].length ? lastMonthRevenue[1][0].total : 0);

    // Tính phần trăm tăng trưởng
    let bookingsGrowth = 0;
    if (lastMonthTotalBookings > 0) {
      bookingsGrowth = ((thisMonthTotalBookings - lastMonthTotalBookings) / lastMonthTotalBookings) * 100;
    }

    let revenueGrowth = 0;
    if (lastMonthTotalRevenue > 0) {
      revenueGrowth = ((thisMonthTotalRevenue - lastMonthTotalRevenue) / lastMonthTotalRevenue) * 100;
    }

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalFlights,
        totalTours,
        totalCustomers,
        totalRevenue,
        bookingsGrowth,
        revenueGrowth
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các đặt chỗ gần đây
 * @route   GET /api/dashboard/recent-bookings
 * @access  Private/Admin
 */
exports.getRecentBookings = async (req, res, next) => {
  try {
    // Lấy 5 đơn đặt vé máy bay gần nhất
    const flightBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('flight', 'flightNumber departureCity arrivalCity airline');

    // Lấy 5 đơn đặt tour gần nhất
    const tourBookings = await TourBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('tour', 'name slug startLocation');

    // Kết hợp và sắp xếp theo thời gian
    const recentBookings = [...flightBookings, ...tourBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(booking => {
        const isFlightBooking = booking.flight !== undefined;
        
        return {
          id: booking._id,
          bookingNumber: booking.bookingNumber || '',
          customer: booking.user ? booking.user.name : 'Khách hàng',
          type: isFlightBooking ? 'flight' : 'tour',
          destination: isFlightBooking 
            ? `${booking.flight.departureCity} - ${booking.flight.arrivalCity}`
            : booking.tour.name,
          date: booking.createdAt,
          amount: booking.totalPrice,
          status: booking.status,
          statusColor: 
            booking.status === 'confirmed' ? 'green' :
            booking.status === 'pending' ? 'yellow' :
            booking.status === 'completed' ? 'blue' : 'red'
        };
      });

    res.status(200).json({
      success: true,
      data: recentBookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các chuyến bay sắp tới
 * @route   GET /api/dashboard/upcoming-flights
 * @access  Private/Admin
 */
exports.getUpcomingFlights = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Lấy các chuyến bay trong 7 ngày tới
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const flights = await Flight.find({
      departureTime: { $gte: today, $lte: nextWeek }
    }).sort({ departureTime: 1 });

    // Đếm số lượng đặt chỗ cho mỗi chuyến bay
    const upcomingFlights = await Promise.all(flights.slice(0, 5).map(async flight => {
      const bookings = await Booking.countDocuments({ 
        flight: flight._id,
        status: { $in: ['confirmed', 'pending'] }
      });
      
      return {
        id: flight._id,
        flightNumber: flight.flightNumber,
        route: `${flight.departureCity} (${flight.departureAirport}) - ${flight.arrivalCity} (${flight.arrivalAirport})`,
        departure: flight.departureTime,
        bookings: bookings,
        capacity: flight.capacity,
        status: 'Đúng giờ' // Mặc định
      };
    }));

    res.status(200).json({
      success: true,
      data: upcomingFlights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông báo hệ thống
 * @route   GET /api/dashboard/notifications
 * @access  Private/Admin
 */
exports.getNotifications = async (req, res, next) => {
  try {
    // Demo notifications - trong thực tế sẽ lấy từ database
    const notifications = [
      {
        id: 1,
        title: 'Đơn đặt tour mới',
        message: 'Có đơn đặt tour mới cần xử lý',
        time: new Date(Date.now() - 5 * 60 * 1000), // 5 phút trước
        read: false
      },
      {
        id: 2,
        title: 'Thanh toán thành công',
        message: 'Có một đơn hàng vừa được thanh toán thành công',
        time: new Date(Date.now() - 60 * 60 * 1000), // 1 giờ trước
        read: false
      },
      {
        id: 3,
        title: 'Yêu cầu hỗ trợ',
        message: 'Có một yêu cầu hỗ trợ mới từ khách hàng',
        time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 giờ trước
        read: true
      }
    ];
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}; 