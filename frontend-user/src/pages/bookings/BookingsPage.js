import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMapPin, FiCalendar, FiUsers, FiClock, FiCheckCircle, 
  FiXCircle, FiLoader, FiCreditCard, FiSearch, FiFilter,
   FiHome, FiMap, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';

const BookingsPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    priceRange: 'all',
    sortBy: 'newest'
  });
  
  // Riêng các danh sách theo loại booking
  const [tourBookings, setTourBookings] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [flightBookings, setFlightBookings] = useState([]);
  
  // Load bookings của người dùng
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/bookings' } });
      return;
    }
    
    fetchAllBookings();
  }, [isAuthenticated, navigate]);
  
  // Hàm fetch tất cả bookings
  const fetchAllBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Gọi API riêng cho từng loại booking
      const [tourResponse, hotelResponse, flightResponse] = await Promise.all([
        bookingService.tourBookings.getAll(),
        bookingService.hotelBookings.getAll(),
        bookingService.flightBookings.getAll()
      ]);
      
      // Xử lý dữ liệu tour
      let processedTourBookings = [];
      if (tourResponse.success && tourResponse.data) {
        console.log("Tour bookings fetched:", tourResponse.data);
        // Xử lý và làm sạch dữ liệu
        processedTourBookings = tourResponse.data.map(booking => ({
          ...booking,
          _id: booking._id || booking.id,
          bookingType: 'tour',
          // Đảm bảo có thuộc tính totalPrice
          totalPrice: booking.price || booking.totalPrice || (booking.tour?.price * (booking.participants || 1)),
          startDate: booking.startDate,
          bookingReference: booking.bookingReference || `TUR${booking._id.substring(booking._id.length - 8)}`,
          // Đảm bảo dữ liệu tour
          tour: booking.tour || {},
          // Số người tham gia
          numOfPeople: booking.participants || booking.numOfPeople || 1
        }));
        setTourBookings(processedTourBookings);
      } else {
        console.error('Lỗi lấy danh sách tour:', tourResponse.message);
        setTourBookings([]);
      }
      
      // Xử lý dữ liệu hotel
      let processedHotelBookings = [];
      if (hotelResponse.success && hotelResponse.data) {
        console.log("Hotel bookings fetched:", hotelResponse.data);
        // Xử lý và làm sạch dữ liệu
        processedHotelBookings = hotelResponse.data.map(booking => ({
          ...booking,
          _id: booking._id || booking.id,
          bookingType: 'hotel',
          // Đảm bảo có thuộc tính totalPrice
          totalPrice: booking.price || booking.totalPrice
        }));
        setHotelBookings(processedHotelBookings);
      } else {
        console.error('Lỗi lấy danh sách khách sạn:', hotelResponse.message);
        setHotelBookings([]);
      }
      
      // Xử lý dữ liệu flight
      let processedFlightBookings = [];
      if (flightResponse.success && flightResponse.data) {
        console.log("Flight bookings fetched:", flightResponse.data);
        // Xử lý và làm sạch dữ liệu
        processedFlightBookings = flightResponse.data.map(booking => ({
          ...booking,
          _id: booking._id || booking.id,
          bookingType: 'flight',
          // Đảm bảo có thuộc tính totalPrice
          totalPrice: booking.price || booking.totalPrice
        }));
        setFlightBookings(processedFlightBookings);
      } else {
        console.error('Lỗi lấy danh sách chuyến bay:', flightResponse.message);
        setFlightBookings([]);
      }
      
      // Kết hợp tất cả bookings
      const allBookings = [
        ...processedTourBookings,
        ...processedHotelBookings,
        ...processedFlightBookings
      ];
      
      console.log("All processed bookings:", allBookings);
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Không thể tải thông tin đặt chỗ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Hủy booking
  const handleCancelBooking = async (bookingId, bookingType) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ này không?')) return;
    
    try {
      setLoading(true);
      let response;
      
      // Sử dụng API thích hợp cho từng loại booking
      if (bookingType === 'tour') {
        response = await bookingService.tourBookings.cancel(bookingId, 'Hủy bởi người dùng');
      } else if (bookingType === 'hotel') {
        response = await bookingService.hotelBookings.cancel(bookingId, 'Hủy bởi người dùng');
      } else if (bookingType === 'flight') {
        response = await bookingService.flightBookings.cancel(bookingId, 'Hủy bởi người dùng');
      }
      
      console.log('Kết quả hủy đặt chỗ:', response);
      
      if (response && response.success) {
        // Cập nhật danh sách bookings
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId ? { ...booking, status: 'cancelled' } : booking
          )
        );
        
        alert('Đã hủy đặt chỗ thành công!');
        
        // Tải lại danh sách booking sau khi hủy thành công
        setTimeout(() => {
          fetchAllBookings();
        }, 1000);
      } else {
        const errorMessage = response?.message || 'Không thể hủy đặt chỗ. Vui lòng thử lại sau.';
        console.error('Lỗi hủy đặt chỗ:', errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error?.response?.data?.message || error.message || 'Không thể hủy đặt chỗ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Lọc bookings theo các tiêu chí
  const filteredBookings = bookings.filter(booking => {
    // Lọc theo tab chính
    if (activeTab === 'upcoming' && booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }
    if (activeTab === 'completed' && booking.status !== 'completed') {
      return false;
    }
    if (activeTab === 'cancelled' && booking.status !== 'cancelled') {
      return false;
    }
    
    // Lọc theo loại booking
    if (filters.type !== 'all') {
      if (filters.type === 'tour' && booking.bookingType !== 'tour') return false;
      if (filters.type === 'hotel' && booking.bookingType !== 'hotel') return false;
      if (filters.type === 'flight' && booking.bookingType !== 'flight') return false;
    }
    
    // Lọc theo trạng thái cụ thể
    if (filters.status !== 'all') {
      const bookingStatus = booking.status?.toLowerCase();
      if (filters.status !== bookingStatus) return false;
    }
    
    // Lọc theo thời gian
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const bookingDate = new Date(booking.createdAt || booking.bookingDate);
      
      if (filters.dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        if (bookingDate < today || bookingDate >= tomorrow) return false;
      } else if (filters.dateRange === 'thisWeek') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        if (bookingDate < startOfWeek) return false;
      } else if (filters.dateRange === 'thisMonth') {
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (bookingDate < thisMonthStart) return false;
      } else if (filters.dateRange === 'lastMonth') {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (bookingDate < lastMonthStart || bookingDate >= thisMonthStart) return false;
      } else if (filters.dateRange === 'last3Months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        if (bookingDate < threeMonthsAgo) return false;
      } else if (filters.dateRange === 'last6Months') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        if (bookingDate < sixMonthsAgo) return false;
      } else if (filters.dateRange === 'thisYear') {
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        if (bookingDate < thisYearStart) return false;
      }
    }
    
    // Lọc theo khoảng giá
    if (filters.priceRange !== 'all') {
      const bookingPrice = booking.totalPrice || booking.price || 0;
      
      if (filters.priceRange === 'under1M' && bookingPrice >= 1000000) return false;
      if (filters.priceRange === '1M-3M' && (bookingPrice < 1000000 || bookingPrice >= 3000000)) return false;
      if (filters.priceRange === '3M-5M' && (bookingPrice < 3000000 || bookingPrice >= 5000000)) return false;
      if (filters.priceRange === '5M-10M' && (bookingPrice < 5000000 || bookingPrice >= 10000000)) return false;
      if (filters.priceRange === 'over10M' && bookingPrice < 10000000) return false;
    }
    
    // Lọc theo search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Tìm kiếm trong tất cả các trường liên quan
      const searchableFields = [
        booking.bookingReference,
        booking._id,
        booking.tour?.name,
        booking.tour?.description,
        booking.hotel?.name,
        booking.hotel?.address,
        booking.hotel?.city,
        booking.flight?.flightNumber,
        booking.flight?.airline,
        booking.flight?.departureCity,
        booking.flight?.arrivalCity,
        booking.contactInfo?.fullName,
        booking.contactInfo?.email,
        booking.contactInfo?.phone
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field?.toString().toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sắp xếp booking đã được lọc
  const getSortedBookings = () => {
    return filteredBookings.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate);
      } else if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt || a.bookingDate) - new Date(b.createdAt || b.bookingDate);
      } else if (filters.sortBy === 'priceHighToLow') {
        return (b.totalPrice || b.price || 0) - (a.totalPrice || a.price || 0);
      } else if (filters.sortBy === 'priceLowToHigh') {
        return (a.totalPrice || a.price || 0) - (b.totalPrice || b.price || 0);
      }
      return 0;
    });
  };
  
  const sortedBookings = getSortedBookings();
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return 'N/A';
    }
  };
  
  // Lấy màu và nhãn cho trạng thái
  const getStatusInfo = (status) => {
    // Chuẩn hóa status để tránh lỗi do viết hoa/thường
    const normalizedStatus = status?.toLowerCase() || 'pending';
    
    switch (normalizedStatus) {
      case 'pending':
      case 'chờ xác nhận':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="mr-1" />, label: 'Chờ xác nhận' };
      case 'confirmed':
      case 'đã xác nhận':
        return { color: 'bg-blue-100 text-blue-800', icon: <FiCheckCircle className="mr-1" />, label: 'Đã xác nhận' };
      case 'completed':
      case 'hoàn thành':
      case 'đã hoàn thành':
        return { color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="mr-1" />, label: 'Hoàn thành' };
      case 'cancelled':
      case 'canceled':
      case 'đã hủy':
        return { color: 'bg-red-100 text-red-800', icon: <FiXCircle className="mr-1" />, label: 'Đã hủy' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <FiClock className="mr-1" />, label: 'Đang xử lý' };
    }
  };

  // Lấy biểu tượng cho loại booking
  const getBookingTypeIcon = (bookingType) => {
    switch (bookingType) {
      case 'tour':
        return <FiMap className="mr-2 text-blue-500" />;
      case 'hotel':
        return <FiHome className="mr-2 text-green-500" />;
      case 'flight':
        return <FiMapPin className="mr-2 text-purple-500" />;
      default:
        return <FiCreditCard className="mr-2 text-gray-500" />;
    }
  };
  
  // Lấy thông tin chi tiết dựa vào loại booking
  const getBookingDetails = (booking) => {
    if (booking.bookingType === 'tour' && booking.tour) {
      return {
        title: booking.tour.name,
        subtitle: booking.tour.duration ? `${booking.tour.duration} ngày` : 'Tour du lịch',
        description: `${booking.participants || booking.numOfPeople || 1} người`,
        image: booking.tour.coverImage || (booking.tour.images && booking.tour.images.length > 0 ? booking.tour.images[0] : null),
        date: booking.startDate || booking.tourStartDate || booking.createdAt,
      };
    } else if (booking.bookingType === 'hotel' && booking.hotel) {
      return {
        title: booking.hotel.name,
        subtitle: `${booking.hotel.address || booking.hotel.city || 'Không có địa chỉ'}`,
        description: `${booking.roomType?.name || 'Phòng tiêu chuẩn'} - ${formatDate(booking.checkInDate || booking.checkIn)} đến ${formatDate(booking.checkOutDate || booking.checkOut)}`,
        image: booking.hotel.coverImage || (booking.hotel.images && booking.hotel.images.length > 0 ? booking.hotel.images[0] : null),
        date: booking.checkInDate || booking.checkIn,
      };
    } else if (booking.bookingType === 'flight' && booking.flight) {
      return {
        title: `${booking.flight.flightNumber || 'Chuyến bay'} - ${booking.flight.airline || ''}`,
        subtitle: `${booking.flight.origin || booking.flight.departureCity || ''} → ${booking.flight.destination || booking.flight.arrivalCity || ''}`,
        description: `${formatDate(booking.flight.departureTime || booking.flight.departureDate || booking.createdAt)}`,
        image: null, // Thường không có ảnh cho flight
        date: booking.flight.departureTime || booking.flight.departureDate || booking.createdAt,
      };
    } else {
      // Fallback nếu không phù hợp với các loại đã biết, hiển thị thông tin chung
      return {
        title: booking.tour?.name || booking.hotel?.name || booking.flight?.flightNumber || 'Đặt chỗ #' + (booking.bookingReference || booking._id?.substring(0, 8)),
        subtitle: booking.tour ? 'Tour du lịch' : booking.hotel ? 'Đặt phòng khách sạn' : booking.flight ? 'Vé máy bay' : 'Đặt chỗ',
        description: booking.participants ? `${booking.participants} người` : booking.guests ? `${booking.guests} khách` : booking.passengers ? `${booking.passengers} hành khách` : '1 người',
        image: booking.tour?.images?.[0] || booking.hotel?.images?.[0] || null,
        date: booking.startDate || booking.checkIn || booking.departureTime || booking.createdAt,
      };
    }
  };

  // Hiển thị thành phần chính
  return (
    <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Đặt chỗ của tôi</h1>
            <p className="text-gray-600">Quản lý tất cả các đặt chỗ tour, khách sạn và vé máy bay của bạn</p>
          </div>
          
          {/* Tab Navigation & Search */}
          <div className="bg-white rounded-lg shadow-soft mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4">
              <div className="flex mb-4 md:mb-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'upcoming'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Sắp tới
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'completed'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Đã hoàn thành
                </button>
                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === 'cancelled'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Đã hủy
                </button>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm đặt chỗ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center text-gray-600 hover:text-primary-600"
                >
                  <FiFilter className="mr-2" />
                  <span>Bộ lọc</span>
                  {filteredBookings.length !== bookings.length && (
                    <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                      {filteredBookings.length}
                    </span>
                  )}
                </button>
                
                {/* Các bộ lọc nhanh */}
                <div className="flex items-center space-x-2">
                  {/* Phím tắt lọc theo trạng thái */}
                  <button
                    onClick={() => {
                      setActiveTab('upcoming');
                      setFilters(prev => ({ ...prev, status: 'all' }));
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activeTab === 'upcoming' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ⏳ Sắp tới
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setFilters(prev => ({ ...prev, type: 'tour' }));
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filters.type === 'tour' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🗺️ Tours
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setFilters(prev => ({ ...prev, type: 'hotel' }));
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filters.type === 'hotel' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🏨 Hotels
                  </button>
                </div>
              </div>
              
              {filterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 mt-4"
                >
                  {/* Hàng đầu - Bộ lọc chính */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại đặt chỗ</label>
                      <select
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">Tất cả loại</option>
                        <option value="tour">🗺️ Tour du lịch</option>
                        <option value="hotel">🏨 Khách sạn</option>
                        <option value="flight">✈️ Vé máy bay</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">⏳ Chờ xác nhận</option>
                        <option value="confirmed">✅ Đã xác nhận</option>
                        <option value="completed">🎉 Hoàn thành</option>
                        <option value="cancelled">❌ Đã hủy</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đặt</label>
                      <select
                        name="dateRange"
                        value={filters.dateRange}
                        onChange={handleFilterChange}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="thisWeek">Tuần này</option>
                        <option value="thisMonth">Tháng này</option>
                        <option value="lastMonth">Tháng trước</option>
                        <option value="last3Months">3 tháng gần đây</option>
                        <option value="last6Months">6 tháng gần đây</option>
                        <option value="thisYear">Năm nay</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng giá</label>
                      <select
                        name="priceRange"
                        value={filters.priceRange}
                        onChange={handleFilterChange}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">Tất cả giá</option>
                        <option value="under1M">💰 Dưới 1 triệu</option>
                        <option value="1M-3M">💰💰 1-3 triệu</option>
                        <option value="3M-5M">💰💰💰 3-5 triệu</option>
                        <option value="5M-10M">💎 5-10 triệu</option>
                        <option value="over10M">💎💎 Trên 10 triệu</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Hàng thứ hai - Sắp xếp và thao tác */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
                      <select
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="newest">🕐 Mới nhất</option>
                        <option value="oldest">🕕 Cũ nhất</option>
                        <option value="priceHighToLow">💸 Giá: Cao → Thấp</option>
                        <option value="priceLowToHigh">💵 Giá: Thấp → Cao</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setFilters({
                            type: 'all',
                            status: 'all',
                            dateRange: 'all',
                            priceRange: 'all',
                            sortBy: 'newest'
                          });
                          setSearchTerm('');
                        }}
                        className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        🔄 Đặt lại bộ lọc
                      </button>
                    </div>
                    
                    <div className="flex items-end">
                      <div className="w-full text-sm text-gray-600 p-2 bg-blue-50 rounded-md">
                        📊 Hiển thị: <span className="font-semibold text-primary-600">{filteredBookings.length}</span> / {bookings.length} đặt chỗ
                        {(filters.type !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.priceRange !== 'all' || searchTerm) && (
                          <div className="mt-1 text-xs">
                            🔍 Đang áp dụng bộ lọc
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Bookings List */}
          <div className="bg-white rounded-lg shadow-soft overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <FiAlertTriangle className="mx-auto text-red-500 text-3xl mb-2" />
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={fetchAllBookings} 
                  className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <FiRefreshCw className="mr-2" /> Thử lại
                </button>
              </div>
            ) : sortedBookings.length === 0 ? (
              <div className="p-12 text-center">
                <FiCreditCard className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-xl font-semibold mb-2">Không có đặt chỗ nào</h3>
                <p className="text-gray-500 mb-6">Bạn chưa có đặt chỗ nào hoặc không tìm thấy kết quả phù hợp với bộ lọc hiện tại.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/tours" className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <FiMap className="mr-2" /> Khám phá Tours
                  </Link>
                  <Link to="/hotels" className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <FiHome className="mr-2" /> Tìm khách sạn
                  </Link>
                  <Link to="/flights" className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <FiMapPin className="mr-2" /> Tìm chuyến bay
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedBookings.map((booking) => {
                  const bookingDetails = getBookingDetails(booking);
                  const statusInfo = getStatusInfo(booking.status);
                  
                  return (
                    <div key={booking._id} className="p-4 sm:p-6 hover:bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center">
                        <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                          {bookingDetails.image ? (
                            <img 
                              src={bookingDetails.image} 
                              alt={bookingDetails.title}
                              className="w-full md:w-32 h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Dawin';
                              }}
                            />
                          ) : (
                            <div className="w-full md:w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              {getBookingTypeIcon(booking.bookingType)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                            <div>
                              <div className="flex items-center">
                                {getBookingTypeIcon(booking.bookingType)}
                                <h3 className="text-lg font-semibold">{bookingDetails.title}</h3>
                              </div>
                              <p className="text-gray-600">{bookingDetails.subtitle}</p>
                            </div>
                            
                            <div className="mt-2 md:mt-0 md:text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                              <p className="mt-1 font-medium text-gray-900">{formatCurrency(booking.totalPrice)}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-500 mt-2 gap-2 sm:gap-4">
                            <div className="flex items-center">
                              <FiCalendar className="mr-1 flex-shrink-0" />
                              <span>{formatDate(bookingDetails.date)}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <FiUsers className="mr-1 flex-shrink-0" />
                              <span>{bookingDetails.description}</span>
                            </div>
                            
                            <div>
                              <span className="text-gray-400">Mã: </span>
                              {booking.bookingReference || booking._id.substring(0, 8)}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              to={`/bookings/${booking._id}?type=${booking.bookingType}`}
                              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Chi tiết
                            </Link>
                            
                            {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'chờ xác nhận' || booking.status === 'đã xác nhận') && (
                              <button
                                onClick={() => handleCancelBooking(booking._id, booking.bookingType)}
                                className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                              >
                                Hủy đặt chỗ
                              </button>
                            )}
                            
                            {booking.status === 'completed' && (
                              <Link
                                to={`/reviews/create?type=${booking.bookingType}&id=${booking.bookingType === 'tour' ? booking.tourId : booking.bookingType === 'hotel' ? booking.hotelId : ''}`}
                                className="inline-flex items-center px-3 py-1.5 text-sm border border-yellow-300 text-yellow-600 rounded-md hover:bg-yellow-50"
                              >
                                Đánh giá
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage; 