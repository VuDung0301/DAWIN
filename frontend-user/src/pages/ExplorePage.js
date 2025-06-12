import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMap, FiMapPin, FiCalendar, FiSearch, FiTrendingUp, FiChevronRight, FiStar, FiArrowRight, FiUsers, FiClock, FiHeart, FiFilter } from 'react-icons/fi';
import { tourService } from '../services/tourService';
import { hotelService } from '../services/hotelService';

const ExplorePage = () => {
  // State cho dữ liệu
  const [featuredTours, setFeaturedTours] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho form tìm kiếm
  const [searchParams, setSearchParams] = useState({
    destination: '',
    date: '',
    type: 'all',
    guests: 1,
    budget: ''
  });
  
  // State cho lọc và hiển thị
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Hiệu ứng
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Tours nổi bật
        const toursResponse = await tourService.getFeaturedTours();
        setFeaturedTours(toursResponse.data || []);
        
        // Điểm đến phổ biến
        const destinationsResponse = await tourService.getPopularDestinations();
        setPopularDestinations(destinationsResponse || [
          {
            id: 1,
            name: 'Đà Nẵng',
            image: 'https://images.unsplash.com/photo-1564254557967-32072b02d389',
            tours: 35,
            description: 'Thành phố của những cây cầu và bãi biển tuyệt đẹp'
          },
          {
            id: 2,
            name: 'Hội An',
            image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b',
            tours: 28,
            description: 'Phố cổ lãng mạn với đèn lồng rực rỡ'
          },
          {
            id: 3,
            name: 'Hà Nội',
            image: 'https://images.unsplash.com/photo-1509030450996-09d5a7f059ba',
            tours: 42,
            description: 'Thủ đô ngàn năm văn hiến với nhiều di tích lịch sử'
          },
          {
            id: 4,
            name: 'Hạ Long',
            image: 'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a',
            tours: 30,
            description: 'Vịnh biển với hàng nghìn hòn đảo đá vôi hùng vĩ'
          },
          {
            id: 5,
            name: 'Phú Quốc',
            image: 'https://images.unsplash.com/photo-1589724538506-651da7c878fe',
            tours: 25,
            description: 'Hòn đảo thiên đường với bãi biển cát trắng mịn'
          },
          {
            id: 6,
            name: 'Sapa',
            image: 'https://images.unsplash.com/photo-1594102548317-9fd04061a618',
            tours: 20,
            description: 'Thị trấn trong sương mù với những thửa ruộng bậc thang'
          }
        ]);
        
        // Khách sạn nổi bật
        const hotelsResponse = await hotelService.getFeaturedHotels();
        setFeaturedHotels(hotelsResponse.data || []);
        
        // Sự kiện sắp tới
        setUpcomingEvents([
          {
            id: 1,
            name: 'Lễ hội Ánh sáng Hội An',
            date: '2023-08-15',
            image: 'https://images.unsplash.com/photo-1560179406-1c6c60e0dc76',
            location: 'Hội An, Quảng Nam'
          },
          {
            id: 2,
            name: 'Festival Huế 2023',
            date: '2023-09-01',
            image: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4',
            location: 'Huế, Thừa Thiên Huế'
          },
          {
            id: 3,
            name: 'Lễ hội Cầu ngư Đà Nẵng',
            date: '2023-07-25',
            image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7',
            location: 'Đà Nẵng'
          }
        ]);
        
        // Khuyến mãi
        setPromotions([
          {
            id: 1,
            title: 'Giảm 30% tour Đà Nẵng - Hội An',
            code: 'SUMMER30',
            expiry: '2023-08-31',
            image: 'https://images.unsplash.com/photo-1583294686452-2eff0fc9d5c7',
            discount: 30
          },
          {
            id: 2,
            title: 'Combo khách sạn + vé máy bay đi Phú Quốc',
            code: 'PHUQUOC',
            expiry: '2023-09-15',
            image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
            discount: 25
          },
          {
            id: 3,
            title: 'Ưu đãi đặt sớm tour Sapa mùa thu',
            code: 'EARLYFALL',
            expiry: '2023-10-01',
            image: 'https://images.unsplash.com/photo-1535709418-55ac5d23af7b',
            discount: 20
          }
        ]);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Xử lý thay đổi trong form tìm kiếm
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };
  
  // Xử lý tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Chuyển hướng đến trang kết quả tìm kiếm với params
    console.log('Tìm kiếm với:', searchParams);
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-cover bg-center flex items-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1583294686452-2eff0fc9d5c7?q=80&w=2070')` }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="container relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Khám phá Việt Nam</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Những trải nghiệm du lịch tuyệt vời đang chờ đón bạn. Từ những bãi biển hoang sơ đến những thành phố nhộn nhịp.
            </p>
            
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <form onSubmit={handleSearchSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-4 mb-2">
                    <div className="flex space-x-4 justify-center">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-full ${activeTab === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('all')}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-full ${activeTab === 'tours' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('tours')}
                      >
                        Tours
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-full ${activeTab === 'hotels' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('hotels')}
                      >
                        Khách sạn
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-full ${activeTab === 'flights' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('flights')}
                      >
                        Vé máy bay
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="destination"
                      value={searchParams.destination}
                      onChange={handleSearchChange}
                      placeholder="Bạn muốn đi đâu?"
                      className="input pl-10 text-gray-800 w-full"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="date"
                      value={searchParams.date}
                      onChange={handleSearchChange}
                      className="input pl-10 text-gray-800 w-full"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUsers className="text-gray-400" />
                    </div>
                    <select
                      name="guests"
                      value={searchParams.guests}
                      onChange={handleSearchChange}
                      className="input pl-10 text-gray-800 w-full"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} người
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
                    >
                      <FiSearch className="mr-2" />
                      <span>Tìm kiếm</span>
                    </button>
                  </div>
                  
                  <div className="col-span-1 md:col-span-4">
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-primary-600 flex items-center justify-center mx-auto"
                    >
                      <FiFilter className="mr-1" />
                      <span>Tìm kiếm nâng cao</span>
                      <FiChevronRight className={`ml-1 transform transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  
                  {showFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                          Ngân sách
                        </label>
                        <select
                          id="budget"
                          name="budget"
                          value={searchParams.budget}
                          onChange={handleSearchChange}
                          className="input text-gray-800 w-full"
                        >
                          <option value="">Tất cả mức giá</option>
                          <option value="low">Dưới 2,000,000đ</option>
                          <option value="medium">2,000,000đ - 5,000,000đ</option>
                          <option value="high">Trên 5,000,000đ</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian
                        </label>
                        <select
                          id="duration"
                          name="duration"
                          className="input text-gray-800 w-full"
                        >
                          <option value="">Tất cả</option>
                          <option value="1-3">1-3 ngày</option>
                          <option value="4-7">4-7 ngày</option>
                          <option value="8+">8+ ngày</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                          Đánh giá
                        </label>
                        <select
                          id="rating"
                          name="rating"
                          className="input text-gray-800 w-full"
                        >
                          <option value="">Tất cả đánh giá</option>
                          <option value="4+">4 sao trở lên</option>
                          <option value="3+">3 sao trở lên</option>
                          <option value="2+">2 sao trở lên</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
      
      <div className="container py-12">
        {/* Điểm đến phổ biến */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Điểm đến phổ biến</h2>
              <p className="text-gray-600">Khám phá những điểm đến được yêu thích nhất</p>
            </div>
            <Link to="/destinations" className="text-primary-600 hover:text-primary-700 flex items-center">
              <span>Xem tất cả</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
          >
            {(Array.isArray(popularDestinations) ? popularDestinations.slice(0, 6) : []).map((destination) => (
              <motion.div
                key={destination.id}
                variants={fadeInUp}
                className="bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    <h3 className="text-xl font-bold">{destination.name}</h3>
                    <div className="flex items-center">
                      <FiMap className="mr-1" />
                      <span>{destination.tours} tours</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-4">{destination.description}</p>
                  <Link
                    to={`/destinations/${destination.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                  >
                    <span>Khám phá</span>
                    <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        {/* Tours nổi bật */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Tours nổi bật</h2>
              <p className="text-gray-600">Những trải nghiệm tuyệt vời đang chờ đón bạn</p>
            </div>
            <Link to="/tours" className="text-primary-600 hover:text-primary-700 flex items-center">
              <span>Xem tất cả</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Skeleton loading
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-soft animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between mb-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              (Array.isArray(featuredTours) ? featuredTours.slice(0, 6) : []).map((tour) => (
                <motion.div
                  key={tour._id || tour.id}
                  variants={fadeInUp}
                  className="bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={tour.coverImage || tour.images?.[0] || 'https://images.unsplash.com/photo-1528127269322-539801943592'}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-primary-50 transition-colors">
                      <FiHeart className="text-primary-500" />
                    </div>
                    {tour.discount && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                        -{tour.discount}%
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <FiMapPin className="text-primary-500 mr-1" />
                      <span className="text-gray-600 text-sm">{tour.startLocation?.description || 'Việt Nam'}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{tour.name}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <FiClock className="text-gray-500 mr-1" />
                        <span className="text-gray-600 text-sm">{tour.duration} ngày</span>
                      </div>
                      <div className="flex items-center">
                        <FiStar className="text-yellow-500 mr-1" />
                        <span className="text-gray-600 text-sm">{tour.ratingsAverage || 4.5} ({tour.ratingsQuantity || 8})</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div>
                        <span className="text-gray-500 text-sm">Từ</span>
                        <p className="text-primary-600 font-bold text-xl">{formatCurrency(tour.price || 2000000)}</p>
                      </div>
                      <Link
                        to={`/tours/${tour._id || tour.id}`}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
        
        {/* Khuyến mãi */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Ưu đãi hấp dẫn</h2>
              <p className="text-gray-600">Tiết kiệm với những ưu đãi độc quyền</p>
            </div>
            <Link to="/promotions" className="text-primary-600 hover:text-primary-700 flex items-center">
              <span>Xem tất cả</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                variants={fadeInUp}
                className="relative rounded-xl overflow-hidden shadow-soft group"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute top-3 right-3 bg-red-500 text-white font-bold px-3 py-1 rounded-full">
                    -{promo.discount}%
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm mr-2">
                        {promo.code}
                      </span>
                      <span className="text-sm">Hết hạn: {formatDate(promo.expiry)}</span>
                    </div>
                    <Link
                      to={`/promotions/${promo.id}`}
                      className="bg-white text-primary-600 hover:bg-primary-50 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                    >
                      Nhận ưu đãi
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Khách sạn nổi bật */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Khách sạn đề xuất</h2>
              <p className="text-gray-600">Những nơi lưu trú tuyệt vời cho chuyến đi của bạn</p>
            </div>
            <Link to="/hotels" className="text-primary-600 hover:text-primary-700 flex items-center">
              <span>Xem tất cả</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Skeleton loading
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-soft animate-pulse">
                  <div className="h-40 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex justify-between mb-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  </div>
                </div>
              ))
            ) : (
              (Array.isArray(featuredHotels) ? featuredHotels.slice(0, 8) : []).map((hotel) => (
                <motion.div
                  key={hotel._id || hotel.id}
                  variants={fadeInUp}
                  className="bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={hotel.coverImage || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary-50 transition-colors">
                      <FiHeart className="text-primary-500 text-sm" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-lg font-bold mb-1 truncate">{hotel.name}</h3>
                    <div className="flex items-center mb-2">
                      <FiMapPin className="text-primary-500 mr-1 text-sm" />
                      <span className="text-gray-600 text-sm truncate">{hotel.location || hotel.city || 'Việt Nam'}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        <FiStar className="text-yellow-500 mr-1 text-sm" />
                        <span className="text-gray-600 text-sm">{hotel.stars || 4}</span>
                      </div>
                      <span className="mx-2 text-gray-400">•</span>
                      <div className="text-sm text-gray-600">{hotel.reviewCount || 24} đánh giá</div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <p className="text-primary-600 font-bold">{formatCurrency(hotel.pricePerNight || 1200000)}</p>
                        <p className="text-gray-500 text-xs">/ đêm</p>
                      </div>
                      <Link
                        to={`/hotels/${hotel._id || hotel.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
        
        {/* Sự kiện sắp tới */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Sự kiện sắp tới</h2>
              <p className="text-gray-600">Đừng bỏ lỡ những sự kiện hấp dẫn</p>
            </div>
            <Link to="/events" className="text-primary-600 hover:text-primary-700 flex items-center">
              <span>Xem tất cả</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                variants={fadeInUp}
                className="bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-md text-sm font-bold">
                    {formatDate(event.date)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                  <div className="flex items-center mb-4">
                    <FiMapPin className="text-primary-500 mr-1" />
                    <span className="text-gray-600">{event.location}</span>
                  </div>
                  <Link
                    to={`/events/${event.id}`}
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Chi tiết
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Newsletter */}
        <section className="bg-primary-600 rounded-2xl overflow-hidden">
          <div className="md:flex items-center">
            <div className="md:w-1/2 p-8 md:p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">Đăng ký nhận thông tin ưu đãi</h2>
              <p className="mb-6">
                Nhận ngay thông tin về những ưu đãi đặc biệt và gợi ý du lịch tuyệt vời cho chuyến đi tiếp theo của bạn.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Địa chỉ email của bạn"
                  className="flex-1 p-3 rounded-l-lg focus:outline-none text-gray-800"
                />
                <button className="bg-white text-primary-600 font-bold py-3 px-4 rounded-r-lg hover:bg-gray-100 transition-colors">
                  Đăng ký
                </button>
              </div>
            </div>
            <div className="md:w-1/2 h-60 md:h-auto">
              <img
                src="https://images.unsplash.com/photo-1540541338287-41700207dee6"
                alt="Newsletter"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExplorePage; 