import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch, FiMapPin, FiCalendar, FiFilter, FiGrid, FiList, FiStar,
  FiDollarSign, FiArrowRight, FiUsers, FiClock, FiX, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { tourService } from '../services/tourService';
import { hotelService } from '../services/hotelService';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({
    tours: [],
    hotels: [],
    flights: []
  });
  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    rating: '',
    duration: '',
    amenities: [],
    sortBy: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Effect để tải kết quả tìm kiếm
  useEffect(() => {
    if (searchTerm) {
      fetchSearchResults();
    }
  }, [searchTerm, searchType, filters.sortBy]);

  // Cập nhật URL mỗi khi thay đổi tham số tìm kiếm
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (searchType !== 'all') params.set('type', searchType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    
    setSearchParams(params);
  }, [searchTerm, searchType, filters, setSearchParams]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const results = {
        tours: [],
        hotels: [],
        flights: []
      };

      // Chỉ tìm kiếm theo loại được chọn hoặc tất cả
      if (searchType === 'all' || searchType === 'tours') {
        const toursResponse = await tourService.searchTours({
          search: searchTerm,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          rating: filters.rating
        });
        results.tours = toursResponse.data || [];
      }

      if (searchType === 'all' || searchType === 'hotels') {
        const hotelsResponse = await hotelService.searchHotels({
          search: searchTerm,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          rating: filters.rating
        });
        results.hotels = hotelsResponse.data || [];
      }

      // Mô phỏng tìm kiếm vé máy bay vì không có API
      if (searchType === 'all' || searchType === 'flights') {
        // Thay thế bằng API thực tế sau này
        results.flights = [];
      }

      setResults(results);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSearchResults();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchType(tab);
  };

  const getTotalResults = () => {
    const { tours, hotels, flights } = results;
    if (activeTab === 'all') {
      return tours.length + hotels.length + flights.length;
    } else if (activeTab === 'tours') {
      return tours.length;
    } else if (activeTab === 'hotels') {
      return hotels.length;
    } else {
      return flights.length;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Lọc và sắp xếp kết quả
  const getSortedResults = () => {
    let filteredResults = [];
    
    if (activeTab === 'all' || activeTab === 'tours') {
      filteredResults = [...filteredResults, ...results.tours.map(item => ({ ...item, type: 'tour' }))];
    }
    
    if (activeTab === 'all' || activeTab === 'hotels') {
      filteredResults = [...filteredResults, ...results.hotels.map(item => ({ ...item, type: 'hotel' }))];
    }
    
    if (activeTab === 'all' || activeTab === 'flights') {
      filteredResults = [...filteredResults, ...results.flights.map(item => ({ ...item, type: 'flight' }))];
    }

    // Lọc theo giá
    if (filters.minPrice) {
      filteredResults = filteredResults.filter(item => {
        const price = item.price || item.pricePerNight || 0;
        return price >= Number(filters.minPrice);
      });
    }

    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(item => {
        const price = item.price || item.pricePerNight || 0;
        return price <= Number(filters.maxPrice);
      });
    }

    // Lọc theo đánh giá
    if (filters.rating) {
      filteredResults = filteredResults.filter(item => {
        const rating = item.ratingsAverage || item.rating || 0;
        return rating >= Number(filters.rating);
      });
    }

    // Sắp xếp kết quả
    switch (filters.sortBy) {
      case 'price_asc':
        filteredResults.sort((a, b) => (a.price || a.pricePerNight || 0) - (b.price || b.pricePerNight || 0));
        break;
      case 'price_desc':
        filteredResults.sort((a, b) => (b.price || b.pricePerNight || 0) - (a.price || a.pricePerNight || 0));
        break;
      case 'rating':
        filteredResults.sort((a, b) => (b.ratingsAverage || b.rating || 0) - (a.ratingsAverage || a.rating || 0));
        break;
      case 'newest':
        filteredResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Mặc định sắp xếp theo liên quan
        break;
    }

    return filteredResults;
  };

  // Render một mục tour
  const renderTourItem = (tour) => (
    <motion.div 
      key={`tour-${tour._id}`}
      variants={itemVariants}
      className={view === 'grid' ? 'rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white' : 'flex rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white w-full'}
      whileHover={{ y: -5 }}
    >
      <div className={view === 'grid' ? 'relative' : 'relative w-1/3'}>
        <img 
          src={tour.imageCover || 'https://source.unsplash.com/random/300x200/?travel'} 
          alt={tour.name}
          className={view === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-full object-cover'}
        />
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          Tour
        </div>
      </div>
      <div className={view === 'grid' ? 'p-4' : 'p-4 flex-1'}>
        <h3 className="font-bold text-lg mb-2 text-gray-800">{tour.name}</h3>
        <div className="flex items-center mb-2">
          <FiMapPin className="text-gray-500 mr-1" size={14} />
          <span className="text-sm text-gray-600">{tour.startLocation?.description || 'Việt Nam'}</span>
        </div>
        <div className="flex items-center mb-2">
          <FiClock className="text-gray-500 mr-1" size={14} />
          <span className="text-sm text-gray-600">{tour.duration} ngày</span>
          <div className="mx-2 bg-gray-300 h-1 w-1 rounded-full"></div>
          <FiUsers className="text-gray-500 mr-1" size={14} />
          <span className="text-sm text-gray-600">Tối đa {tour.maxGroupSize} người</span>
        </div>
        <div className="flex items-center mb-3">
          <div className="flex items-center text-yellow-500">
            {[...Array(5)].map((_, index) => (
              <FiStar
                key={index}
                size={16}
                className={index < Math.round(tour.ratingsAverage || 0) ? "text-yellow-500 fill-current" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="ml-1 text-sm text-gray-600">{tour.ratingsQuantity || 0} đánh giá</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-primary-600 font-bold">
            {formatCurrency(tour.price || 0)}
            <span className="text-gray-500 text-sm font-normal"> /người</span>
          </div>
          <Link
            to={`/tours/${tour._id}`}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Chi tiết <FiArrowRight className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );

  // Render một mục khách sạn
  const renderHotelItem = (hotel) => (
    <motion.div 
      key={`hotel-${hotel._id}`}
      variants={itemVariants}
      className={view === 'grid' ? 'rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white' : 'flex rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white w-full'}
      whileHover={{ y: -5 }}
    >
      <div className={view === 'grid' ? 'relative' : 'relative w-1/3'}>
        <img 
          src={hotel.images?.[0] || 'https://source.unsplash.com/random/300x200/?hotel'} 
          alt={hotel.name}
          className={view === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-full object-cover'}
        />
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          Khách sạn
        </div>
      </div>
      <div className={view === 'grid' ? 'p-4' : 'p-4 flex-1'}>
        <h3 className="font-bold text-lg mb-2 text-gray-800">{hotel.name}</h3>
        <div className="flex items-center mb-2">
          <FiMapPin className="text-gray-500 mr-1" size={14} />
          <span className="text-sm text-gray-600">{hotel.address || ''}, {hotel.city || ''}</span>
        </div>
        <div className="flex items-center mb-3">
          <div className="flex items-center text-yellow-500">
            {[...Array(5)].map((_, index) => (
              <FiStar
                key={index}
                size={16}
                className={index < Math.round(hotel.rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="ml-1 text-sm text-gray-600">{hotel.numReviews || 0} đánh giá</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-primary-600 font-bold">
            {formatCurrency(hotel.pricePerNight || 0)}
            <span className="text-gray-500 text-sm font-normal"> /đêm</span>
          </div>
          <Link
            to={`/hotels/${hotel._id}`}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Chi tiết <FiArrowRight className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="container">
        {/* Thanh tìm kiếm */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="tours">Tours</option>
                  <option value="hotels">Khách sạn</option>
                  <option value="flights">Vé máy bay</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-6 py-3 transition-colors"
              >
                <FiSearch className="inline mr-2" /> Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Tabs và bộ lọc */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-6 py-2 rounded-full whitespace-nowrap mr-2 ${
                activeTab === 'all'
                  ? 'bg-primary-600 text-white font-medium shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleTabChange('tours')}
              className={`px-6 py-2 rounded-full whitespace-nowrap mr-2 ${
                activeTab === 'tours'
                  ? 'bg-primary-600 text-white font-medium shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              Tours
            </button>
            <button
              onClick={() => handleTabChange('hotels')}
              className={`px-6 py-2 rounded-full whitespace-nowrap mr-2 ${
                activeTab === 'hotels'
                  ? 'bg-primary-600 text-white font-medium shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              Khách sạn
            </button>
            <button
              onClick={() => handleTabChange('flights')}
              className={`px-6 py-2 rounded-full whitespace-nowrap ${
                activeTab === 'flights'
                  ? 'bg-primary-600 text-white font-medium shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              Vé máy bay
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded ${
                  view === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
                }`}
                title="Xem dạng lưới"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded ${
                  view === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
                }`}
                title="Xem dạng danh sách"
              >
                <FiList />
              </button>
            </div>
            <div className="flex-1 md:flex-initial">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="relevance">Sắp xếp: Liên quan nhất</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="newest">Mới nhất</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiFilter className="mr-2" /> Bộ lọc {showFilters ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
            </button>
          </div>
        </div>

        {/* Bộ lọc mở rộng */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lọc theo giá */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800">Khoảng giá</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Tối thiểu"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Tối đa"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lọc theo đánh giá */}
              <div>
                <h3 className="font-medium mb-3 text-gray-800">Đánh giá</h3>
                <select
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Tất cả đánh giá</option>
                  <option value="4">4 sao trở lên</option>
                  <option value="3">3 sao trở lên</option>
                  <option value="2">2 sao trở lên</option>
                </select>
              </div>

              {/* Nút đặt lại */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    minPrice: '',
                    maxPrice: '',
                    rating: '',
                    duration: '',
                    amenities: [],
                    sortBy: 'relevance'
                  })}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <FiX className="mr-2" /> Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hiển thị kết quả */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div>
            {/* Tiêu đề kết quả */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {searchTerm ? `Kết quả tìm kiếm cho "${searchTerm}"` : 'Tất cả kết quả'}
              </h2>
              <p className="text-gray-600">{getTotalResults()} kết quả được tìm thấy</p>
            </div>

            {/* Danh sách kết quả */}
            {getTotalResults() === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-10 text-center">
                <div className="text-6xl text-gray-300 mb-4">
                  <FiSearch className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-600 mb-6">
                  Không tìm thấy kết quả phù hợp với tìm kiếm "{searchTerm}". Vui lòng thử lại với từ khóa khác.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      minPrice: '',
                      maxPrice: '',
                      rating: '',
                      duration: '',
                      amenities: [],
                      sortBy: 'relevance'
                    });
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Đặt lại tìm kiếm
                </button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={
                  view === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-6'
                }
              >
                {getSortedResults().map(item => {
                  if (item.type === 'tour') {
                    return renderTourItem(item);
                  } else if (item.type === 'hotel') {
                    return renderHotelItem(item);
                  } else {
                    // Render flight item (nếu có)
                    return null;
                  }
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 