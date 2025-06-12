import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiFilter, FiSearch, FiClock, FiUser, FiChevronDown, FiX, FiStar, FiArrowRight, FiHeart, FiGrid, FiList, FiNavigation } from 'react-icons/fi';
import { tourService } from '../../services/tourService';

const ToursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State cho dữ liệu tours
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    departure: searchParams.get('departure') || '',
    date: searchParams.get('date') || '',
    duration: '',
    priceRange: '',
    rating: '',
    category: '',
    sortBy: 'price'
  });
  
  // State cho hiển thị
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid hoặc list
  
  // Load dữ liệu tours
  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        // Xây dựng query params
        const queryParams = {
          page: currentPage,
          limit: 9
        };
        
        if (filters.destination) queryParams.destination = filters.destination;
        if (filters.departure) queryParams.departure = filters.departure;
        if (filters.date) queryParams.date = filters.date;
        if (filters.duration) queryParams.duration = filters.duration;
        if (filters.priceRange) queryParams.priceRange = filters.priceRange;
        if (filters.rating) queryParams.rating = filters.rating;
        if (filters.category) queryParams.category = filters.category;
        if (filters.sortBy) queryParams.sort = filters.sortBy;
        
        console.log('🔍 Query params being sent:', queryParams);
        console.log('🔍 Current filters:', filters);
        
        const response = await tourService.getAllTours(queryParams);
        
        console.log('📥 Response received:', response?.data);
        
        // Kiểm tra cấu trúc dữ liệu đúng
        if (response?.data?.success && response.data.data?.tours) {
          setTours(response.data.data.tours);
          setFilteredTours(response.data.data.tours);
          setTotalCount(response.data.data.totalCount || response.data.data.tours.length);
          setTotalPages(Math.ceil((response.data.data.totalCount || response.data.data.tours.length) / 9) || 1);
          setError(null);
          
          console.log('✅ Tours loaded successfully:', response.data.data.tours.length, 'tours');
        } else {
          setTours([]);
          setFilteredTours([]);
          setTotalCount(0);
          setTotalPages(1);
          setError('Không thể tải danh sách tour. Dữ liệu không đúng định dạng.');
          
          console.log('❌ No tours data or invalid response structure');
        }
              } catch (error) {
        console.error('Error fetching tours:', error);
        setError('Không thể tải danh sách tour. Vui lòng thử lại sau.');
        setTours([]);
        setFilteredTours([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTours();
  }, [currentPage, filters.destination, filters.departure, filters.date, filters.duration, filters.priceRange, filters.rating, filters.category, filters.sortBy]);
  
  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log('🔄 Filter changed:', name, '=', value);
    
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset về trang 1 khi thay đổi bộ lọc (chỉ khi không phải trang 1)
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Debounce function để tránh gọi API quá nhiều lần
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Tự động apply filters khi thay đổi destination input
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      setCurrentPage(1);
    }, 500);

    if (filters.destination !== searchParams.get('destination')) {
      debouncedSearch();
    }
  }, [filters.destination]);

  // Cập nhật URL params khi filters thay đổi
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (filters.destination) newParams.set('destination', filters.destination);
    if (filters.departure) newParams.set('departure', filters.departure);
    if (filters.date) newParams.set('date', filters.date);
    
    setSearchParams(newParams);
  }, [filters.destination, filters.departure, filters.date, setSearchParams]);
  
  // Xử lý reset bộ lọc
  const handleResetFilters = () => {
    setFilters({
      destination: '',
      departure: '',
      date: '',
      duration: '',
      priceRange: '',
      rating: '',
      category: '',
      sortBy: 'price'
    });
    
    setCurrentPage(1);
    
    // Xóa search params
    setSearchParams({});
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
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
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
  
  // Danh mục tour
  const tourCategories = [
    { value: '', label: 'Tất cả danh mục' },
    { value: 'adventure', label: 'Du lịch mạo hiểm' },
    { value: 'cultural', label: 'Du lịch văn hóa' },
    { value: 'beach', label: 'Du lịch biển' },
    { value: 'mountain', label: 'Du lịch núi' },
    { value: 'food', label: 'Du lịch ẩm thực' },
    { value: 'eco', label: 'Du lịch sinh thái' }
  ];
  
  // Khoảng thời gian
  const durationOptions = [
    { value: '', label: 'Tất cả thời gian' },
    { value: '1-3', label: '1-3 ngày' },
    { value: '4-7', label: '4-7 ngày' },
    { value: '8-14', label: '8-14 ngày' },
    { value: '15+', label: 'Trên 15 ngày' }
  ];
  
  // Điểm xuất phát
  const departureOptions = [
    { value: '', label: 'Tất cả điểm xuất phát' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' },
    { value: 'Cần Thơ', label: 'Cần Thơ' },
    { value: 'Hải Phòng', label: 'Hải Phòng' },
    { value: 'Nha Trang', label: 'Nha Trang' },
    { value: 'Phú Quốc', label: 'Phú Quốc' },
    { value: 'Sapa', label: 'Sapa' },
    { value: 'Quy Nhon', label: 'Quy Nhon' },
    { value: 'Huế', label: 'Huế' }
  ];

  // Khoảng giá
  const priceRangeOptions = [
    { value: '', label: 'Tất cả mức giá' },
    { value: '0-2000000', label: 'Dưới 2 triệu' },
    { value: '2000000-5000000', label: '2 - 5 triệu' },
    { value: '5000000-10000000', label: '5 - 10 triệu' },
    { value: '10000000+', label: 'Trên 10 triệu' }
  ];
  
  // Sắp xếp
  const sortOptions = [
    { value: 'price', label: 'Giá: Thấp đến cao' },
    { value: '-price', label: 'Giá: Cao đến thấp' },
    { value: '-ratingsAverage', label: 'Đánh giá: Cao nhất' },
    { value: 'duration', label: 'Thời gian: Ngắn nhất' },
    { value: '-duration', label: 'Thời gian: Dài nhất' }
  ];
  
  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-16">
      <div className="container">
        {/* Hero section */}
        <div className="relative h-80 rounded-xl overflow-hidden mb-8">
          <img 
            src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2073&auto=format&fit=crop"
            alt="Tour du lịch Việt Nam" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-bold mb-4">Tour du lịch Việt Nam</h1>
            <p className="text-xl max-w-2xl text-center">
              Khám phá những tour du lịch hấp dẫn với trải nghiệm độc đáo và dịch vụ chất lượng cao
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
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm đến
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={filters.destination}
                      onChange={handleFilterChange}
                      placeholder="Bạn muốn đi đâu?"
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Điểm xuất phát */}
                <div>
                  <label htmlFor="departure" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiNavigation className="mr-2 text-primary-500" />
                    Điểm xuất phát
                  </label>
                  <select
                    id="departure"
                    name="departure"
                    value={filters.departure}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    {departureOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Ngày khởi hành */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày khởi hành
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={filters.date}
                      onChange={handleFilterChange}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                {/* Thời gian */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={filters.duration}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Khoảng giá */}
                <div>
                  <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-2">
                    Khoảng giá
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
                
                {/* Đánh giá */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá
                  </label>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <input
                          type="radio"
                          id={`rating-${rating}`}
                          name="rating"
                          value={rating}
                          checked={filters.rating === rating.toString()}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor={`rating-${rating}`} className="ml-2 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} text-lg`}
                            />
                          ))}
                          <span className="ml-1">{rating === 5 ? 'trở lên' : 'trở lên'}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Danh mục */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục tour
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    {tourCategories.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                

              </div>
            </div>
          </motion.div>
          
          {/* Danh sách tours */}
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
                    Hiển thị {filteredTours.length} / {totalCount} tour
                    {(filters.destination || filters.departure || filters.duration || filters.priceRange || filters.rating || filters.category) && (
                      <span className="ml-2 text-primary-600 font-medium">
                        (đã lọc)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Danh sách tour */}
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
            ) : filteredTours.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
              >
                {filteredTours.map((tour) => (
                  <motion.div
                    key={tour._id}
                    variants={fadeInUp}
                    className={`bg-white rounded-xl overflow-hidden shadow-soft group hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'md:w-1/3' : 'h-48'} overflow-hidden`}>
                      <img
                        src={tour.coverImage || tour.imageCover}
                        alt={tour.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-primary-50 transition-colors">
                        <FiHeart className="text-primary-500" />
                      </div>
                      {tour.priceDiscount && tour.priceDiscount > 0 && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                          Giảm {Math.round(((tour.price - tour.priceDiscount) / tour.price) * 100)}%
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'md:w-2/3 flex flex-col' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FiMapPin className="text-primary-500 mr-1" />
                          <span className="text-gray-600 text-sm">{tour.startLocation?.description || 'Việt Nam'}</span>
                        </div>
                        {tour.startLocation?.description && (
                          <div className="flex items-center">
                            <FiNavigation className="text-green-500 mr-1 text-xs" />
                            <span className="text-green-600 text-xs font-medium">Xuất phát</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{tour.name}</h3>
                      
                      {viewMode === 'list' && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{tour.summary}</p>
                      )}
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <FiClock className="text-gray-500 mr-1" />
                          <span className="text-gray-600 text-sm">{tour.duration} ngày</span>
                        </div>
                        
                        <div className="flex items-center">
                          <FiUser className="text-gray-500 mr-1" />
                          <span className="text-gray-600 text-sm">tối đa {tour.maxGroupSize} người</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < Math.round(tour.ratingsAverage) ? 'text-yellow-400 fill-current' : 'text-gray-300'} mr-0.5`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-600 text-sm ml-1">
                          {tour.ratingsAverage} ({tour.ratingsQuantity} đánh giá)
                        </span>
                      </div>
                      
                      <div className={`flex justify-between items-end pt-3 border-t ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                        <div className="flex-1">
                          {tour.priceDiscount && tour.priceDiscount > 0 ? (
                            <div className="space-y-1">
                              <span className="text-gray-500 line-through text-sm block">
                                {formatCurrency(tour.price)}
                              </span>
                              <span className="text-primary-600 font-bold text-xl block">
                                {formatCurrency(tour.priceDiscount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-primary-600 font-bold text-xl block">
                              {formatCurrency(tour.price)}
                            </span>
                          )}
                          <p className="text-gray-500 text-xs mt-1">/người</p>
                        </div>
                        <Link
                          to={`/tours/${tour._id}`}
                          className="btn btn-primary whitespace-nowrap ml-4 flex-shrink-0"
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
                <h3 className="text-xl font-bold mb-2">Không tìm thấy tour nào</h3>
                <p className="text-gray-600 mb-6">
                  Không có tour nào phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các bộ lọc khác.
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
            {filteredTours.length > 0 && totalPages > 1 && (
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

export default ToursPage; 