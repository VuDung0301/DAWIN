const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, 'Vui lòng cung cấp số hiệu chuyến bay'],
    trim: true
  },
  airline: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên hãng hàng không']
  },
  departureCity: {
    type: String,
    required: [true, 'Vui lòng cung cấp thành phố khởi hành']
  },
  departureCountry: {
    type: String,
    default: 'Việt Nam'
  },
  arrivalCity: {
    type: String,
    required: [true, 'Vui lòng cung cấp thành phố đến']
  },
  arrivalCountry: {
    type: String,
    default: 'Việt Nam'
  },
  departureAirport: {
    type: String,
    required: [true, 'Vui lòng cung cấp sân bay khởi hành']
  },
  arrivalAirport: {
    type: String,
    required: [true, 'Vui lòng cung cấp sân bay đến']
  },
  departureTime: {
    type: Date,
    required: [true, 'Vui lòng cung cấp thời gian khởi hành']
  },
  arrivalTime: {
    type: Date,
    required: [true, 'Vui lòng cung cấp thời gian đến']
  },
  price: {
    economy: {
      type: Number,
      required: [true, 'Vui lòng cung cấp giá vé hạng phổ thông']
    },
    business: {
      type: Number,
      required: [true, 'Vui lòng cung cấp giá vé hạng thương gia']
    },
    firstClass: {
      type: Number,
      required: [true, 'Vui lòng cung cấp giá vé hạng nhất']
    }
  },
  seatsAvailable: {
    economy: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số lượng ghế hạng phổ thông']
    },
    business: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số lượng ghế hạng thương gia']
    },
    firstClass: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số lượng ghế hạng nhất']
    }
  },
  duration: {
    type: Number,
    required: [true, 'Vui lòng cung cấp thời gian bay (phút)']
  },
  status: {
    type: String,
    enum: ['Đúng giờ', 'Trễ', 'Hủy', 'Đã bay'],
    default: 'Đúng giờ'
  },
  features: {
    wifi: {
      type: Boolean,
      default: false
    },
    meals: {
      type: Boolean,
      default: true
    },
    entertainment: {
      type: Boolean,
      default: false
    },
    powerOutlets: {
      type: Boolean,
      default: false
    },
    usb: {
      type: Boolean,
      default: false
    }
  },
  image: {
    type: String,
    default: 'default-flight.jpg'
  },
  active: {
    type: Boolean,
    default: true
  },
  isDomestic: {
    type: Boolean,
    default: true,
    // Tự động xác định xem đây có phải là chuyến bay nội địa hay không
    // (cả điểm đi và điểm đến đều ở Việt Nam)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware trước khi lưu để cập nhật updatedAt và isDomestic
FlightSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Tự động xác định chuyến bay nội địa
  if (this.departureCountry === 'Việt Nam' && this.arrivalCountry === 'Việt Nam') {
    this.isDomestic = true;
  } else {
    this.isDomestic = false;
  }
  
  next();
});

// Phương thức tĩnh để tìm chuyến bay theo hãng hàng không
FlightSchema.statics.findByAirline = function(airline) {
  return this.find({ airline });
};

// Phương thức tĩnh để tìm chuyến bay theo khoảng thời gian
FlightSchema.statics.findByTimeRange = function(startDate, endDate) {
  return this.find({
    departureTime: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Phương thức tĩnh để tìm chuyến bay theo tuyến đường
FlightSchema.statics.findByRoute = function(departureCity, arrivalCity) {
  return this.find({
    departureCity,
    arrivalCity
  });
};

// Phương thức tĩnh để tìm các chuyến bay nội địa Việt Nam
FlightSchema.statics.findDomesticFlights = function() {
  return this.find({
    departureCountry: 'Việt Nam',
    arrivalCountry: 'Việt Nam'
  });
};

// Phương thức tĩnh để tìm các chuyến bay quốc tế từ/đến Việt Nam
FlightSchema.statics.findInternationalFlights = function() {
  return this.find({
    $or: [
      { departureCountry: 'Việt Nam', arrivalCountry: { $ne: 'Việt Nam' } },
      { departureCountry: { $ne: 'Việt Nam' }, arrivalCountry: 'Việt Nam' }
    ]
  });
};

// Phương thức tĩnh để kiểm tra tính khả dụng của chuyến bay
FlightSchema.statics.checkAvailability = function(flightId, seatClass, numPassengers) {
  return this.findById(flightId)
    .then(flight => {
      if (!flight) {
        throw new Error('Không tìm thấy chuyến bay');
      }
      
      const availableSeats = flight.seatsAvailable[seatClass];
      if (availableSeats < numPassengers) {
        throw new Error(`Không đủ chỗ. Chỉ còn ${availableSeats} ghế ${seatClass}`);
      }
      
      return true;
    });
};

module.exports = mongoose.model('Flight', FlightSchema); 