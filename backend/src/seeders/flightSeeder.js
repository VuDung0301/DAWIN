const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const dotenv = require('dotenv');

dotenv.config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Không thể kết nối với MongoDB:', err));

// Dữ liệu mẫu cho chuyến bay
const flightData = [
  {
    flightNumber: 'VN123',
    airline: 'Vietnam Airlines',
    departureCity: 'Hà Nội',
    arrivalCity: 'Hồ Chí Minh',
    departureTime: new Date('2023-12-20T08:00:00Z'),
    arrivalTime: new Date('2023-12-20T10:00:00Z'),
    price: {
      economy: 1200000,
      business: 2500000,
      firstClass: 4000000,
    },
    seatsAvailable: {
      economy: 150,
      business: 20,
      firstClass: 10,
    },
    duration: 120, // 2 giờ
    status: 'Đúng giờ',
    features: {
      wifi: true,
      meals: true,
      entertainment: true,
      powerOutlets: true,
      usb: true,
    },
    image: 'https://static.vecteezy.com/system/resources/thumbnails/002/736/939/small/passenger-airplane-flying-in-the-sky-free-vector.jpg',
    active: true,
  },
  {
    flightNumber: 'VJ456',
    airline: 'Vietjet Air',
    departureCity: 'Đà Nẵng',
    arrivalCity: 'Hà Nội',
    departureTime: new Date('2023-12-21T14:30:00Z'),
    arrivalTime: new Date('2023-12-21T16:15:00Z'),
    price: {
      economy: 800000,
      business: 1800000,
      firstClass: 3000000,
    },
    seatsAvailable: {
      economy: 180,
      business: 12,
      firstClass: 0,
    },
    duration: 105, // 1 giờ 45 phút
    status: 'Đúng giờ',
    features: {
      wifi: false,
      meals: true,
      entertainment: true,
      powerOutlets: false,
      usb: true,
    },
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAe-Fx7u1l4aDVsvCgLN4QksWgEQx02Z6s5uimP9ncTQ&s',
    active: true,
  },
  {
    flightNumber: 'BL789',
    airline: 'Jetstar Pacific',
    departureCity: 'Hồ Chí Minh',
    arrivalCity: 'Phú Quốc',
    departureTime: new Date('2023-12-22T09:15:00Z'),
    arrivalTime: new Date('2023-12-22T10:30:00Z'),
    price: {
      economy: 950000,
      business: 1950000,
      firstClass: 0,
    },
    seatsAvailable: {
      economy: 200,
      business: 10,
      firstClass: 0,
    },
    duration: 75, // 1 giờ 15 phút
    status: 'Đúng giờ',
    features: {
      wifi: false,
      meals: false,
      entertainment: false,
      powerOutlets: false,
      usb: false,
    },
    image: 'https://www.travelandleisure.com/thmb/zJFE6dJ6k7Vw_M4OzAYqiZgQSWQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/airplane-flying-above-clouds-PLANEHEADER0523-839de3b8432544f787bef85e31e711a9.jpg',
    active: true,
  },
  {
    flightNumber: 'VN234',
    airline: 'Vietnam Airlines',
    departureCity: 'Hà Nội',
    arrivalCity: 'Nha Trang',
    departureTime: new Date('2023-12-23T07:30:00Z'),
    arrivalTime: new Date('2023-12-23T09:30:00Z'),
    price: {
      economy: 1300000,
      business: 2600000,
      firstClass: 4200000,
    },
    seatsAvailable: {
      economy: 140,
      business: 18,
      firstClass: 8,
    },
    duration: 120, // 2 giờ
    status: 'Đúng giờ',
    features: {
      wifi: true,
      meals: true,
      entertainment: true,
      powerOutlets: true,
      usb: true,
    },
    image: 'https://media.istockphoto.com/id/155439315/photo/passenger-airplane-flying-above-clouds-during-sunset.jpg?s=612x612&w=0&k=20&c=LJWadbs3B-jSASxOtKiT8uiO6FfZrUxFpEHJk_B4xT0=',
    active: true,
  },
  {
    flightNumber: 'VJ567',
    airline: 'Vietjet Air',
    departureCity: 'Hồ Chí Minh',
    arrivalCity: 'Đà Nẵng',
    departureTime: new Date('2023-12-24T11:00:00Z'),
    arrivalTime: new Date('2023-12-24T12:30:00Z'),
    price: {
      economy: 850000,
      business: 1850000,
      firstClass: 0,
    },
    seatsAvailable: {
      economy: 175,
      business: 15,
      firstClass: 0,
    },
    duration: 90, // 1 giờ 30 phút
    status: 'Đúng giờ',
    features: {
      wifi: false,
      meals: true,
      entertainment: true,
      powerOutlets: false,
      usb: true,
    },
    image: 'https://images.unsplash.com/photo-1535510537863-ca799f6de8e7?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    active: true,
  },
];

// Xóa tất cả dữ liệu hiện có và thêm dữ liệu mẫu
const seedFlights = async () => {
  try {
    // Xóa tất cả các chuyến bay hiện có
    await Flight.deleteMany({});
    console.log('Đã xóa tất cả dữ liệu chuyến bay hiện có');

    // Thêm dữ liệu mẫu
    const createdFlights = await Flight.create(flightData);
    console.log(`Đã tạo ${createdFlights.length} chuyến bay mới`);

    // Đóng kết nối MongoDB
    mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu chuyến bay:', error);
    mongoose.connection.close();
  }
};

// Chạy seeder
seedFlights(); 