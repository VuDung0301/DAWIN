const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.ObjectId,
      refPath: 'bookingModel',
      required: [true, 'Thanh toán phải liên kết với một đơn đặt'],
    },
    bookingModel: {
      type: String,
      required: true,
      enum: ['Booking', 'TourBooking', 'HotelBooking', 'FlightBooking'],
    },
    amount: {
      type: Number,
      required: [true, 'Thanh toán phải có số tiền'],
    },
    paymentMethod: {
      type: String,
      enum: ['sepay'],
      default: 'sepay',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    sePayInfo: {
      transactionId: String,
      qrCodeUrl: String,
      reference: String,
      webhookReceived: {
        type: Boolean,
        default: false
      },
      webhookData: Object
    },
    paymentDate: Date,
    note: String,
    paidBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Trước khi lưu, nếu status cập nhật thành completed, set paymentDate
paymentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.paymentDate) {
    this.paymentDate = Date.now();
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 