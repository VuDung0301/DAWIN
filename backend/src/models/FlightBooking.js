const mongoose = require('mongoose');

const FlightBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: true
    },
    flightId: {
      type: String,
      required: false
    },
    flightDate: {
      type: String,
      required: false
    },
    bookingNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    passengers: [
      {
        type: {
          type: String,
          enum: ['adult', 'child', 'infant'],
          default: 'adult'
        },
        title: {
          type: String,
          enum: ['Mr', 'Mrs', 'Ms', 'Miss', 'Mstr'],
          required: true
        },
        firstName: {
          type: String,
          required: true
        },
        lastName: {
          type: String,
          required: false,
          default: ''
        },
        fullName: {
          type: String,
          required: false
        },
        dob: {
          type: Date,
          required: true
        },
        gender: {
          type: String,
          enum: ['Male', 'Female', 'Other'],
          required: false
        },
        nationality: {
          type: String,
          required: true
        },
        identification: {
          type: String,
          required: false
        },
        passportNumber: {
          type: String,
          required: false
        },
        passportExpiry: {
          type: Date,
          required: false
        },
        seatClass: {
          type: String,
          enum: ['economy', 'premium_economy', 'business', 'first'],
          default: 'economy'
        }
      }
    ],
    contactInfo: {
      fullName: {
        type: String,
        required: false
      },
      email: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      identification: {
        type: String,
        required: false
      }
    },
    bookingReference: {
      type: String,
      unique: true
    },
    seatSelections: [
      {
        passenger: {
          type: Number, // Index trong mảng passengers
          required: true
        },
        seatNumber: {
          type: String,
          required: true
        }
      }
    ],
    baggageOptions: [
      {
        passenger: {
          type: Number, // Index trong mảng passengers
          required: true
        },
        checkedBaggage: {
          type: Number, // Trọng lượng (kg)
          default: 0
        },
        cabinBaggage: {
          type: Number, // Trọng lượng (kg)
          default: 0
        }
      }
    ],
    mealPreferences: [
      {
        passenger: {
          type: Number,
          required: true
        },
        mealType: {
          type: String,
          enum: ['regular', 'vegetarian', 'vegan', 'kosher', 'halal', 'diabetic', 'gluten-free', 'none'],
          default: 'regular'
        }
      }
    ],
    specialRequests: {
      type: String
    },
    totalPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'VND'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'momo', 'zalopay', 'cash', 'sepay', 'other'],
      required: false
    },
    cancellationReason: {
      type: String
    },
    checkInStatus: {
      type: Boolean,
      default: false
    },
    boardingPass: {
      issuedAt: Date,
      document: String // URL to the document
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate a booking reference before saving
FlightBookingSchema.pre('save', async function(next) {
  // Chỉ tạo mã đặt vé nếu chưa có
  if (!this.bookingReference) {
    // Tạo mã đặt vé định dạng FLT-XXXXXX (X là số hoặc chữ)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = 'FLT-';
    
    for (let i = 0; i < 6; i++) {
      reference += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    this.bookingReference = reference;
  }
  
  // Tạo booking number nếu chưa có
  if (!this.bookingNumber) {
    const prefix = 'FB';
    const timestamp = Date.now().toString().substring(7);
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    this.bookingNumber = `${prefix}${timestamp}${randomDigits}`;
  }
  
  // Cập nhật thời gian khi lưu
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('FlightBooking', FlightBookingSchema); 