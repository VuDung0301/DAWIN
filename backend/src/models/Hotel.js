const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên khách sạn là bắt buộc'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả khách sạn là bắt buộc'],
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ khách sạn là bắt buộc'],
    },
    city: {
      type: String,
      required: [true, 'Thành phố là bắt buộc'],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      description: String,
    },
    stars: {
      type: Number,
      required: [true, 'Số sao khách sạn là bắt buộc'],
      min: 1,
      max: 5,
      default: 3
    },
    coverImage: {
      type: String,
      required: [true, 'Khách sạn phải có ảnh đại diện'],
    },
    images: {
      type: [String],
      default: []
    },
    amenities: {
      type: [String],
      default: []
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Giá phòng là bắt buộc'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // Không validate nếu giá trị là undefined hoặc null
          if (val === undefined || val === null) return true;
          
          // Trong context update, cần kiểm tra cả this.pricePerNight và this.getUpdate()
          let pricePerNight = this.pricePerNight;
          
          // Nếu đang trong context update và this.pricePerNight undefined
          if (!pricePerNight && this.getUpdate) {
            const update = this.getUpdate();
            pricePerNight = update.pricePerNight || update.$set?.pricePerNight;
          }
          
          // Nếu vẫn không có pricePerNight, bỏ qua validation (đã được kiểm tra ở controller)
          if (!pricePerNight) return true;
          
          return val < pricePerNight;
        },
        message: 'Giá khuyến mãi ({VALUE}) phải nhỏ hơn giá gốc',
      },
    },
    roomTypes: [
      {
        name: {
          type: String,
          default: 'Phòng tiêu chuẩn'
        },
        description: String,
        price: {
          type: Number,
          default: 0
        },
        priceDiscount: Number,
        capacity: {
          type: Number,
          default: 2,
          min: 1,
        },
        amenities: {
          type: [String],
          default: []
        },
        images: {
          type: [String],
          default: []
        },
        available: {
          type: Number,
          default: 10,
        }
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating phải lớn hơn hoặc bằng 1.0'],
      max: [5, 'Rating phải nhỏ hơn hoặc bằng 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    nearbyAttractions: [
      {
        name: {
          type: String,
          default: ''
        },
        description: String,
        distance: String,
        image: String,
      },
    ],
    policies: {
      checkIn: {
        type: String,
        default: '14:00',
      },
      checkOut: {
        type: String,
        default: '12:00',
      },
      cancellation: {
        type: String,
        default: 'Miễn phí hủy trước 24 giờ. Sau đó, phí hủy là 100% giá trị đặt phòng.',
      },
      additionalRules: {
        type: [String],
        default: []
      },
    },
    category: {
      type: String, 
      enum: ['nghỉ dưỡng', 'thành phố', 'ven biển', 'núi', 'gia đình', 'doanh nhân', 'cặp đôi'],
      default: 'thành phố'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo slug trước khi lưu
hotelSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  
  // Đảm bảo có ít nhất một loại phòng
  if (!this.roomTypes || this.roomTypes.length === 0) {
    this.roomTypes = [{
      name: 'Phòng tiêu chuẩn',
      price: this.pricePerNight || 1000000,
      capacity: 2,
      available: 10,
      amenities: []
    }];
  }
  
  next();
});

// Tạo virtual populate để lấy reviews
hotelSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'hotel',
  localField: '_id',
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel; 