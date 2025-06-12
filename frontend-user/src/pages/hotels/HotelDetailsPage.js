import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiUsers, FiStar, FiWifi, FiCoffee, FiHome, FiArrowLeft, FiHeart, FiCheck, FiX } from 'react-icons/fi';
import { hotelService } from '../../services/hotelService';
import { useAuth } from '../../hooks/useAuth';

const HotelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Load dữ liệu khách sạn
  useEffect(() => {
    const fetchHotelDetails = async () => {
      setLoading(true);
      try {
        // Kiểm tra ID hợp lệ
        if (!id || id === 'undefined') {
          setError('ID khách sạn không hợp lệ');
          setLoading(false);
          return;
        }

        console.log(`Đang tải thông tin khách sạn ID: ${id}`);
        const response = await hotelService.getHotelById(id);
        
        // Kiểm tra cấu trúc dữ liệu trả về
        if (response?.success && response.data) {
          console.log('Đã nhận dữ liệu khách sạn:', response.data.name);
          setHotel(response.data);
          
          // Mặc định chọn ngày nhận và trả phòng
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          
          setCheckIn(formatDateForInput(tomorrow));
          setCheckOut(formatDateForInput(dayAfterTomorrow));
          
          // Nếu có roomTypes, chọn mặc định phòng đầu tiên có sẵn
          if (response.data.roomTypes && response.data.roomTypes.length > 0) {
            const availableRoom = response.data.roomTypes.find(room => room.available > 0);
            if (availableRoom) {
              setSelectedRoom(availableRoom);
            }
          }
        } else {
          // Hiển thị thông báo lỗi từ API nếu có
          const errorMessage = response?.message || 'Không thể tải thông tin khách sạn. Dữ liệu không hợp lệ.';
          console.error('API trả về lỗi:', errorMessage);
          setError(errorMessage);
        }
      } catch (error) {
        console.error('Error fetching hotel details:', error);
        // Hiển thị thông báo lỗi chi tiết từ response
        const errorMessage = error.response?.data?.message || 'Không thể tải thông tin khách sạn. Vui lòng thử lại sau.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotelDetails();
  }, [id]);
  
  // Format ngày tháng cho input date
  const formatDateForInput = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  };
  
  // Tính số ngày lưu trú
  const calculateDays = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };
  
  // Kiểm tra hình ảnh hợp lệ
  const getValidImage = () => {
    // Kiểm tra hình ảnh của khách sạn
    if (hotel.coverImage && typeof hotel.coverImage === 'string' && hotel.coverImage.startsWith('http')) {
      console.log("Sử dụng coverImage:", hotel.coverImage);
      return hotel.coverImage;
    }
    
    // Kiểm tra gallery
    if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
      for (const img of hotel.images) {
        if (img && typeof img === 'string' && img.startsWith('http')) {
          console.log("Sử dụng gallery image:", img);
          return img;
        }
      }
    }
    
    console.log("Không tìm thấy hình ảnh hợp lệ, sử dụng ảnh mặc định");
    return '/images/hero-bg.jpg';
  };
  
  // Xử lý đặt phòng
  const handleBooking = () => {
    if (!isAuthenticated) {
      // Redirect tới trang đăng nhập nếu chưa đăng nhập
      navigate('/login', { state: { from: `/hotels/${id}` } });
      return;
    }
    
    if (!selectedRoom) {
      alert('Vui lòng chọn loại phòng');
      return;
    }
    
    // Tính số ngày lưu trú
    const daysStay = calculateDays();
    
    // Kiểm tra và lấy giá phòng đúng
    const roomPrice = selectedRoom.price || hotel.pricePerNight || 0;
    
    // Tính tổng giá
    const totalPrice = roomPrice * rooms * daysStay;
    
    console.log("Thông tin đặt phòng:", {
      hotelId: hotel._id,
      roomType: selectedRoom._id || selectedRoom.id,
      roomPrice: roomPrice,
      days: daysStay,
      rooms: rooms,
      guests: guests,
      totalPrice: totalPrice
    });
    
    // Chuyển hướng tới trang thanh toán với thông tin đã chọn
    navigate('/checkout', {
      state: {
        type: 'hotel',
        item: {
          id: hotel._id,
          name: hotel.name,
          price: roomPrice,
          image: getValidImage(),
          checkIn,
          checkOut,
          roomType: selectedRoom.name,
          rooms,
          guests,
          days: daysStay
        },
        bookingData: {
          hotelId: hotel._id,
          roomType: selectedRoom._id || selectedRoom.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numOfRooms: rooms,
          guests: {
            adults: guests,
            children: 0
          },
          contactInfo: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || ''
          },
          specialRequests: '',
          totalPrice: totalPrice
        }
      }
    });
  };
  
  // Xử lý thêm vào yêu thích
  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/hotels/${id}` } });
      return;
    }
    
    setIsLiked(!isLiked);
    // Triển khai API lưu/xóa khách sạn yêu thích sau
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-soft p-8 animate-pulse">
            <div className="h-80 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 mb-6"></div>
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
            <div className="flex flex-col items-center">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/hotels" className="btn btn-primary">
                  Xem tất cả khách sạn
                </Link>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-outline-secondary"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) return null;

  const days = calculateDays();

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: `url(${hotel.coverImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="container relative h-full flex items-end">
          <div className="pb-10 text-white">
            <Link to="/hotels" className="inline-flex items-center text-white mb-4 hover:underline">
              <FiArrowLeft className="mr-2" /> Quay lại danh sách khách sạn
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FiMapPin className="mr-1" />
                <span>{hotel.address || hotel.city}</span>
              </div>
              <div className="flex items-center">
                <FiStar className="text-yellow-400 mr-1" />
                <span>{hotel.stars} sao</span>
                <span className="ml-1">({hotel.ratingsQuantity || 0} đánh giá)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Gallery */}
          {hotel.images && hotel.images.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-4 md:col-span-2 h-80 overflow-hidden rounded-lg">
                  <img 
                    src={activeImage < hotel.images.length ? hotel.images[activeImage] : hotel.coverImage} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-4 md:col-span-2 grid grid-cols-2 gap-2">
                  {hotel.images.slice(0, 4).map((image, index) => (
                    <div 
                      key={index} 
                      className={`h-40 overflow-hidden rounded-lg cursor-pointer ${index === activeImage ? 'ring-2 ring-primary-500' : ''}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${hotel.name} ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hotel Details */}
              <div className="md:col-span-2 p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Tổng quan</h2>
                  <button 
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <FiHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">{hotel.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiHome className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Loại phòng</div>
                    <div className="font-semibold">{hotel.roomTypes ? hotel.roomTypes.length : 0} loại</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiStar className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Hạng</div>
                    <div className="font-semibold">{hotel.stars} sao</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiMapPin className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Vị trí</div>
                    <div className="font-semibold">{hotel.city}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiCoffee className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Danh mục</div>
                    <div className="font-semibold">{hotel.category}</div>
                  </div>
                </div>
                
                {/* Tiện nghi */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Tiện nghi</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {hotel.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center">
                          <FiCheck className="text-primary-500 mr-2" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Chính sách */}
                {hotel.policies && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Chính sách</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <div className="w-40 font-medium">Nhận phòng:</div>
                        <div>{hotel.policies.checkIn}</div>
                      </div>
                      <div className="flex">
                        <div className="w-40 font-medium">Trả phòng:</div>
                        <div>{hotel.policies.checkOut}</div>
                      </div>
                      <div className="flex">
                        <div className="w-40 font-medium">Hủy phòng:</div>
                        <div>{hotel.policies.cancellation}</div>
                      </div>
                      {hotel.policies.additionalRules && hotel.policies.additionalRules.length > 0 && (
                        <div>
                          <div className="font-medium mb-2">Quy định khác:</div>
                          <ul className="list-disc pl-5">
                            {hotel.policies.additionalRules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tiện nghi khách sạn */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Tiện nghi khách sạn</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {hotel.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <FiCheck className="text-primary-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Địa điểm lân cận */}
                {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Địa điểm lân cận</h3>
                    <div className="space-y-4">
                      {hotel.nearbyAttractions.map((attraction, index) => (
                        <div key={index} className="flex">
                          {attraction.image && (
                            <div className="w-20 h-20 mr-3 rounded-lg overflow-hidden">
                              <img src={attraction.image} alt={attraction.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold">{attraction.name}</h4>
                            {attraction.description && <p className="text-sm text-gray-600">{attraction.description}</p>}
                            {attraction.distance && <p className="text-sm text-primary-500">Cách {attraction.distance}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Loại phòng */}
                {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Loại phòng</h3>
                    <div className="space-y-4">
                      {hotel.roomTypes.map((room) => (
                        <div 
                          key={room._id} 
                          className={`border rounded-lg p-4 ${selectedRoom?._id === room._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} ${room.available <= 0 ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold">{room.name}</h4>
                            <div className="text-primary-600 font-semibold">{formatCurrency(room.price)} / đêm</div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">{room.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center text-sm">
                              <FiUsers className="text-primary-500 mr-1" />
                              <span>Tối đa {room.capacity} người</span>
                            </div>
                            
                            {room.amenities && room.amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <FiCheck className="text-primary-500 mr-1" />
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                          
                          {room.available > 0 ? (
                            <button
                              onClick={() => setSelectedRoom(room)}
                              className={`w-full py-2 rounded-md ${selectedRoom?._id === room._id ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                            >
                              {selectedRoom?._id === room._id ? 'Đã chọn' : 'Chọn phòng'}
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-gray-100 rounded-md text-gray-500">
                              Hết phòng
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Đánh giá */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Đánh giá</h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`${i < Math.round(hotel.ratingsAverage) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{hotel.ratingsAverage}/5</span>
                      <span className="text-gray-500 ml-2">({hotel.ratingsQuantity} đánh giá)</span>
                    </div>
                  </div>
                  
                  {hotel.ratingsQuantity > 0 ? (
                    <div className="bg-primary-50 p-4 rounded-lg text-center">
                      <p className="text-primary-600">Xem tất cả đánh giá</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có đánh giá nào cho khách sạn này.</p>
                  )}
                </div>
              </div>
              
              {/* Booking Form */}
              <div className="bg-gray-50 p-6 md:border-l border-gray-200">
                <div className="sticky top-24">
                  <h3 className="text-xl font-bold mb-4">Đặt phòng</h3>
                  
                  <div className="mb-6">
                    <div className="text-gray-600 mb-1">Giá mỗi đêm từ</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(selectedRoom ? selectedRoom.price : hotel.pricePerNight)}
                    </div>
                    {selectedRoom && selectedRoom.priceDiscount > 0 && (
                      <div className="text-sm text-red-500">
                        Giảm {formatCurrency(selectedRoom.priceDiscount)} ({Math.round((selectedRoom.priceDiscount / selectedRoom.price) * 100)}%)
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày nhận phòng
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="checkIn"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={formatDateForInput(new Date())}
                          className="input pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày trả phòng
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="checkOut"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn}
                          className="input pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">
                          Số phòng
                        </label>
                        <select
                          id="rooms"
                          value={rooms}
                          onChange={(e) => setRooms(Number(e.target.value))}
                          className="input"
                        >
                          {[...Array(5)].map((_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1} phòng
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                          Số khách
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiUsers className="text-gray-400" />
                          </div>
                          <select
                            id="guests"
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                            className="input pl-10"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i} value={i + 1}>
                                {i + 1} người
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between py-2 border-b">
                      <span>{selectedRoom ? selectedRoom.name : 'Phòng tiêu chuẩn'}</span>
                      <span>
                        {formatCurrency(selectedRoom ? 
                          (selectedRoom.price - (selectedRoom.priceDiscount || 0)) : 
                          (hotel.pricePerNight - (hotel.priceDiscount || 0)))} x {days} đêm x {rooms}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Thuế và phí dịch vụ</span>
                      <span>
                        {formatCurrency(((selectedRoom ? 
                          (selectedRoom.price - (selectedRoom.priceDiscount || 0)) : 
                          (hotel.pricePerNight - (hotel.priceDiscount || 0))) * days * rooms) * 0.1)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 font-bold">
                      <span>Tổng tiền</span>
                      <span className="text-primary-600">
                        {formatCurrency(((selectedRoom ? 
                          (selectedRoom.price - (selectedRoom.priceDiscount || 0)) : 
                          (hotel.pricePerNight - (hotel.priceDiscount || 0))) * days * rooms) * 1.1)}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleBooking}
                    className="btn btn-primary w-full py-3"
                    disabled={!checkIn || !checkOut || !selectedRoom}
                  >
                    Đặt ngay
                  </button>
                  
                  <div className="mt-4 text-center text-sm text-gray-500">
                    <FiCheck className="inline mr-1" />
                    Bạn chỉ phải thanh toán 20% trước
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage; 