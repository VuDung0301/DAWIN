import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaCalendarAlt, FaUsers, FaPlane, FaTicketAlt } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { bookingsAPI } from '../../services/api';

const FlightBookingDetailPage = () => {
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
          setError('Không thể tải thông tin đặt vé máy bay');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu đặt vé máy bay:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu đặt vé máy bay');
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

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'confirmed' ? 'xác nhận' : 'hủy'} đơn đặt vé này không?`)) {
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
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin đặt vé máy bay'}</p>
          <Link to="/flight-bookings" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách đặt vé
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/flight-bookings" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <FaArrowLeft className="mr-2" />
            Quay lại danh sách đặt vé
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Chi tiết đặt vé máy bay</h1>
            <p className="text-gray-600">Mã đơn: {booking?._id}</p>
            {booking?.bookingCode && (
              <p className="text-gray-600">Mã đặt vé: {booking.bookingCode}</p>
            )}
          </div>
          <StatusBadge status={booking?.status} type="booking" size="lg" />
        </div>

        {/* Thông tin chuyến bay */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <FaPlane className="text-indigo-600 mr-2 text-xl" />
            <h2 className="text-xl font-bold">Thông tin chuyến bay</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {booking?.flight ? (
              <>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Chuyến bay:</h3>
                  <Link 
                    to={`/flights/${booking.flight._id}`} 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {booking.flight.flightNumber || `${booking.flight.airline} - ${booking.flight.flightNumber}`}
                  </Link>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Hãng hàng không:</h3>
                  <p>{booking.flight.airline}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Từ:</h3>
                  <p>{booking.flight.departureCity || booking.flight.origin}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Đến:</h3>
                  <p>{booking.flight.arrivalCity || booking.flight.destination}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Ngày khởi hành:</h3>
                  <p>{formatDate(booking.flight.departureTime)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Giờ khởi hành:</h3>
                  <p>{formatTime(booking.flight.departureTime)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Ngày đến:</h3>
                  <p>{formatDate(booking.flight.arrivalTime)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Giờ đến:</h3>
                  <p>{formatTime(booking.flight.arrivalTime)}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Từ:</h3>
                  <p>{booking?.origin || booking?.departureCity || 'Không có thông tin'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Đến:</h3>
                  <p>{booking?.destination || booking?.arrivalCity || 'Không có thông tin'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Ngày khởi hành:</h3>
                  <p>{formatDate(booking?.departureDate || booking?.departureTime)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Hạng ghế:</h3>
                  <p>{booking?.seatClass || 'Không có thông tin'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Thông tin vé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaTicketAlt className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold">Chi tiết vé</h2>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Loại vé:</span>
                <p className="font-semibold">{booking?.ticketType || booking?.seatClass || 'Không có thông tin'}</p>
              </div>
              <div>
                <span className="text-gray-600">Hạng ghế:</span>
                <p className="font-semibold">{booking?.seatClass || 'Không có thông tin'}</p>
              </div>
              {booking?.seats && (
                <div>
                  <span className="text-gray-600">Số ghế:</span>
                  <p className="font-semibold">{Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-indigo-600 mr-2" />
              <h2 className="text-lg font-bold">Hành khách</h2>
            </div>
            <div className="space-y-2">
              {booking?.passengers && typeof booking.passengers === 'object' ? (
                <>
                  <div>
                    <span className="text-gray-600">Người lớn:</span>
                    <p className="font-semibold">{booking.passengers.adults || 0} người</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trẻ em:</span>
                    <p className="font-semibold">{booking.passengers.children || 0} người</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Em bé:</span>
                    <p className="font-semibold">{booking.passengers.infants || 0} người</p>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-gray-600">Tổng số hành khách:</span>
                  <p className="font-semibold">{booking?.numberOfPassengers || booking?.passengers || 0} người</p>
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

        {/* Thông tin hành khách */}
        {booking?.passengerDetails && booking.passengerDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-indigo-600 mr-2 text-xl" />
              <h2 className="text-xl font-bold">Danh sách hành khách</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại khách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày sinh
                    </th>
                    {booking.passengerDetails.some(p => p.passportNumber) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hộ chiếu
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {booking.passengerDetails.map((passenger, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {passenger.name || passenger.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {passenger.type || (passenger.isChild ? 'Trẻ em' : passenger.isInfant ? 'Em bé' : 'Người lớn')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {passenger.birthDate ? formatDate(passenger.birthDate) : 'N/A'}
                      </td>
                      {booking.passengerDetails.some(p => p.passportNumber) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {passenger.passportNumber || 'N/A'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

export default FlightBookingDetailPage; 