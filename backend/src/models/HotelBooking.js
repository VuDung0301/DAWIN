const mongoose = require('mongoose');

const hotelBookingSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: [true, 'Đặt phòng phải thuộc về một khách sạn'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Đặt phòng phải thuộc về một người dùng'],
    },
    room: {
      type: String,
      required: [true, 'Phải chọn loại phòng'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Phải có ngày nhận phòng'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Phải có ngày trả phòng'],
    },
    nights: {
      type: Number,
      required: [true, 'Phải có số đêm lưu trú'],
    },
    guests: {
      adults: {
        type: Number,
        required: [true, 'Phải có số lượng người lớn'],
        default: 1,
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    roomCount: {
      type: Number,
      default: 1,
      required: [true, 'Phải có số lượng phòng'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: [true, 'Đặt phòng phải có tổng giá tiền'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'paypal', 'momo', 'zalopay', 'vnpay', 'sepay'],
      default: 'sepay',
    },
    specialRequests: {
      type: String,
    },
    contactInfo: {
      fullName: {
        type: String,
        required: [true, 'Phải có tên người đặt phòng'],
      },
      email: {
        type: String,
        required: [true, 'Phải có email người đặt phòng'],
      },
      phone: {
        type: String,
        required: [true, 'Phải có số điện thoại người đặt phòng'],
      },
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true
    },
    cancellationReason: {
      type: String,
    },
    cancellationDate: {
      type: Date,
    },
    // Thêm thông tin chi tiết về giá
    priceDetails: {
      roomPrice: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo mã tham chiếu booking trước khi lưu
hotelBookingSchema.pre('save', async function (next) {
  if (!this.isNew || this.bookingReference) return next();
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  this.bookingReference = `HTB${dateStr}${randomStr}`;
  
  next();
});

// Khi query HotelBooking, tự động populate hotel
hotelBookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'hotel',
    select: 'name coverImage stars city address',
  })
  .populate({
    path: 'user',
    select: 'name email phone',
  });
  
  next();
});

const HotelBooking = mongoose.model('HotelBooking', hotelBookingSchema);

module.exports = HotelBooking; 