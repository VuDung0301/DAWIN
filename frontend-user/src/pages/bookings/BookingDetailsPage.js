import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiClock, FiUsers, FiCheckCircle, FiXCircle, FiArrowLeft, FiDownload, FiStar, FiArrowRight } from 'react-icons/fi';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load dữ liệu booking
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/bookings/${id}` } });
      return;
    }
    
    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        // Lấy loại booking từ state hoặc kiểm tra URL
        const params = new URLSearchParams(window.location.search);
        let bookingType = location.state?.bookingType;
        
        // Nếu không có trong state, thử lấy từ URL query params
        if (!bookingType) {
          bookingType = params.get('type');
        }
        
        console.log('Đang lấy chi tiết booking với loại:', bookingType, 'và ID:', id);
        
        let response;
        // Gọi API riêng biệt dựa vào loại booking
        if (bookingType === 'tour') {
          response = await bookingService.tourBookings.getById(id);
        } else if (bookingType === 'hotel') {
          response = await bookingService.hotelBookings.getById(id);
        } else if (bookingType === 'flight') {
          response = await bookingService.flightBookings.getById(id);
        } else {
          // Fallback nếu không có loại cụ thể
          response = await bookingService.getBookingById(id, bookingType);
        }
        
        console.log('Kết quả API:', response);
        
        if (response.success && response.data) {
          // Trường hợp API trả về cấu trúc {success: true, data: {...}}
          setBooking({
            ...response.data, 
            type: bookingType || determineBookingType(response.data)
          });
        } else if (response.data) {
          // Trường hợp API chỉ trả về data trực tiếp
          setBooking({
            ...response.data, 
            type: bookingType || determineBookingType(response.data)
          });
        } else if (response._id || response.id) {
          // Trường hợp API trả về dữ liệu trực tiếp không có wrapper
          setBooking({
            ...response, 
            type: bookingType || determineBookingType(response)
          });
        } else {
          setError('Không tìm thấy thông tin đặt chỗ');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError('Không thể tải thông tin đặt chỗ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [id, isAuthenticated, navigate, location]);
  
  // Hàm xác định loại booking dựa vào dữ liệu
  const determineBookingType = (data) => {
    if (data.tour) return 'tour';
    if (data.hotel) return 'hotel';
    if (data.flight) return 'flight';
    return '';
  };
  
  // Xử lý hủy booking
  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ này không?')) return;
    
    try {
      setLoading(true);
      let response;
      
      // Sử dụng API thích hợp cho từng loại booking
      if (booking.type === 'tour') {
        response = await bookingService.tourBookings.cancel(id, 'Hủy bởi người dùng');
      } else if (booking.type === 'hotel') {
        response = await bookingService.hotelBookings.cancel(id, 'Hủy bởi người dùng');
      } else if (booking.type === 'flight') {
        response = await bookingService.flightBookings.cancel(id, 'Hủy bởi người dùng');
      }
      
      console.log('Kết quả hủy đặt chỗ:', response);
      
      if (response && response.success) {
        // Cập nhật trạng thái
        setBooking(prev => ({ ...prev, status: 'cancelled' }));
        alert('Đã hủy đặt chỗ thành công!');
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
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Format thời gian
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('vi-VN', options);
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Lấy màu và nhãn cho trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="mr-1" />, label: 'Chờ xác nhận' };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', icon: <FiCheckCircle className="mr-1" />, label: 'Đã xác nhận' };
      case 'confirmed':
        return { color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="mr-1" />, label: 'Hoàn thành' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: <FiXCircle className="mr-1" />, label: 'Đã hủy' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <FiClock className="mr-1" />, label: 'Đang xử lý' };
    }
  };
  
  // Giả lập dữ liệu booking
  useEffect(() => {
    if (!loading && !booking && !error) {
      // Tạo dữ liệu giả lập nếu API không hoạt động
      setTimeout(() => {
        const mockBooking = {
          _id: id,
          user: {
            _id: 'user123',
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            phone: '0987654321'
          },
          type: 'tour', // hoặc 'hotel', 'flight'
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          paymentStatus: 'paid',
          totalPrice: 2500000,
          // Thông tin tour
          tour: {
            _id: 'tour123',
            name: 'Tour du lịch Đà Nẵng - Hội An - Huế 5 ngày 4 đêm',
            startLocation: { description: 'Hà Nội' },
            startDate: '2023-08-15T00:00:00',
            duration: 5,
            coverImage: 'https://images.unsplash.com/photo-1560613557-c6bfde64f4dd?q=80&w=2070'
          },
          participants: 2,
          specialRequests: 'Yêu cầu phòng view biển nếu có thể.',
          // Hoặc thông tin khách sạn
          hotel: null,
          checkIn: null,
          checkOut: null,
          roomType: null,
          guests: null,
          // Hoặc thông tin chuyến bay
          flight: null,
          passengers: null,
          class: null
        };
        
        setBooking(mockBooking);
      }, 1000);
    }
  }, [id, loading, booking, error]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-soft p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-60 bg-gray-200 rounded mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
              </div>
              <div>
                <div className="h-64 bg-gray-200 rounded mb-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-soft p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/bookings" className="btn btn-primary">
              Quay lại danh sách đặt chỗ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  // Xác định loại booking và nội dung chi tiết
  let bookingTitle, bookingLocation, bookingDate, bookingImage, bookingDetailContent;
  
  if (booking.tour) {
    bookingTitle = booking.tour.name;
    bookingLocation = booking.tour.startLocation?.description || '';
    
    // Ưu tiên sử dụng startDate từ booking, rồi mới đến tour.startDate
    bookingDate = booking.startDate || booking.tour.startDate || booking.date || booking.createdAt;
    
    // Lấy hình ảnh đầu tiên từ mảng images nếu có
    bookingImage = booking.tour.images && booking.tour.images.length > 0 
      ? booking.tour.images[0] 
      : booking.tour.imageCover || booking.tour.coverImage;
    
    bookingDetailContent = (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Thông tin tour</h3>
          <div className="mt-2 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Điểm khởi hành</p>
                <p className="font-medium">{bookingLocation || 'Không có thông tin'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày khởi hành</p>
                <p className="font-medium">{formatDate(bookingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thời gian</p>
                <p className="font-medium">{booking.tour.duration || 1} ngày</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số người</p>
                <p className="font-medium">{booking.participants} người</p>
              </div>
            </div>
          </div>
        </div>
        
        {booking.specialRequests && (
          <div>
            <h3 className="font-medium text-gray-700">Yêu cầu đặc biệt</h3>
            <p className="mt-2 text-gray-600 bg-gray-50 p-4 rounded-lg">{booking.specialRequests}</p>
          </div>
        )}
      </div>
    );
  } else if (booking.hotel) {
    bookingTitle = booking.hotel.name;
    bookingLocation = booking.hotel.city || '';
    bookingDate = `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`;
    bookingImage = booking.hotel.coverImage;
    
    bookingDetailContent = (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Thông tin đặt phòng</h3>
          <div className="mt-2 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Địa điểm</p>
                <p className="font-medium">{bookingLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loại phòng</p>
                <p className="font-medium">{booking.roomType || 'Standard'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nhận phòng</p>
                <p className="font-medium">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trả phòng</p>
                <p className="font-medium">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số phòng</p>
                <p className="font-medium">{booking.rooms || 1} phòng</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số khách</p>
                <p className="font-medium">
                  {typeof booking.guests === 'object' ? 
                    (booking.guests.adults || 0) + (booking.guests.children || 0) :
                    booking.guests || 1} người
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {booking.specialRequests && (
          <div>
            <h3 className="font-medium text-gray-700">Yêu cầu đặc biệt</h3>
            <p className="mt-2 text-gray-600 bg-gray-50 p-4 rounded-lg">{booking.specialRequests}</p>
          </div>
        )}
      </div>
    );
  } else if (booking.flight) {
    bookingTitle = `${booking.flight.airline} - ${booking.flight.flightNumber}`;
    bookingLocation = `${booking.flight.departureCity} đến ${booking.flight.arrivalCity}`;
    bookingDate = formatDate(booking.flight.departureTime);
    bookingImage = 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?q=80&w=2070';
    
    bookingDetailContent = (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Thông tin chuyến bay</h3>
          <div className="mt-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-3">
                  {booking.flight.airlineCode || booking.flight.airline?.substr(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{booking.flight.airline}</div>
                  <div className="text-sm text-gray-500">{booking.flight.flightNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {booking.flight.aircraft || 'Airbus A350'}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.flight.class === 'economy' ? 'Phổ thông' : booking.flight.class === 'premium' ? 'Phổ thông đặc biệt' : 'Thương gia'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(booking.flight.departureTime)}</div>
                <div className="text-sm text-gray-500">{formatDate(booking.flight.departureTime)}</div>
                <div className="font-medium mt-1">{booking.flight.departureCity}</div>
                <div className="text-sm text-gray-500">Terminal {booking.flight.departureTerminal || 'T1'}</div>
              </div>
              
              <div className="flex-1 px-8 relative">
                <div className="border-t border-dashed border-gray-300 w-full absolute top-1/2 left-0"></div>
                <div className="text-center relative">
                  <span className="bg-gray-50 px-2 text-sm text-gray-500">{booking.flight.duration || '2h 15m'}</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold">{formatTime(booking.flight.arrivalTime)}</div>
                <div className="text-sm text-gray-500">{formatDate(booking.flight.arrivalTime)}</div>
                <div className="font-medium mt-1">{booking.flight.arrivalCity}</div>
                <div className="text-sm text-gray-500">Terminal {booking.flight.arrivalTerminal || 'T1'}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Số hành khách</p>
                <p className="font-medium">
                  {typeof booking.passengers === 'object' ? 
                    (booking.passengers.adults || 0) + (booking.passengers.children || 0) :
                    typeof booking.passengers === 'number' ? booking.passengers : 1} người
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hạng vé</p>
                <p className="font-medium">
                  {booking.class === 'economy' ? 'Phổ thông' : booking.class === 'premium' ? 'Phổ thông đặc biệt' : 'Thương gia'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {booking.specialRequests && (
          <div>
            <h3 className="font-medium text-gray-700">Yêu cầu đặc biệt</h3>
            <p className="mt-2 text-gray-600 bg-gray-50 p-4 rounded-lg">{booking.specialRequests}</p>
          </div>
        )}
      </div>
    );
  } else {
    // Fallback nếu không xác định được loại booking
    bookingTitle = `Đặt chỗ #${booking._id.substr(-8).toUpperCase()}`;
    bookingLocation = 'Không xác định';
    bookingDate = formatDate(booking.createdAt);
    bookingImage = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070';
    
    bookingDetailContent = (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        Không tìm thấy thông tin chi tiết cho đặt chỗ này.
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(booking.status);

  return (
    <div className="pt-24 pb-16 bg-gray-50 min-h-screen">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <Link to="/bookings" className="inline-flex items-center text-primary-600 mb-4 hover:underline">
            <FiArrowLeft className="mr-2" /> Quay lại danh sách đặt chỗ
          </Link>
          
          <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{bookingTitle}</h1>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">Mã đặt chỗ: {booking._id.substr(-8).toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="mt-2 md:mt-0">
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(booking.totalPrice || 0)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({booking.paymentStatus === 'paid' || booking.isPaid === true ? 'Đã thanh toán' : 
                      booking.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 
                      booking.paymentStatus === 'failed' ? 'Thanh toán thất bại' : 
                      'Đã thanh toán'})
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={bookingImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070'} 
                    alt={bookingTitle}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex flex-col justify-center">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FiMapPin className="text-gray-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Địa điểm</p>
                        <p className="font-medium">{bookingLocation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FiCalendar className="text-gray-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Ngày</p>
                        <p className="font-medium">{bookingDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FiUsers className="text-gray-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Số người</p>
                        <p className="font-medium">
                          {typeof booking.participants === 'number' ? booking.participants :
                           typeof booking.guests === 'object' ? 
                             (booking.guests.adults || 0) + (booking.guests.children || 0) :
                           typeof booking.guests === 'number' ? booking.guests :
                           typeof booking.passengers === 'number' ? booking.passengers : 1} người
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Chi tiết đặt chỗ dựa vào loại */}
              {bookingDetailContent}
              
              {/* Thông tin khách hàng */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-3">Thông tin liên hệ</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Họ tên</p>
                      <p className="font-medium">{booking.user?.name || 'Không có thông tin'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{booking.user?.email || 'Không có thông tin'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium">{booking.user?.phone || 'Không có thông tin'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày đặt</p>
                      <p className="font-medium">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chi tiết thanh toán */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-3">Chi tiết thanh toán</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tổng tiền</span>
                      <span>{formatCurrency(booking.payment?.amount || booking.totalPrice || booking.price || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Trạng thái thanh toán</span>
                      <span className={
                        (booking.paymentStatus === 'paid' || booking.isPaid === true || booking.payment?.status === 'confirmed') ? 'text-green-600' : 
                        (booking.paymentStatus === 'refunded' || booking.payment?.status === 'refunded') ? 'text-blue-600' : 
                        (booking.paymentStatus === 'failed' || booking.payment?.status === 'failed') ? 'text-red-600' : 
                        'text-yellow-600'
                      }>
                        {(booking.paymentStatus === 'paid' || booking.isPaid === true || booking.payment?.status === 'confirmed') ? 'Đã thanh toán' : 
                         (booking.paymentStatus === 'refunded' || booking.payment?.status === 'refunded') ? 'Đã hoàn tiền' : 
                         (booking.paymentStatus === 'failed' || booking.payment?.status === 'failed') ? 'Thanh toán thất bại' : 
                         'Đã thanh toán'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Phương thức thanh toán</span>
                      <span className="capitalize">{booking.payment?.paymentMethod || booking.paymentMethod || 'Chuyển khoản ngân hàng'}</span>
                    </div>
                    {booking.payment?.sePayInfo && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Mã giao dịch</span>
                        <span className="font-mono text-sm">{booking.payment.sePayInfo.transactionId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(booking.payment?.amount || booking.totalPrice || booking.price || 0)}</span>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                {booking.status !== 'cancelled' && (
                  <>
                    {booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'refunded' && !booking.isPaid && (
                      <Link
                        to={`/payment/${booking._id}`}
                        className="btn btn-primary"
                        state={{ bookingType: booking.type }}
                      >
                        Thanh toán
                      </Link>
                    )}
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={handleCancelBooking}
                        className="btn btn-outline border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Hủy đặt chỗ
                      </button>
                    )}
                  </>
                )}
                
                <button className="btn btn-outline">
                  <FiDownload className="mr-2" /> Tải vé/phiếu xác nhận
                </button>
                
                {booking.status === 'confirmed' && (
                  <Link
                    to={`/review/${booking.type}/${booking[booking.type]?._id}`}
                    className="btn btn-outline border-primary-500 text-primary-600 hover:bg-primary-50"
                  >
                    <FiStar className="mr-2" /> Viết đánh giá
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Chính sách */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Chính sách</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Chính sách hủy</h3>
                  <p className="mt-2 text-gray-600">
                    Miễn phí hủy trước 7 ngày so với ngày khởi hành/nhận phòng. Phí hủy 50% từ 3-7 ngày. Phí hủy 100% trong vòng 3 ngày.
                  </p>
                </div>
                
                {booking.type === 'tour' && (
                  <div>
                    <h3 className="font-medium text-gray-700">Lưu ý quan trọng</h3>
                    <p className="mt-2 text-gray-600">
                      Quý khách vui lòng mang theo giấy tờ tùy thân (CMND/CCCD/Hộ chiếu) khi tham gia tour. Trẻ em dưới 10 tuổi cần có người lớn đi kèm.
                    </p>
                  </div>
                )}
                
                {booking.type === 'hotel' && (
                  <div>
                    <h3 className="font-medium text-gray-700">Giờ nhận/trả phòng</h3>
                    <p className="mt-2 text-gray-600">
                      Giờ nhận phòng: sau 14:00. Giờ trả phòng: trước 12:00. Vui lòng liên hệ trước nếu cần nhận phòng sớm hoặc trả phòng muộn.
                    </p>
                  </div>
                )}
                
                {booking.type === 'flight' && (
                  <div>
                    <h3 className="font-medium text-gray-700">Quy định hành lý</h3>
                    <p className="mt-2 text-gray-600">
                      Hành lý xách tay: 7kg/người. Hành lý ký gửi: 20-23kg/người tùy hạng vé. Vui lòng có mặt tại sân bay trước giờ khởi hành ít nhất 2 tiếng đối với chuyến bay quốc nội.
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-gray-700">Hỗ trợ khách hàng</h3>
                  <p className="mt-2 text-gray-600">
                    Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline 1900 1234 hoặc email support@dawin.com để được hỗ trợ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage; 