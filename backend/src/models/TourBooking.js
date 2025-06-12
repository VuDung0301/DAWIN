const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking phải thuộc về một tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking phải thuộc về một người dùng']
    },
    price: {
      type: Number,
      required: [true, 'Booking phải có giá']
    },
    participants: {
      type: Number,
      required: [true, 'Booking phải có số lượng người tham gia'],
      min: [1, 'Số lượng người tham gia phải lớn hơn hoặc bằng 1']
    },
    startDate: {
      type: Date,
      required: [true, 'Booking phải có ngày khởi hành']
    },
    bookingDate: {
      type: Date,
      default: Date.now()
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Trạng thái không hợp lệ'
      },
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['credit_card', 'bank_transfer', 'cash', 'paypal', 'momo', 'zalopay', 'vnpay', 'sepay'],
        message: 'Phương thức thanh toán không hợp lệ'
      },
      default: 'bank_transfer'
    },
    specialRequests: {
      type: String,
      trim: true
    },
    contactInfo: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    },
    bookingReference: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
tourBookingSchema.index({ tour: 1, user: 1 }, { unique: false });
tourBookingSchema.index({ status: 1 });

// Middleware
tourBookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'tour',
    select: 'name price images'
  });
  next();
});

// Pre-save middleware để đảm bảo dữ liệu
tourBookingSchema.pre('save', function(next) {
  // Nếu booking chưa có bookingReference, tạo một ID mới
  if (!this.bookingReference) {
    // Lấy 8 ký tự cuối của ObjectId và thêm tiền tố
    const objectIdStr = this._id.toString();
    const shortId = objectIdStr.substring(objectIdStr.length - 8);
    this.bookingReference = `TUR${shortId.toUpperCase()}`;
  }

  // Đảm bảo người dùng được lưu đúng cách
  if (this.user && typeof this.user !== 'string' && !mongoose.Types.ObjectId.isValid(this.user)) {
    if (this.user._id) {
      this.user = this.user._id;
    }
  }
  
  // Set ngày tạo booking nếu chưa có
  if (!this.bookingDate) {
    this.bookingDate = new Date();
  }
  
  // Set trạng thái mặc định nếu chưa có
  if (!this.status) {
    this.status = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('TourBooking', tourBookingSchema); 