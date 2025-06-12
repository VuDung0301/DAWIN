const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tour là bắt buộc'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả tour là bắt buộc'],
    },
    duration: {
      type: Number,
      required: [true, 'Thời gian tour là bắt buộc'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Số lượng người tối đa là bắt buộc'],
    },
    difficulty: {
      type: String,
      required: [true, 'Độ khó tour là bắt buộc'],
      enum: {
        values: ['dễ', 'trung bình', 'khó'],
        message: 'Độ khó phải là: dễ, trung bình, khó',
      },
    },
    price: {
      type: Number,
      required: [true, 'Giá tour là bắt buộc'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // Nếu không có giá trị priceDiscount thì không cần validate
          if (!val && val !== 0) return true;
          
          // Trong context update, cần kiểm tra cả this.price và this.getUpdate()
          let price = this.price;
          
          // Nếu đang trong context update và this.price undefined
          if (!price && this.getUpdate) {
            const update = this.getUpdate();
            price = update.price || update.$set?.price;
          }
          
          // Nếu vẫn không có price, bỏ qua validation (đã được kiểm tra ở controller)
          if (!price) return true;
          
          return val < price;
        },
        message: 'Giá giảm ({VALUE}) phải nhỏ hơn giá gốc',
      },
    },
    coverImage: {
      type: String,
      required: [true, 'Tour phải có ảnh đại diện'],
    },
    images: [String],
    startDates: [Date],
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
        image: String,
      },
    ],
    itinerary: [
      {
        day: {
          type: Number,
          required: [true, 'Ngày trong lịch trình là bắt buộc'],
        },
        title: {
          type: String,
          required: [true, 'Tiêu đề ngày là bắt buộc'],
        },
        description: {
          type: String,
          required: [true, 'Mô tả ngày là bắt buộc'],
        },
        activities: {
          type: [String],
          default: [],
        },
        accommodation: {
          type: String,
          default: '',
        },
        meals: {
          breakfast: {
            type: Boolean,
            default: false,
          },
          lunch: {
            type: Boolean,
            default: false,
          },
          dinner: {
            type: Boolean,
            default: false,
          },
        },
        image: String,
      },
    ],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    includes: [String],
    excludes: [String],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo slug trước khi lưu
tourSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  next();
});

// Tạo virtual populate để lấy reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; 