import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaStar, FaMapMarkerAlt, FaBed, FaSwimmingPool, FaWifi, FaUtensils } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { hotelsAPI, reviewsAPI } from '../../services/api';

const HotelDetailPage = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        const hotelData = await hotelsAPI.getById(id);
        
        if (hotelData.success) {

            setHotel(hotelData.data);
          
          // Lấy đánh giá
          const reviewsData = await reviewsAPI.getAll({ hotel: id });
          if (reviewsData.success) {
            setReviews(reviewsData.data.reviews);
          }
        } else {
          setError('Không thể tải thông tin khách sạn');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khách sạn:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu khách sạn');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderAmenityIcon = (amenity) => {
    const amenityMap = {
      'wifi': <FaWifi className="text-indigo-600" />,
      'bể bơi': <FaSwimmingPool className="text-indigo-600" />,
      'nhà hàng': <FaUtensils className="text-indigo-600" />,
      'Wifi': <FaWifi className="text-indigo-600" />,
      'Swimming Pool': <FaSwimmingPool className="text-indigo-600" />,
      'Restaurant': <FaUtensils className="text-indigo-600" />
    };
    
    return amenityMap[amenity.toLowerCase()] || <FaBed className="text-indigo-600" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !hotel) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin khách sạn'}</p>
          <Link to="/hotels" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách khách sạn
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link to="/hotels" className="text-indigo-600 hover:text-indigo-800 mr-4">
              <FaArrowLeft className="inline mr-2" />
              Quay lại
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{hotel.name}</h1>
          </div>
          <Link 
            to={`/hotels/edit/${hotel._id}`}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FaEdit className="mr-2" />
            Chỉnh sửa
          </Link>
        </div>

        {/* Ảnh đại diện và thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={hotel.coverImage} 
              alt={hotel.name} 
              className="w-full h-80 object-cover"
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="mr-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i}
                      className={i < hotel.stars ? "text-yellow-400 inline" : "text-gray-300 inline"}
                    />
                  ))}
                </div>
                <span className="font-semibold">{hotel.stars} sao</span>
              </div>
              
              <div className="flex items-start mb-4">
                <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                <div>
                  <p className="font-semibold">{hotel.city}</p>
                  <p className="text-gray-700">{hotel.address}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Giá phòng từ:</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(hotel.pricePerNight)}
                <span className="text-sm text-gray-500"> / đêm</span>
              </p>
              {hotel.priceDiscount > 0 && (
                <p className="text-green-600">
                  Giảm giá: {formatCurrency(hotel.priceDiscount)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Mô tả khách sạn</h2>
          <p className="text-gray-700 whitespace-pre-line">{hotel.description}</p>
        </div>

        {/* Tiện nghi */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Tiện nghi khách sạn</h2>
          {hotel?.amenities && hotel?.amenities?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hotel?.amenities?.map((amenity, index) => (
                <div key={index} className="flex items-center p-3 border rounded-lg">
                  <div className="mr-3">
                    {renderAmenityIcon(amenity)}
                  </div>
                  <span className="text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Không có thông tin về tiện nghi</p>
          )}
        </div>

        {/* Loại phòng */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Các loại phòng</h2>
          {hotel?.roomTypes && hotel?.roomTypes?.length > 0 ? (
            <div className="space-y-6">
              {hotel?.roomTypes?.map((room, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="md:col-span-1 h-48">
                      <img 
                        src={room?.images && room?.images?.length > 0 ? room?.images[0] : hotel?.coverImage} 
                        alt={room?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="md:col-span-2 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold">{room.name}</h3>
                        <div>
                          <p className="text-lg font-bold text-indigo-600">{formatCurrency(room.price)}</p>
                          {room.priceDiscount > 0 && (
                            <p className="text-green-600 text-sm">
                              Giảm: {formatCurrency(room.priceDiscount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{room.description || 'Không có mô tả'}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-gray-600">Sức chứa:</p>
                          <p className="font-semibold">{room.capacity} người</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Số phòng còn trống:</p>
                          <p className="font-semibold">{room.available}</p>
                        </div>
                      </div>
                      
                      {room?.amenities && room?.amenities?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-gray-600 mb-1">Tiện nghi phòng:</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Không có thông tin về loại phòng</p>
          )}
        </div>

        {/* Chính sách khách sạn */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Chính sách khách sạn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Giờ nhận phòng:</h3>
              <p className="text-gray-700">{hotel.policies?.checkIn || 'Từ 14:00'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Giờ trả phòng:</h3>
              <p className="text-gray-700">{hotel.policies?.checkOut || 'Trước 12:00'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Chính sách hủy phòng:</h3>
            <p className="text-gray-700">{hotel.policies?.cancellation || 'Không có thông tin'}</p>
          </div>
          
          {hotel?.policies?.additionalRules && hotel?.policies?.additionalRules?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Quy định khác:</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {hotel.policies.additionalRules.map((rule, index) => (
                  <li key={index} className="mb-1">{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Địa điểm gần đó */}
        {hotel?.nearbyAttractions && hotel?.nearbyAttractions?.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-6">Địa điểm tham quan lân cận</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotel.nearbyAttractions.map((attraction, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {attraction.image && (
                    <img 
                      src={attraction.image} 
                      alt={attraction.name} 
                      className="w-full h-40 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{attraction.name}</h3>
                    <p className="text-gray-700 mb-2">{attraction.description}</p>
                    <p className="text-indigo-600">
                      <FaMapMarkerAlt className="inline mr-1" />
                      Cách {attraction.distance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Đánh giá */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Đánh giá</h2>
            <div className="flex items-center">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="font-semibold">{hotel.ratingsAverage} / 5</span>
              <span className="text-gray-500 ml-2">({hotel.ratingsQuantity} đánh giá)</span>
            </div>
          </div>
          
          {reviews?.length > 0 ? (
            <div className="space-y-4">
              {reviews?.map((review) => (
                <div key={review?._id} className="border-b pb-4 mb-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      {review.user.avatar ? (
                        <img 
                          src={review.user.avatar} 
                          alt={review.user.name} 
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-indigo-600 font-semibold">
                          {review.user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{review.user.name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i}
                              className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2">{review.review}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Chưa có đánh giá nào</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HotelDetailPage; 