import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiClock, FiUsers, FiStar, FiDollarSign, FiShield, FiImage, FiArrowLeft, FiHeart, FiCheck, FiX, FiInfo, FiCoffee, FiBriefcase } from 'react-icons/fi';
import { tourService } from '../../services/tourService';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';

const TourDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  
  // Load dữ liệu tour
  useEffect(() => {
    const fetchTourDetails = async () => {
      setLoading(true);
      try {
        const response = await tourService.getTourById(id);
        setTour(response.data.data);
        // Mặc định chọn ngày đầu tiên trong lịch trình
        if (response.data.data.startDates && response.data.data.startDates.length > 0) {
          setSelectedDate(response.data.data.startDates[0]);
        }
      } catch (error) {
        console.error('Error fetching tour details:', error);
        setError('Không thể tải thông tin tour. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTourDetails();
  }, [id]);
  
  // Xử lý đặt tour
  const handleBooking = async () => {
    if (!isAuthenticated) {
      // Redirect tới trang đăng nhập nếu chưa đăng nhập
      navigate('/login', { state: { from: `/tours/${id}` } });
      return;
    }
    
    try {
      // Chuyển hướng tới trang thanh toán với thông tin đã chọn
      navigate('/checkout', {
        state: {
          type: 'tour',
          item: {
            id: tour._id,
            _id: tour._id,
            name: tour.name,
            price: tour.price,
            priceDiscount: tour.priceDiscount,
            image: tour.coverImage || (tour.images && tour.images.length > 0 ? tour.images[0] : ''),
            date: selectedDate,
            participants,
            duration: tour.duration,
            startLocation: tour.startLocation
          },
          bookingData: {
            tourId: tour._id,
            startDate: selectedDate,
            numOfPeople: participants,
            contactInfo: {
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              email: user?.email || '',
              phone: user?.phone || ''
            },
            specialRequests: '',
            totalPrice: (tour.priceDiscount || tour.price) * participants
          }
        }
      });
    } catch (error) {
      console.error('Lỗi khi chuẩn bị đặt tour:', error);
      alert('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    }
  };
  
  // Xử lý thêm vào yêu thích
  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/tours/${id}` } });
      return;
    }
    
    setIsLiked(!isLiked);
    // Triển khai API lưu/xóa tour yêu thích sau
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 đ';
    try {
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0 
      }).format(value);
    } catch (error) {
      console.error('Lỗi khi định dạng tiền tệ:', error);
      return `${value} đ`;
    }
  };
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    } catch (error) {
      console.error('Lỗi khi định dạng ngày tháng:', error);
      return dateString;
    }
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
            <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/tours" className="btn btn-primary">
              Quay lại danh sách tour
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) return null;

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: `url(${tour.coverImage || (tour.images && tour.images.length > 0 ? tour.images[0] : '')})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="container relative h-full flex items-end">
          <div className="pb-10 text-white">
            <Link to="/tours" className="inline-flex items-center text-white mb-4 hover:underline">
              <FiArrowLeft className="mr-2" /> Quay lại danh sách tour
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{tour.name}</h1>
            <div className="flex items-center space-x-4">
              {tour.startLocation && (
                <div className="flex items-center">
                  <FiMapPin className="mr-1" />
                  <span>{tour.startLocation.description}</span>
                </div>
              )}
              <div className="flex items-center">
                <FiStar className="text-yellow-400 mr-1" />
                <span>{tour.ratingsAverage || 0}</span>
                <span className="ml-1">({tour.ratingsQuantity || 0} đánh giá)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Gallery */}
          {tour.images && Array.isArray(tour.images) && tour.images.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-4 md:col-span-2 h-80 overflow-hidden rounded-lg">
                  <img 
                    src={tour.images[activeImage] || tour.coverImage} 
                    alt={tour.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-4 md:col-span-2 grid grid-cols-2 gap-2">
                  {tour.images.slice(0, 4).map((image, index) => (
                    <div 
                      key={index} 
                      className={`h-40 overflow-hidden rounded-lg cursor-pointer ${index === activeImage ? 'ring-2 ring-primary-500' : ''}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${tour.name} ${index + 1}`} 
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
              {/* Tour Details */}
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
                
                <p className="text-gray-600 mb-6">{tour.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiClock className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Thời gian</div>
                    <div className="font-semibold">{tour.duration || 0} ngày</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiUsers className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Số người</div>
                    <div className="font-semibold">Tối đa {tour.maxGroupSize || 0}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiMapPin className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Địa điểm</div>
                    <div className="font-semibold">
                      {tour.locations && tour.locations.length > 0 
                        ? `${tour.locations.length} điểm`
                        : tour.startLocation ? '1 điểm' : '0 điểm'
                      }
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <FiShield className="text-primary-500 text-xl mx-auto mb-2" />
                    <div className="text-sm text-gray-500">Độ khó</div>
                    <div className="font-semibold capitalize">{tour.difficulty || 'Bình thường'}</div>
                  </div>
                </div>
                
                {/* Lịch trình chi tiết */}
                {tour.itinerary && Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Lịch trình chi tiết</h3>
                    <div className="space-y-6">
                      {tour.itinerary.map((day, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          {day.image && (
                            <div className="w-full h-48 overflow-hidden">
                              <img 
                                src={day.image} 
                                alt={day.title} 
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-center mb-3">
                              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mr-3">
                                {day.day}
                              </div>
                              <h4 className="text-lg font-bold">{day.title}</h4>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{day.description}</p>
                            
                            {/* Hoạt động trong ngày */}
                            {day.activities && Array.isArray(day.activities) && day.activities.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-medium mb-2">Hoạt động:</h5>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {day.activities.map((activity, i) => (
                                    <li key={i} className="flex items-start">
                                      <FiCheck className="text-primary-500 mt-1 mr-2 flex-shrink-0" />
                                      <span>{activity}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Bữa ăn */}
                            {day.meals && (
                              <div className="mb-3">
                                <h5 className="font-medium mb-2">Bữa ăn:</h5>
                                <div className="flex flex-wrap gap-3">
                                  {day.meals.breakfast && (
                                    <span className="flex items-center text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                                      <FiCoffee className="mr-1" /> Sáng
                                    </span>
                                  )}
                                  {day.meals.lunch && (
                                    <span className="flex items-center text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                      <FiCoffee className="mr-1" /> Trưa
                                    </span>
                                  )}
                                  {day.meals.dinner && (
                                    <span className="flex items-center text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                      <FiCoffee className="mr-1" /> Tối
                                    </span>
                                  )}
                                  {!day.meals.breakfast && !day.meals.lunch && !day.meals.dinner && (
                                    <span className="text-sm text-gray-500">Không bao gồm bữa ăn</span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Nơi lưu trú */}
                            {day.accommodation && (
                              <div className="mb-3">
                                <h5 className="font-medium mb-2">Nơi lưu trú:</h5>
                                <div className="flex items-center">
                                  <FiBriefcase className="text-primary-500 mr-2" />
                                  <span>{day.accommodation}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Lịch trình chi tiết</h3>
                    <p className="text-gray-500">Thông tin lịch trình chi tiết đang được cập nhật. Vui lòng liên hệ với chúng tôi để biết thêm chi tiết.</p>
                  </div>
                )}
                
                {/* Điểm đến */}
                {tour.locations && Array.isArray(tour.locations) && tour.locations.length > 0 ? (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Điểm đến</h3>
                    <div className="space-y-4">
                      {tour.locations.map((location, index) => (
                        <div key={index} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            {index < tour.locations.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                            )}
                          </div>
                          <div className="pb-4">
                            <h4 className="font-bold">{location.description || 'Điểm đến'}</h4>
                            <p className="text-gray-600">{location.day ? `Ngày ${location.day}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : tour.startLocation ? (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Điểm đến</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FiMapPin className="text-primary-500 mr-2" />
                        <h4 className="font-bold">{tour.startLocation.description}</h4>
                      </div>
                      <p className="text-gray-600">{tour.startLocation.address}</p>
                    </div>
                  </div>
                ) : null}
                
                {/* Thông tin bao gồm và không bao gồm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Bao gồm */}
                  {tour.includes && Array.isArray(tour.includes) && tour.includes.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 flex items-center">
                        <FiCheck className="text-green-500 mr-2" />
                        Bao gồm
                      </h3>
                      <ul className="space-y-2">
                        {tour.includes.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Không bao gồm */}
                  {tour.excludes && Array.isArray(tour.excludes) && tour.excludes.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 flex items-center">
                        <FiX className="text-red-500 mr-2" />
                        Không bao gồm
                      </h3>
                      <ul className="space-y-2">
                        {tour.excludes.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <FiX className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Đánh giá */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Đánh giá</h3>
                  
                  {tour.reviews && Array.isArray(tour.reviews) && tour.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {tour.reviews.map((review) => (
                        <div key={review._id} className="border-b pb-4">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                              {review.user && review.user.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{review.user && review.user.name ? review.user.name : 'Người dùng ẩn danh'}</div>
                              <div className="text-sm text-gray-500">{new Date(review.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
                            </div>
                          </div>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar 
                                key={i} 
                                className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-gray-600">{review.review}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có đánh giá nào cho tour này.</p>
                  )}
                </div>
              </div>
              
              {/* Booking Form */}
              <div className="bg-gray-50 p-6 md:border-l border-gray-200">
                <div className="sticky top-24">
                  <h3 className="text-xl font-bold mb-4">Đặt Tour</h3>
                  
                  <div className="mb-6">
                    <div className="text-gray-600 mb-1">Giá từ</div>
                    <div className="flex items-center">
                      {tour.priceDiscount ? (
                        <>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(Number(tour.priceDiscount))}
                          </span>
                          <span className="ml-2 text-sm line-through text-gray-500">
                            {formatCurrency(Number(tour.price))}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-primary-600">
                          {formatCurrency(Number(tour.price))}
                        </span>
                      )}
                      <span className="ml-2 text-sm text-gray-500">/ người</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày khởi hành
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCalendar className="text-gray-400" />
                        </div>
                        <select
                          id="date"
                          className="input pl-10 w-full p-2 border border-gray-300 rounded-md"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        >
                          {tour.startDates && Array.isArray(tour.startDates) && tour.startDates.length > 0 ? (
                            tour.startDates.map((date, index) => (
                              <option key={index} value={date}>
                                {formatDate(date)}
                              </option>
                            ))
                          ) : (
                            <option value="">Không có lịch khởi hành</option>
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
                        Số người
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUsers className="text-gray-400" />
                        </div>
                        <select
                          id="participants"
                          className="input pl-10 w-full p-2 border border-gray-300 rounded-md"
                          value={participants}
                          onChange={(e) => setParticipants(Number(e.target.value))}
                        >
                          {[...Array(tour.maxGroupSize || 1)].map((_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1} người
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between py-2 border-b">
                      <span>Giá tour</span>
                      <span>{formatCurrency(Number(tour.priceDiscount || tour.price))} x {participants}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Tổng tiền</span>
                      <span className="font-bold">{formatCurrency(Number(tour.priceDiscount || tour.price) * participants)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleBooking}
                    className="btn btn-primary w-full py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700"
                    disabled={!selectedDate || (tour.startDates && tour.startDates.length === 0)}
                  >
                    Đặt ngay
                  </button>
                  
                  <div className="mt-4 text-center text-sm text-gray-500">
                    <FiShield className="inline mr-1" />
                    Đảm bảo hoàn tiền trong 48h nếu hủy tour
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

export default TourDetailsPage; 