import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMap, FiCalendar, FiSearch, FiMapPin, FiUsers, FiStar, FiCreditCard, FiHeadphones, FiShield } from 'react-icons/fi';
import { tourService } from '../services/tourService';
import { hotelService } from '../services/hotelService';

const HomePage = () => {
  const [popularTours, setPopularTours] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toursResponse, hotelsResponse] = await Promise.all([
          tourService.getPopularTours(),
          hotelService.getFeaturedHotels()
        ]);
        
        console.log('API Tours Response:', toursResponse);
        console.log('API Hotels Response:', hotelsResponse);
        
        // Kiểm tra cấu trúc dữ liệu và truy cập đúng
        if (toursResponse && toursResponse.success) {
          // Trường hợp response đã được xử lý trong service
          setPopularTours(toursResponse.data?.tours?.slice(0, 4) || []);
        } else if (toursResponse && toursResponse.data) {
          // Trường hợp response chưa được xử lý trong service
          const tours = toursResponse.data.data?.tours || toursResponse.data.tours || [];
          setPopularTours(tours.slice(0, 4));
        }
        
        if (hotelsResponse && hotelsResponse.success) {
          // Trường hợp response đã được xử lý trong service
          setFeaturedHotels(hotelsResponse.data?.slice(0, 4) || []);
        } else if (hotelsResponse && hotelsResponse.data) {
          // Trường hợp response chưa được xử lý trong service
          const hotels = hotelsResponse.data.data || hotelsResponse.data || [];
          setFeaturedHotels(hotels.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] bg-cover bg-center flex items-center" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        
        <div className="container relative z-10 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Khám phá thế giới cùng Dawin
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Tìm những tour du lịch, khách sạn và vé máy bay tốt nhất với giá ưu đãi. Trải nghiệm du lịch tuyệt vời đang chờ đón bạn!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/tours" className="btn btn-primary px-8 py-3 text-lg">
                Khám phá ngay
              </Link>
              <Link to="/about" className="btn bg-white/20 hover:bg-white/30 backdrop-blur-sm px-8 py-3 text-lg">
                Tìm hiểu thêm
              </Link>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Features Section */}
      <section className="mt-32 py-16">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn Dawin?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp trải nghiệm du lịch tuyệt vời với dịch vụ chất lượng cao và giá cả phải chăng
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center p-6 rounded-lg shadow-soft"
            >
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCreditCard className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Giá tốt nhất</h3>
              <p className="text-gray-600">
                Chúng tôi đảm bảo mang đến cho bạn mức giá tốt nhất cho chuyến du lịch của bạn với nhiều ưu đãi hấp dẫn.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center p-6 rounded-lg shadow-soft"
            >
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHeadphones className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng phục vụ bạn mọi lúc, mọi nơi trong suốt chuyến đi.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center p-6 rounded-lg shadow-soft"
            >
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Đảm bảo an toàn</h3>
              <p className="text-gray-600">
                An toàn là ưu tiên hàng đầu, mọi tour đều được đảm bảo tuân thủ các tiêu chuẩn an toàn nghiêm ngặt.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Tours Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-2">Tour phổ biến</h2>
              <p className="text-gray-600">Khám phá những điểm đến được yêu thích nhất</p>
            </div>
            <Link to="/tours" className="btn btn-outline hover:text-primary-600">
              Xem tất cả
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
              ))
            ) : (
              popularTours.map((tour, index) => (
                <motion.div
                  key={tour._id || index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/tours/${tour._id}`} className="block rounded-lg overflow-hidden shadow-soft bg-white">
                    <div className="relative h-48">
                      <img
                        src={tour.coverImage || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc32?q=80&w=2070'}
                        alt={tour.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-primary-600">
                        {tour.duration} ngày
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <FiMapPin className="mr-1" />
                        <span>{tour.startLocation?.description || 'Hà Nội'}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 line-clamp-1">{tour.name}</h3>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FiStar className="text-yellow-500 mr-1" />
                          <span className="font-medium">{tour.ratingsAverage || 4.5}</span>
                          <span className="text-gray-500 text-sm ml-1">({tour.ratingsQuantity || 12})</span>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.price)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-2">Khách sạn nổi bật</h2>
              <p className="text-gray-600">Những lựa chọn lưu trú tuyệt vời cho chuyến đi của bạn</p>
            </div>
            <Link to="/hotels" className="btn btn-outline hover:text-primary-600">
              Xem tất cả
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
              ))
            ) : (
              featuredHotels.map((hotel, index) => (
                <motion.div
                  key={hotel._id || index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/hotels/${hotel._id}`} className="block rounded-lg overflow-hidden shadow-soft bg-white">
                    <div className="relative h-48">
                      <img
                        src={hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070'}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-primary-600">
                        {hotel.stars} sao
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <FiMapPin className="mr-1" />
                        <span>{hotel.city || 'Đà Nẵng'}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 line-clamp-1">{hotel.name}</h3>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FiStar className="text-yellow-500 mr-1" />
                          <span className="font-medium">{hotel.ratingsAverage || 4.5}</span>
                          <span className="text-gray-500 text-sm ml-1">({hotel.ratingsQuantity || 28})</span>
                        </div>
                        <div className="text-lg font-bold text-primary-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hotel.pricePerNight)}
                          <span className="text-gray-500 text-sm font-normal"> /đêm</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Sẵn sàng cho chuyến phiêu lưu tiếp theo của bạn?
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl mb-8 text-gray-100"
            >
              Tham gia cùng hàng ngàn du khách hài lòng với dịch vụ của chúng tôi. Đặt tour, khách sạn và vé máy bay ngay hôm nay!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to="/tours" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Khám phá Tours
              </Link>
              <Link to="/register" className="btn border-2 border-white bg-transparent hover:bg-white/10 px-8 py-3 text-lg">
                Đăng ký ngay
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 