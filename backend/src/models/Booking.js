const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking phải liên kết với người dùng'],
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: [true, 'Booking phải liên kết với chuyến bay'],
    },
    passengers: [
      {
        name: {
          type: String,
          required: [true, 'Tên hành khách là bắt buộc'],
        },
        idNumber: {
          type: String,
          required: [true, 'Số CMND/CCCD là bắt buộc'],
        },
        dob: {
          type: Date,
          required: [true, 'Ngày sinh là bắt buộc'],
        },
        gender: {
          type: String,
          enum: ['Nam', 'Nữ', 'Khác'],
          required: [true, 'Giới tính là bắt buộc'],
        },
        seatNumber: {
          type: String,
        },
        seatClass: {
          type: String,
          enum: ['economy', 'business', 'firstClass'],
          required: [true, 'Hạng ghế là bắt buộc'],
        },
      },
    ],
    contactInfo: {
      email: {
        type: String,
        required: [true, 'Email liên hệ là bắt buộc'],
      },
      phone: {
        type: String,
        required: [true, 'Số điện thoại liên hệ là bắt buộc'],
      },
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Tổng giá tiền là bắt buộc'],
    },
    paymentStatus: {
      type: String,
      enum: ['Chưa thanh toán', 'Đã thanh toán', 'Đã hoàn tiền'],
      default: 'Chưa thanh toán',
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'MoMo', 'ZaloPay', 'Cash', 'sepay'],
    },
    paymentDate: {
      type: Date,
    },
    bookingStatus: {
      type: String,
      enum: ['Đang xử lý', 'Xác nhận', 'Hoàn thành', 'Hủy'],
      default: 'Đang xử lý',
    },
    cancellationReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    additionalServices: {
      extraLuggage: {
        selected: { type: Boolean, default: false },
        weight: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
      },
      mealPreference: {
        selected: { type: Boolean, default: false },
        type: { type: String, enum: ['Thường', 'Chay', 'Halal', 'Trẻ em'] },
        price: { type: Number, default: 0 },
      },
      priorityBoarding: {
        selected: { type: Boolean, default: false },
        price: { type: Number, default: 0 },
      },
    },
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo mã tham chiếu booking trước khi lưu
bookingSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  this.bookingReference = `BK${dateStr}${randomStr}`;
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 