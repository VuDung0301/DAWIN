import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaStar, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { toursAPI, reviewsAPI } from '../../services/api';

const TourDetailPage = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        setLoading(true);
        const tourData = await toursAPI.getById(id);
        
        if (tourData.success) {
          setTour(tourData.data);
          
          // Lấy đánh giá
          const reviewsData = await reviewsAPI.getAll({ tour: id });
          if (reviewsData.success) {
            setReviews(reviewsData.data.reviews);
          }
        } else {
          setError('Không thể tải thông tin tour');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu tour:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu tour');
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !tour) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin tour'}</p>
          <Link to="/tours" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách tour
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
            <Link to="/tours" className="text-indigo-600 hover:text-indigo-800 mr-4">
              <FaArrowLeft className="inline mr-2" />
              Quay lại
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{tour.name}</h1>
          </div>
          <Link 
            to={`/tours/edit/${tour._id}`}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FaEdit className="mr-2" />
            Chỉnh sửa
          </Link>
        </div>

        {/* Ảnh đại diện */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-96">
          <img 
            src={tour.coverImage} 
            alt={tour.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <FaCalendarAlt className="text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Thời gian tour</h3>
            </div>
            <p className="text-gray-700">{tour.duration} ngày</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <FaUsers className="text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Số lượng tối đa</h3>
            </div>
            <p className="text-gray-700">{tour.maxGroupSize} người</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <FaMoneyBillWave className="text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Giá tour</h3>
            </div>
            <p className="text-gray-700">{formatCurrency(tour.price)}</p>
            {tour.priceDiscount > 0 && (
              <p className="text-green-600 font-semibold">
                Giảm giá: {formatCurrency(tour.priceDiscount)}
              </p>
            )}
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Mô tả tour</h2>
          <p className="text-gray-700 whitespace-pre-line">{tour.description}</p>
        </div>

        {/* Lịch trình */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Lịch trình tour</h2>
          {tour.itinerary && Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? (
            <div className="space-y-6">
              {tour.itinerary.map((day, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4 pb-4">
                  <h3 className="text-xl font-bold text-indigo-600 mb-2">
                    Ngày {day.day}: {day.title}
                  </h3>
                  <p className="text-gray-700 mb-4">{day.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Hoạt động:</h4>
                    <ul className="list-disc pl-5 text-gray-700">
                      {day.activities && Array.isArray(day.activities) && day.activities.map((activity, i) => (
                        <li key={i}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Chỗ ở:</h4>
                    <p className="text-gray-700">{day.accommodation || 'Không có thông tin'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Bữa ăn:</h4>
                    <div className="flex space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${day.meals?.breakfast ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        Sáng: {day.meals?.breakfast ? 'Có' : 'Không'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${day.meals?.lunch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        Trưa: {day.meals?.lunch ? 'Có' : 'Không'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${day.meals?.dinner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        Tối: {day.meals?.dinner ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Không có thông tin lịch trình</p>
          )}
        </div>

        {/* Địa điểm */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Địa điểm</h2>
          
          {/* Địa điểm khởi hành */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Địa điểm khởi hành</h3>
            
            {tour.startLocation ? (
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                <div>
                  <p className="font-semibold text-gray-800">{tour.startLocation.description}</p>
                  <p className="text-gray-700">{tour.startLocation.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Không có thông tin địa điểm khởi hành</p>
            )}
          </div>
          
          {/* Các địa điểm tham quan */}
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Các địa điểm tham quan</h3>
            
            {tour.locations && Array.isArray(tour.locations) && tour.locations.length > 0 ? (
              <div className="space-y-4">
                {tour.locations.map((location, index) => (
                  <div key={index} className="flex items-start">
                    <FaMapMarkerAlt className="text-red-500 mt-1 mr-2" />
                    <div>
                      <p className="font-semibold text-gray-800">{location?.description || 'Không có mô tả'}</p>
                      <p className="text-gray-700">Ngày: {location?.day || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Không có thông tin các địa điểm tham quan</p>
            )}
          </div>
        </div>

        {/* Thông tin bao gồm và không bao gồm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Bao gồm</h2>
            {tour.includes && Array.isArray(tour.includes) && tour.includes.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-700">
                {tour.includes.map((item, index) => (
                  <li key={index} className="mb-2">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Không có thông tin</p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Không bao gồm</h2>
            {tour.excludes && Array.isArray(tour.excludes) && tour.excludes.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-700">
                {tour.excludes.map((item, index) => (
                  <li key={index} className="mb-2">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Không có thông tin</p>
            )}
          </div>
        </div>

        {/* Đánh giá */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Đánh giá</h2>
            <div className="flex items-center">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="font-semibold">{tour.ratingsAverage || 0} / 5</span>
              <span className="text-gray-500 ml-2">({tour.ratingsQuantity || 0} đánh giá)</span>
            </div>
          </div>
          
          {Array.isArray(reviews) && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b pb-4 mb-4">
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

export default TourDetailPage; 