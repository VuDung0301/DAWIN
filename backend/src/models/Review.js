const mongoose = require('mongoose');
const Tour = require('./Tour');
const Hotel = require('./Hotel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Nội dung đánh giá không được để trống'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Đánh giá phải có rating'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Đánh giá phải thuộc về một người dùng'],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề đánh giá không được để trống'],
    },
    text: {
      type: String,
      required: [true, 'Nội dung đánh giá không được để trống'],
    },
    approved: {
      type: Boolean,
      // Không set default để có thể phân biệt giữa chưa duyệt (undefined), đã duyệt (true), và từ chối (false)
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Đảm bảo mỗi đánh giá phải thuộc về một tour hoặc một khách sạn
reviewSchema.pre('save', function (next) {
  if (!this.tour && !this.hotel) {
    return next(new Error('Đánh giá phải thuộc về một tour hoặc một khách sạn'));
  }
  
  if (this.tour && this.hotel) {
    return next(new Error('Đánh giá chỉ có thể thuộc về một tour hoặc một khách sạn, không thể cả hai'));
  }
  
  next();
});

// Mỗi user chỉ được review 1 tour/hotel một lần
reviewSchema.index({ tour: 1, user: 1 }, { unique: true, sparse: true });
reviewSchema.index({ hotel: 1, user: 1 }, { unique: true, sparse: true });

// Populate user khi query
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name avatar',
  });
  next();
});

// Tính toán ratingsAverage và ratingsQuantity cho tour
reviewSchema.statics.calcAverageRatings = async function (tourId, hotelId) {
  if (tourId) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }
  } else if (hotelId) {
    const stats = await this.aggregate([
      {
        $match: { hotel: hotelId },
      },
      {
        $group: {
          _id: '$hotel',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await Hotel.findByIdAndUpdate(hotelId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Hotel.findByIdAndUpdate(hotelId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }
  }
};

// Cập nhật rating sau khi tạo review
reviewSchema.post('save', function () {
  // this.constructor là model hiện tại (Review)
  if (this.tour) {
    this.constructor.calcAverageRatings(this.tour);
  } else if (this.hotel) {
    this.constructor.calcAverageRatings(null, this.hotel);
  }
});

// Cập nhật rating sau khi cập nhật/xóa review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    if (doc.tour) {
      await doc.constructor.calcAverageRatings(doc.tour);
    } else if (doc.hotel) {
      await doc.constructor.calcAverageRatings(null, doc.hotel);
    }
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 