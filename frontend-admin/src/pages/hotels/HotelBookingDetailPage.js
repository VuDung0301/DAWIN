import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaCalendarAlt, FaUsers, FaBed, FaHotel } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { bookingsAPI } from '../../services/api';

const HotelBookingDetailPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const response = await bookingsAPI.getById(id);
        
        if (response.success) {
          setBooking(response.data);
        } else {
          setError('Không thể tải thông tin đặt phòng');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu đặt phòng:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu đặt phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'confirmed' ? 'xác nhận' : 'hủy'} đơn đặt phòng này không?`)) {
      try {
        const response = await bookingsAPI.update(id, { status: newStatus });
        if (response.success) {
          alert('Cập nhật trạng thái thành công!');
          setBooking(prev => ({ ...prev, status: newStatus }));
        } else {
          alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Update booking status error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
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

  if (error || !booking) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin đặt phòng'}</p>
          <Link to="/hotel-bookings" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách đặt phòng
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/hotel-bookings" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <FaArrowLeft className="mr-2" />
            Quay lại danh sách đặt phòng
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Chi tiết đặt phòng</h1>
            <p className="text-gray-600">Mã đơn: {booking?._id}</p>
          </div>
          <StatusBadge status={booking?.status} type="booking" size="lg" />
        </div>

        {/* Thông tin khách sạn */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <FaHotel className="text-indigo-600 mr-2 text-xl" />
            <h2 className="text-xl font-bold">Thông tin khách sạn</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Khách sạn:</h3>
              {booking?.hotel ? (
                <Link 
                  to={`/hotels/${booking.hotel._id}`} 
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {booking.hotel.name}
                </Link>
              ) : (
                <p>Không có thông tin</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Loại phòng:</h3>
              <p>{booking?.room || 'Không có thông tin'}</p>
            </div>
          </div>
        </div>

        {/* Thông tin đặt phòng */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCalendarAlt className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold">Thời gian</h2>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Check-in:</span>
                <p className="font-semibold">{formatDate(booking?.checkIn || booking?.checkInDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">Check-out:</span>
                <p className="font-semibold">{formatDate(booking?.checkOut || booking?.checkOutDate)}</p>
              </div>
              <div>
                <span className="text-gray-600">Số đêm:</span>
                <p className="font-semibold">{booking?.numberOfNights || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold">Khách</h2>
            </div>
            <div className="space-y-2">
              {booking?.guests && typeof booking.guests === 'object' ? (
                <>
                  <div>
                    <span className="text-gray-600">Người lớn:</span>
                    <p className="font-semibold">{booking.guests.adults || 0} người</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trẻ em:</span>
                    <p className="font-semibold">{booking.guests.children || 0} người</p>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-gray-600">Tổng số khách:</span>
                  <p className="font-semibold">{booking?.guests || 0} người</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaMoneyBillWave className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold">Thanh toán</h2>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Tổng tiền:</span>
                <p className="font-semibold text-xl">{formatCurrency(booking?.totalPrice)}</p>
              </div>
              <div>
                <span className="text-gray-600">Phương thức:</span>
                <p className="font-semibold">{booking?.paymentMethod || 'Không có thông tin'}</p>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái thanh toán:</span>
                <p className={`font-semibold ${booking?.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {booking?.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <FaUsers className="text-indigo-600 mr-2 text-xl" />
            <h2 className="text-xl font-bold">Thông tin khách hàng</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Họ tên:</h3>
              <p>{booking?.user?.name || booking?.contactInfo?.fullName || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Email:</h3>
              <p>{booking?.contactInfo?.email || booking?.user?.email || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Số điện thoại:</h3>
              <p>{booking?.contactInfo?.phone || booking?.user?.phone || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Yêu cầu đặc biệt:</h3>
              <p>{booking?.specialRequests || 'Không có'}</p>
            </div>
          </div>
        </div>

        {/* Lịch sử đơn hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <FaCalendarAlt className="text-indigo-600 mr-2 text-xl" />
            <h2 className="text-xl font-bold">Lịch sử đơn hàng</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">Ngày đặt:</p>
                <p>{formatDate(booking?.createdAt)}</p>
              </div>
              <StatusBadge status="pending" type="booking" />
            </div>
            
            {booking?.updatedAt && booking.updatedAt !== booking.createdAt && (
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold">Ngày cập nhật:</p>
                  <p>{formatDate(booking.updatedAt)}</p>
                </div>
                <StatusBadge status={booking.status} type="booking" />
              </div>
            )}
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="flex flex-wrap gap-4 justify-end">
          {booking?.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateStatus('confirmed')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaCheckCircle className="mr-2" />
                Xác nhận đơn
              </button>
              
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <FaTimesCircle className="mr-2" />
                Hủy đơn
              </button>
            </>
          )}
          
          {booking?.status === 'confirmed' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FaCheckCircle className="mr-2" />
              Hoàn thành
            </button>
          )}
          
          {booking?.status === 'confirmed' && (
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <FaTimesCircle className="mr-2" />
              Hủy đơn
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HotelBookingDetailPage; 