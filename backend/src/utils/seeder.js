const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Review = require('../models/Review');

// Cấu hình env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Kết nối đến database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB đã kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`Lỗi kết nối MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Dữ liệu mẫu cho tours
const tours = [
  {
    name: 'Tour du lịch Hạ Long 3 ngày 2 đêm',
    description: 'Khám phá vẻ đẹp hùng vĩ của vịnh Hạ Long, di sản thiên nhiên thế giới được UNESCO công nhận. Tham quan các hang động tuyệt đẹp, tắm biển tại các bãi tắm hoang sơ và thưởng thức hải sản tươi ngon.',
    duration: 3,
    maxGroupSize: 15,
    difficulty: 'dễ',
    price: 3500000,
    priceDiscount: 500000,
    coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592',
    images: [
      'https://images.unsplash.com/photo-1580151899878-7c6f357e1d6e',
      'https://images.unsplash.com/photo-1573238750902-b2729da40e4d',
      'https://images.unsplash.com/photo-1582650949011-9debfa9d3541'
    ],
    startDates: [
      new Date('2024-06-15'),
      new Date('2024-07-13'),
      new Date('2024-08-10')
    ],
    startLocation: {
      type: 'Point',
      coordinates: [107.0449, 20.9086],
      address: 'Bãi Cháy, Hạ Long, Quảng Ninh',
      description: 'Vịnh Hạ Long'
    },
    locations: [
      {
        type: 'Point',
        coordinates: [107.0812, 20.9101],
        description: 'Hang Sửng Sốt',
        day: 1
      },
      {
        type: 'Point',
        coordinates: [107.1366, 20.8880],
        description: 'Hang Tiên Ông',
        day: 2
      },
      {
        type: 'Point',
        coordinates: [107.0571, 20.8651],
        description: 'Bãi tắm Ti Tốp',
        day: 3
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'Khám phá Vịnh Hạ Long',
        description: 'Lên tàu tham quan vịnh Hạ Long, check-in tại tàu, ăn trưa trên tàu và khám phá hang Sửng Sốt',
        activities: ['Đi thuyền', 'Tham quan hang động', 'Ăn hải sản'],
        accommodation: 'Nghỉ đêm trên tàu',
        meals: {
          breakfast: false,
          lunch: true,
          dinner: true
        }
      },
      {
        day: 2,
        title: 'Khám phá hang động',
        description: 'Tham quan hang Tiên Ông, tắm biển, chèo thuyền kayak khám phá vùng biển',
        activities: ['Chèo thuyền kayak', 'Tắm biển', 'Tham quan làng chài'],
        accommodation: 'Nghỉ đêm trên tàu',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: true
        }
      },
      {
        day: 3,
        title: 'Bãi biển Ti Tốp',
        description: 'Tham quan bãi biển Ti Tốp, leo núi ngắm cảnh panorama vịnh Hạ Long, trở về đất liền',
        activities: ['Leo núi', 'Tắm biển', 'Mua sắm đồ lưu niệm'],
        accommodation: 'Không có',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        }
      }
    ],
    includes: [
      'Xe đưa đón từ Hà Nội',
      'Hướng dẫn viên tiếng Việt & Anh',
      'Vé vào cổng các điểm tham quan',
      'Các bữa ăn theo chương trình',
      'Phòng nghỉ trên tàu'
    ],
    excludes: [
      'Đồ uống',
      'Chi phí cá nhân',
      'Tiền tip',
      'Bảo hiểm du lịch'
    ]
  },
  {
    name: 'Khám phá Sapa 2 ngày 1 đêm',
    description: 'Hành trình khám phá vẻ đẹp hùng vĩ của Sapa với những ruộng bậc thang tuyệt đẹp, gặp gỡ các dân tộc thiểu số và trải nghiệm văn hóa địa phương độc đáo.',
    duration: 2,
    maxGroupSize: 10,
    difficulty: 'trung bình',
    price: 2500000,
    priceDiscount: 0,
    coverImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526',
    images: [
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220',
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923',
      'https://images.unsplash.com/photo-1504457047772-27faf1c00561'
    ],
    startDates: [
      new Date('2024-05-20'),
      new Date('2024-07-25'),
      new Date('2024-09-10')
    ],
    startLocation: {
      type: 'Point',
      coordinates: [103.8437, 22.3364],
      address: 'Thị trấn Sapa, Lào Cai',
      description: 'Sa Pa'
    },
    locations: [
      {
        type: 'Point',
        coordinates: [103.8618, 22.3302],
        description: 'Làng Cát Cát',
        day: 1
      },
      {
        type: 'Point',
        coordinates: [103.9075, 22.2709],
        description: 'Thung lũng Mường Hoa',
        day: 2
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'Khám phá làng Cát Cát',
        description: 'Đến Sapa, thăm làng Cát Cát của người H\'Mông, tìm hiểu về văn hóa và phong tục của người dân bản địa',
        activities: ['Đi bộ thăm làng', 'Xem biểu diễn văn nghệ', 'Mua đồ thổ cẩm'],
        accommodation: 'Khách sạn tại Sapa',
        meals: {
          breakfast: false,
          lunch: true, 
          dinner: true
        }
      },
      {
        day: 2,
        title: 'Thung lũng Mường Hoa',
        description: 'Trekking khám phá thung lũng Mường Hoa, ngắm nhìn ruộng bậc thang, trở về Hà Nội',
        activities: ['Trekking', 'Chụp ảnh phong cảnh', 'Giao lưu với người dân bản địa'],
        accommodation: 'Không có',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        }
      }
    ],
    includes: [
      'Xe đưa đón từ Hà Nội',
      'Hướng dẫn viên',
      'Phòng khách sạn 3 sao',
      'Các bữa ăn theo chương trình',
      'Vé tham quan các điểm'
    ],
    excludes: [
      'Đồ uống',
      'Chi phí cá nhân',
      'Tiền tip'
    ]
  },
  {
    name: 'Tour Đà Nẵng - Hội An - Huế 5 ngày',
    description: 'Hành trình khám phá miền Trung Việt Nam với các điểm đến nổi tiếng như Đà Nẵng, Hội An và Huế. Tận hưởng bãi biển đẹp, thưởng thức ẩm thực đặc sắc và tham quan các di tích lịch sử văn hóa.',
    duration: 5,
    maxGroupSize: 12,
    difficulty: 'dễ',
    price: 6000000,
    priceDiscount: 600000,
    coverImage: 'https://images.unsplash.com/photo-1549145157-2adf0f87ea33',
    images: [
      'https://images.unsplash.com/photo-1587132647649-65b9b2be3985',
      'https://images.unsplash.com/photo-1557750255-c76072a7fdf1',
      'https://images.unsplash.com/photo-1557750256-bf5755feda47'
    ],
    startDates: [
      new Date('2024-06-10'),
      new Date('2024-08-15'),
      new Date('2024-10-20')
    ],
    startLocation: {
      type: 'Point',
      coordinates: [108.2097, 16.0545],
      address: 'Sân bay Đà Nẵng',
      description: 'Đà Nẵng'
    },
    locations: [
      {
        type: 'Point',
        coordinates: [108.2496, 16.0837],
        description: 'Bà Nà Hills',
        day: 1
      },
      {
        type: 'Point',
        coordinates: [108.3292, 15.8801],
        description: 'Phố cổ Hội An',
        day: 2
      },
      {
        type: 'Point',
        coordinates: [107.5761, 16.4637],
        description: 'Kinh thành Huế',
        day: 4
      }
    ],
    itinerary: [
      {
        day: 1,
        title: 'Khám phá Đà Nẵng',
        description: 'Thăm bán đảo Sơn Trà, chùa Linh Ứng, tham quan Bà Nà Hills và Cầu Vàng',
        activities: ['Tham quan Bà Nà Hills', 'Chụp ảnh Cầu Vàng', 'Tắm biển'],
        accommodation: 'Khách sạn tại Đà Nẵng',
        meals: {
          breakfast: false,
          lunch: true,
          dinner: true
        }
      },
      {
        day: 2,
        title: 'Phố cổ Hội An',
        description: 'Tham quan phố cổ Hội An, chùa Cầu, khu phố đèn lồng',
        activities: ['Đạp xe thăm làng nghề', 'Mua sắm', 'Ăn đặc sản Hội An'],
        accommodation: 'Khách sạn tại Hội An',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: true
        }
      },
      {
        day: 3,
        title: 'Di sản văn hóa Mỹ Sơn',
        description: 'Tham quan khu di tích Mỹ Sơn, trở về Hội An chiều và tự do khám phá',
        activities: ['Tham quan di tích', 'Xem biểu diễn nghệ thuật Chăm', 'Đi thuyền trên sông Thu Bồn'],
        accommodation: 'Khách sạn tại Hội An',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        }
      },
      {
        day: 4,
        title: 'Di sản cố đô Huế',
        description: 'Di chuyển đến Huế, tham quan Kinh thành, lăng Tự Đức, chùa Thiên Mụ',
        activities: ['Thăm Kinh thành', 'Thăm lăng tẩm', 'Đi thuyền trên sông Hương'],
        accommodation: 'Khách sạn tại Huế',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: true
        }
      },
      {
        day: 5,
        title: 'Tạm biệt Huế',
        description: 'Thăm chợ Đông Ba, mua đồ lưu niệm và trở về Đà Nẵng',
        activities: ['Mua sắm ở chợ Đông Ba', 'Ăn bún bò Huế', 'Di chuyển về Đà Nẵng'],
        accommodation: 'Không có',
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        }
      }
    ],
    includes: [
      'Vé máy bay khứ hồi',
      'Xe đưa đón theo lịch trình',
      'Khách sạn 4 sao',
      'Hướng dẫn viên tiếng Việt & Anh',
      'Vé vào cổng các điểm tham quan',
      'Các bữa ăn theo chương trình'
    ],
    excludes: [
      'Đồ uống',
      'Chi phí cá nhân',
      'Tiền tip',
      'Các dịch vụ không đề cập trong phần bao gồm'
    ]
  }
];

// Dữ liệu mẫu cho users
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '0987654321',
    password: 'Admin@123',
    role: 'admin',
    avatar: 'default-avatar.jpg'
  },
  {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    password: 'image.png',
    role: 'user',
    avatar: 'default-avatar.jpg'
  },
  {
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0923456789',
    password: 'Password@123',
    role: 'user',
    avatar: 'default-avatar.jpg'
  }
];

// Hàm tạo review cho tours
const createReviewsData = (tourIds, userIds) => {
  const reviews = [];
  
  // Đảm bảo mỗi user chỉ review mỗi tour một lần để tránh lỗi duplicate key
  // Bỏ qua admin user (index 0)
  const regularUserIds = userIds.slice(1);
  
  tourIds.forEach((tourId, tourIndex) => {
    regularUserIds.forEach((userId, userIndex) => {
      // Tạo nội dung review khác nhau
      const reviewTexts = [
        'Tour rất tuyệt vời, cảnh đẹp, hướng dẫn viên nhiệt tình.',
        'Dịch vụ tốt, đồ ăn ngon, giá cả hợp lý.',
        'Trải nghiệm đáng nhớ, rất đáng giá, sẽ quay lại lần sau.',
        'Chuyến đi thú vị, tuy nhiên thời gian hơi gấp rút.'
      ];
      
      const reviewIndex = (tourIndex + userIndex) % reviewTexts.length;
      
      reviews.push({
        review: reviewTexts[reviewIndex],
        rating: 4 + (tourIndex % 2), // Rating là 4 hoặc 5
        tour: tourId,
        user: userId
      });
    });
  });
  
  return reviews;
};

// Hàm xóa collections
const dropCollections = async () => {
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      await collection.drop();
      console.log(`Đã xóa collection ${collection.collectionName}`);
    }
    
    console.log('Đã xóa tất cả collections');
  } catch (error) {
    console.error(`Lỗi khi xóa collections: ${error.message}`);
    // Trong trường hợp lỗi, thử xóa từng model riêng lẻ
    try {
      await Review.deleteMany({});
      await Tour.deleteMany({});
      await User.deleteMany({});
      console.log('Đã xóa dữ liệu từ các model');
    } catch (error) {
      console.error(`Lỗi khi xóa data: ${error.message}`);
    }
  }
};

// Hàm import dữ liệu
const importData = async () => {
  try {
    // Kết nối đến MongoDB
    await connectDB();
    
    // Xóa dữ liệu cũ
    await dropCollections();
    console.log('Đã xóa dữ liệu cũ');

    // Tạo users
    const createdUsers = await User.create(users);
    console.log(`Đã tạo ${createdUsers.length} users`);
    
    // Lấy userId của admin để gán cho guides của tours
    const adminUser = createdUsers[0]._id;
    
    // Gán admin làm guide cho mỗi tour
    const toursWithGuides = tours.map(tour => ({
      ...tour,
      guides: [adminUser]
    }));
    
    // Tạo tours
    const createdTours = await Tour.create(toursWithGuides);
    console.log(`Đã tạo ${createdTours.length} tours`);
    
    // Lấy tour IDs và user IDs để tạo reviews
    const tourIds = createdTours.map(tour => tour._id);
    const userIds = createdUsers.map(user => user._id);
    
    // Tạo và lưu reviews
    const reviewsData = createReviewsData(tourIds, userIds);
    const createdReviews = await Review.create(reviewsData);
    console.log(`Đã tạo ${createdReviews.length} reviews`);
    
    console.log('Đã import dữ liệu thành công!');
    process.exit();
  } catch (error) {
    console.error(`Lỗi: ${error.message}`);
    process.exit(1);
  }
};

// Hàm xóa dữ liệu
const deleteData = async () => {
  try {
    // Kết nối đến MongoDB
    await connectDB();
    
    // Xóa dữ liệu cũ
    await dropCollections();
    
    console.log('Đã xóa tất cả dữ liệu thành công!');
    process.exit();
  } catch (error) {
    console.error(`Lỗi: ${error.message}`);
    process.exit(1);
  }
};

// Xử lý arguments khi chạy lệnh
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log('Lệnh không đúng. Sử dụng: node seeder.js --import hoặc node seeder.js --delete');
  process.exit();
} 