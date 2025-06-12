const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error');
const mongoose = require('mongoose');

// Load env vars
dotenv.config({ path: './.env' });

// Cấu hình Mongoose
mongoose.set('strictQuery', false);
mongoose.set('strictPopulate', false);

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const tourRoutes = require('./routes/tourRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const tourBookingRoutes = require('./routes/tourBookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const hotelBookingRoutes = require('./routes/hotelBookingRoutes');
const flightBookingRoutes = require('./routes/flightBookingRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Body parser - tăng giới hạn dung lượng để xử lý requests lớn
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging middleware cho debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Cấu hình CORS chi tiết
const corsOptions = {
  // Cho phép các origin từ môi trường development và production
  origin: function(origin, callback) {
    // Các domains được phép
    const allowedOrigins = [
      'http://localhost:3000',      // Frontend user - local
      'http://localhost:3001',      // Frontend admin - local
      'http://localhost:3007',      // Frontend admin - local
      'http://localhost:3009',      // Frontend admin - local
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3006',
      'http://127.0.0.1:3009',
      'https://gotour.yourdomain.com', // Thay bằng domain thực tế
      // Thêm các domain khác nếu cần
    ];
    
    // Cho phép requests không có origin (như mobile apps hoặc Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Không được phép bởi CORS'));
    }
  },
  // Cho phép cookies và headers xác thực
  credentials: true,
  // Cho phép tất cả các methods
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  // Cho phép các headers quan trọng
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Cache preflight request trong 1 giờ
  maxAge: 3600
};

// Áp dụng cấu hình CORS
app.use(cors(corsOptions));

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));

// Test endpoint đơn giản - để kiểm tra kết nối
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API kết nối thành công',
    time: new Date().toISOString()
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tour-bookings', tourBookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/hotel-bookings', hotelBookingRoutes);
app.use('/api/flight-bookings', flightBookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Custom error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server đang chạy ở cổng ${PORT}`);
});

// Xử lý các ngoại lệ không bắt được
process.on('unhandledRejection', (err, promise) => {
  console.log(`Lỗi: ${err.message}`);
  // Đóng server và thoát
  server.close(() => process.exit(1));
});