import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiFilter, FiSearch, FiUsers, FiStar, FiChevronDown, FiX, FiWifi, FiCoffee, FiHome, FiArrowRight, FiHeart, FiGrid, FiList } from 'react-icons/fi';
import { hotelService } from '../../services/hotelService';

const HotelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State cho dữ liệu
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || 1,
    stars: '',
    priceRange: '',
    amenities: [],
    sortBy: 'price'
  });
  
  // State cho hiển thị
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Load dữ liệu khách sạn
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        // Xây dựng query params
        const queryParams = {
          page: currentPage,
          limit: 12
        };
        
        if (filters.location) queryParams.location = filters.location;
        if (filters.checkIn) queryParams.checkIn = filters.checkIn;
        if (filters.checkOut) queryParams.checkOut = filters.checkOut;
        if (filters.guests) queryParams.guests = filters.guests;
        if (filters.stars) queryParams.stars = filters.stars;
        if (filters.priceRange) queryParams.priceRange = filters.priceRange;
        if (filters.amenities.length > 0) queryParams.amenities = filters.amenities.join(',');
        if (filters.sortBy) queryParams.sort = filters.sortBy;
        
        const response = await hotelService.getHotels(queryParams);
        
        // Kiểm tra cấu trúc dữ liệu đúng
        if (response?.success && Array.isArray(response.data)) {
          setHotels(response.data);
          setFilteredHotels(response.data);
          
          // Lấy thông tin phân trang từ response
          if (response.pagination) {
            setTotalPages(response.pagination.pages || 1);
          } else {
            setTotalPages(Math.ceil(response.count / 12) || 1);
          }
          
          setError(null);
        } else {
          setError('Không thể tải danh sách khách sạn. Vui lòng thử lại sau.');
          setHotels([]);
          setFilteredHotels([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setError('Không thể tải danh sách khách sạn. Vui lòng thử lại sau.');
        setHotels([]);
        setFilteredHotels([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotels();
  }, [currentPage, filters]);
  
 
  
  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset về trang 1 khi thay đổi bộ lọc
    setCurrentPage(1);
  };
  
  // Xử lý thay đổi bộ lọc tiện ích
  const handleAmenityChange = (amenity) => {
    setFilters(prev => {
      const amenities = [...prev.amenities];
      if (amenities.includes(amenity)) {
        return { ...prev, amenities: amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...amenities, amenity] };
      }
    });
    
    // Reset về trang 1 khi thay đổi bộ lọc
    setCurrentPage(1);
  };
  
  // Xử lý reset bộ lọc
  const handleResetFilters = () => {
    setFilters({
      location: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      stars: '',
      priceRange: '',
      amenities: [],
      sortBy: 'price'
    });
    
    setCurrentPage(1);
  };
  
  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Format giá tiền
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Hiệu ứng animation
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
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
  
  // Số sao
  const starOptions = [
    { value: '', label: 'Tất cả hạng sao' },
    { value: '5', label: '5 sao' },
    { value: '4', label: '4 sao trở lên' },
    { value: '3', label: '3 sao trở lên' },
    { value: '2', label: '2 sao trở lên' },
    { value: '1', label: '1 sao trở lên' }
  ];
  
  // Khoảng giá
  const priceRangeOptions = [
    { value: '', label: 'Tất cả mức giá' },
    { value: '0-1000000', label: 'Dưới 1 triệu/đêm' },
    { value: '1000000-2000000', label: '1 - 2 triệu/đêm' },
    { value: '2000000-5000000', label: '2 - 5 triệu/đêm' },
    { value: '5000000+', label: 'Trên 5 triệu/đêm' }
  ];
  
  // Tiện ích
  const amenityOptions = [
    { value: 'wifi', label: 'WiFi', icon: <FiWifi /> },
    { value: 'pool', label: 'Hồ bơi', icon: <FiHome /> },
    { value: 'spa', label: 'Spa', icon: <FiCoffee /> },
    { value: 'restaurant', label: 'Nhà hàng', icon: <FiCoffee /> },
    { value: 'parking', label: 'Bãi đỗ xe', icon: <FiHome /> },
    { value: 'fitness', label: 'Phòng tập gym', icon: <FiHome /> },
    { value: 'bar', label: 'Quầy bar', icon: <FiCoffee /> },
    { value: 'beach', label: 'Bãi biển riêng', icon: <FiHome /> }
  ];
  
  // Sắp xếp
  const sortOptions = [
    { value: 'price', label: 'Giá: Thấp đến cao' },
    { value: '-price', label: 'Giá: Cao đến thấp' },
    { value: '-ratingsAverage', label: 'Đánh giá: Cao nhất' },
    { value: '-stars', label: 'Hạng sao: Cao nhất' },
    { value: 'stars', label: 'Hạng sao: Thấp nhất' }
  ];
  
  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-16">
      <div className="container">
        {/* Hero section */}
        <div className="relative h-80 rounded-xl overflow-hidden mb-8">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070"
            alt="Khách sạn Việt Nam" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-bold mb-4">Khách sạn & Nghỉ dưỡng</h1>
            <p className="text-xl max-w-2xl text-center">
              Trải nghiệm dịch vụ lưu trú đẳng cấp với giá tốt nhất, từ khách sạn sang trọng đến những khu nghỉ dưỡng độc đáo
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar bộ lọc */}
          <motion.div 
            className={`lg:w-1/4 ${isFilterVisible ? 'block' : 'hidden lg:block'}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Bộ lọc</h2>
                <button 
                  onClick={handleResetFilters}
                  className="text-primary-600 text-sm hover:underline flex items-center"
                >
                  <FiX className="mr-1" />
                  Đặt lại
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Điểm đến */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đến
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Bạn muốn đến đâu?"
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                {/* Ngày nhận phòng */}
                <div>
                  <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày nhận phòng
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      value={filters.checkIn}
                      onChange={handleFilterChange}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                {/* Ngày trả phòng */}
                <div>
                  <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày trả phòng
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      value={filters.checkOut}
                      onChange={handleFilterChange}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                {/* Số khách */}
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                    Số khách
                  </label>
                  <div className="relative">
                    <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      id="guests"
                      name="guests"
                      value={filters.guests}
                      onChange={handleFilterChange}
                      className="input pl-10 w-full"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} khách
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Số sao */}
                <div>
                  <label htmlFor="stars" className="block text-sm font-medium text-gray-700 mb-2">
                    Hạng sao
                  </label>
                  <select
                    id="stars"
                    name="stars"
                    value={filters.stars}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    {starOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Khoảng giá */}
                <div>
                  <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-2">
                    Giá phòng/đêm
                  </label>
                  <select
                    id="priceRange"
                    name="priceRange"
                    value={filters.priceRange}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    {priceRangeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Tiện ích */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiện ích
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {amenityOptions.map((amenity) => (
                      <div 
                        key={amenity.value} 
                        className={`flex items-center p-2 rounded cursor-pointer ${
                          filters.amenities.includes(amenity.value) 
                            ? 'bg-primary-50 border border-primary-200' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleAmenityChange(amenity.value)}
                      >
                        <span className={`mr-2 ${filters.amenities.includes(amenity.value) ? 'text-primary-600' : 'text-gray-500'}`}>
                          {amenity.icon}
                        </span>
                        <span className="text-sm">
                          {amenity.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Button tìm kiếm */}
                <button 
                  onClick={() => setCurrentPage(1)}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  <FiSearch className="mr-2" />
                  Áp dụng bộ lọc
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Danh sách khách sạn */}
          <div className="lg:w-3/4">
            {/* Điều khiển */}
            <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className="lg:hidden btn btn-outline flex items-center"
                >
                  <FiFilter className="mr-2" />
                  <span>Bộ lọc</span>
                  <FiChevronDown className={`ml-1 transform transition-transform ${isFilterVisible ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">Sắp xếp theo:</span>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="input py-1 px-3"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <FiGrid />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <FiList />
                  </button>
                  <span className="text-gray-600">
                    Hiển thị {filteredHotels.length} khách sạn
                  </span>
                </div>
              </div>
            </div>
            
            {/* Danh sách khách sạn */}
            {loading ? (
              // Skeleton loading
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
                {Array(6).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse">
                    <div className={viewMode === 'grid' ? 'h-48 bg-gray-200' : 'flex h-48'}>
                      {viewMode === 'list' && <div className="w-1/3 bg-gray-200"></div>}
                      <div className={viewMode === 'grid' ? '' : 'w-2/3 p-6'}>
                        {viewMode === 'list' && (
                          <>
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="flex justify-between mt-4">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-8 bg-gray-200 rounded w-1/5"></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {viewMode === 'grid' && (
                      <div className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="flex justify-between mb-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-xl">
                <p className="text-center">{error}</p>
              </div>
            ) : filteredHotels.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
              >
                {filteredHotels.map((hotel) => (
                  <motion.div
                    key={hotel._id}
                    variants={fadeInUp}
                    className={`bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'md:w-1/3' : 'h-48'} overflow-hidden`}>
                      <img
                        src={hotel.coverImage}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-primary-50 transition-colors">
                        <FiHeart className="text-primary-500" />
                      </div>
                      {hotel.priceDiscount > 0 && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                          Giảm {Math.round((hotel.priceDiscount / hotel.pricePerNight) * 100)}%
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'md:w-2/3' : ''}`}>
                      <div className="flex items-center mb-2">
                        <FiMapPin className="text-primary-500 mr-1" />
                        <span className="text-gray-600 text-sm">{hotel.address || hotel.city || 'Việt Nam'}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{hotel.name}</h3>
                      
                      {viewMode === 'list' && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{hotel.description || `Khách sạn ${hotel.stars} sao tại ${hotel.city}`}</p>
                      )}
                      
                      <div className="flex items-center mb-3">
                        <div className="flex mr-3">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < hotel.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'} mr-0.5`}
                            />
                          ))}
                        </div>
                        
                        <span className="text-gray-600 text-sm">
                          {hotel.ratingsAverage || 4.5} ({hotel.ratingsQuantity || 0} đánh giá)
                        </span>
                      </div>
                      
                      {viewMode === 'list' ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(hotel.amenities || []).slice(0, 4).map((amenity) => (
                            <span key={amenity} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center">
                              {amenityOptions.find(opt => opt.value === amenity)?.icon}
                              <span className="ml-1">{amenityOptions.find(opt => opt.value === amenity)?.label}</span>
                            </span>
                          ))}
                          {(!hotel.amenities || hotel.amenities.length === 0) && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              Các tiện ích cơ bản
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(hotel.amenities || []).slice(0, 3).map((amenity) => (
                            <span key={amenity} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                              {amenityOptions.find(opt => opt.value === amenity)?.label}
                            </span>
                          ))}
                          {hotel.amenities && hotel.amenities.length > 3 && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                              +{hotel.amenities.length - 3}
                            </span>
                          )}
                          {(!hotel.amenities || hotel.amenities.length === 0) && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                              Các tiện ích cơ bản
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div>
                          {hotel.priceDiscount > 0 ? (
                            <>
                              <span className="text-gray-500 line-through text-sm mr-2">
                                {formatCurrency(hotel.pricePerNight)}
                              </span>
                              <span className="text-primary-600 font-bold text-xl">
                                {formatCurrency(hotel.pricePerNight - hotel.priceDiscount)}
                              </span>
                            </>
                          ) : (
                            <span className="text-primary-600 font-bold text-xl">
                              {formatCurrency(hotel.pricePerNight)}
                            </span>
                          )}
                          <p className="text-gray-500 text-xs">/đêm</p>
                        </div>
                        <Link
                          to={`/hotels/${hotel.slug || hotel._id}`}
                          className="btn btn-primary whitespace-nowrap"
                        >
                          <span className="mr-2">Chi tiết</span>
                          <FiArrowRight />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                <h3 className="text-xl font-bold mb-2">Không tìm thấy khách sạn nào</h3>
                <p className="text-gray-600 mb-6">
                  Không có khách sạn nào phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các bộ lọc khác.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn btn-primary"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
            
            {/* Phân trang */}
            {filteredHotels.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Trước
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    // Hiển thị tối đa 5 nút phân trang
                    if (totalPages <= 5 || 
                        index + 1 === 1 || 
                        index + 1 === totalPages || 
                        (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1)) {
                      return (
                        <button
                          key={index}
                          onClick={() => handlePageChange(index + 1)}
                          className={`px-4 py-2 rounded-md ${
                            currentPage === index + 1 ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    } else if (index + 1 === currentPage - 2 || index + 1 === currentPage + 2) {
                      return <span key={index} className="px-4 py-2">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelsPage; 