import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaPrint, FaArrowLeft, FaEdit } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { flightBookingsAPI } from '../../services/api';

const FlightBookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setIsLoading(true);
    try {
      const response = await flightBookingsAPI.getById(id);
      if (response.success) {
        setBooking(response.data);
        setError(null);
      } else {
        setError('Không thể tải thông tin đặt vé. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đặt vé:', error);
      setError('Đã xảy ra lỗi khi tải thông tin đặt vé.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    let confirmMessage = 'Bạn có chắc chắn muốn ';
    
    switch (newStatus) {
      case 'confirmed':
        confirmMessage += 'xác nhận đơn đặt vé này?';
        break;
      case 'completed':
        confirmMessage += 'đánh dấu đơn đặt vé này là hoàn thành?';
        break;
      case 'cancelled':
        confirmMessage += 'hủy đơn đặt vé này?';
        break;
      default:
        confirmMessage += 'thay đổi trạng thái đơn đặt vé này?';
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await flightBookingsAPI.updateStatus(id, newStatus);
        if (response.success) {
          alert('Cập nhật trạng thái thành công');
          fetchBooking();
        } else {
          alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const handleUpdatePaymentStatus = async (newStatus) => {
    const confirmMessage = `Bạn có chắc chắn muốn đánh dấu đơn này là "${newStatus === 'paid' ? 'đã thanh toán' : 'chưa thanh toán'}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await flightBookingsAPI.updatePaymentStatus(id, { paymentStatus: newStatus });
        if (response.success) {
          alert('Cập nhật trạng thái thanh toán thành công');
          fetchBooking();
        } else {
          alert('Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const handleDeleteBooking = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt vé này? Hành động này không thể hoàn tác.')) {
      try {
        const response = await flightBookingsAPI.delete(id);
        if (response.success) {
          alert('Xóa đơn đặt vé thành công');
          navigate('/flight-bookings');
        } else {
          alert('Không thể xóa đơn đặt vé. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi xóa đơn đặt vé:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const printBooking = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border text-blue-500" role="status">
            <span className="sr-only">Đang tải...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !booking) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Không tìm thấy thông tin đặt vé'}</p>
          <button
            onClick={() => navigate('/flight-bookings')}
            className="mt-3 flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-1" /> Quay lại danh sách
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/flight-bookings')}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Chi tiết đặt vé máy bay - {booking.bookingReference}
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={printBooking}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center text-sm"
            >
              <FaPrint className="mr-2" /> In đặt vé
            </button>
          </div>
        </div>

        {/* Thông tin tổng quan */}
        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Thông tin đặt vé</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Mã đặt vé:</span>
                <span className="font-medium">{booking.bookingReference}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Ngày đặt:</span>
                <span>{formatDate(booking.createdAt)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Trạng thái:</span>
                <StatusBadge status={booking.status} type="booking" />
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Thanh toán:</span>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full 
                  ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                  booking.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
                  booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'}`}>
                  {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                  booking.paymentStatus === 'refunded' ? 'Đã hoàn tiền' :
                  booking.paymentStatus === 'failed' ? 'Thanh toán thất bại' :
                  'Chờ thanh toán'}
                </span>
              </div>
              {booking.paymentMethod && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span>{booking.paymentMethod}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold text-green-600">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Thông tin liên hệ</h2>
            <div className="space-y-3">
              {booking.user && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Khách hàng:</span>
                  <span>{booking.user.name}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Email:</span>
                <span>{booking.contactInfo.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Số điện thoại:</span>
                <span>{booking.contactInfo.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin chuyến bay */}
        {booking.flight && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin chuyến bay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Hãng hàng không:</span>
                  <span>{booking.flight.airline}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Số hiệu:</span>
                  <span>{booking.flight.flightNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Từ:</span>
                  <span>{booking.flight.departureAirport}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Đến:</span>
                  <span>{booking.flight.arrivalAirport}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Thời gian khởi hành:</span>
                  <span>{formatDate(booking.flight.departureTime)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Thời gian đến:</span>
                  <span>{formatDate(booking.flight.arrivalTime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách hành khách */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Danh sách hành khách ({booking.passengers.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh xưng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quốc tịch
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {booking.passengers.map((passenger, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{passenger.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{`${passenger.firstName} ${passenger.lastName}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${passenger.type === 'adult' ? 'bg-blue-100 text-blue-800' : 
                        passenger.type === 'child' ? 'bg-green-100 text-green-800' : 
                        'bg-purple-100 text-purple-800'}`}>
                        {passenger.type === 'adult' ? 'Người lớn' : 
                        passenger.type === 'child' ? 'Trẻ em' : 'Em bé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(passenger.dob)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{passenger.nationality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thông tin ghế, hành lý và bữa ăn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chỗ ngồi */}
          {booking.seatSelections && booking.seatSelections.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Chỗ ngồi</h2>
              <div className="space-y-2">
                {booking.seatSelections.map((seat, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">
                      Hành khách {seat.passenger + 1}:
                    </span>
                    <span className="font-semibold">{seat.seatNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hành lý */}
          {booking.baggageOptions && booking.baggageOptions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Hành lý</h2>
              <div className="space-y-2">
                {booking.baggageOptions.map((baggage, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Hành khách {baggage.passenger + 1}:
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500 ml-4">Hành lý ký gửi:</span>
                      <span>{baggage.checkedBaggage} kg</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500 ml-4">Hành lý xách tay:</span>
                      <span>{baggage.cabinBaggage} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bữa ăn */}
          {booking.mealPreferences && booking.mealPreferences.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Bữa ăn</h2>
              <div className="space-y-2">
                {booking.mealPreferences.map((meal, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">
                      Hành khách {meal.passenger + 1}:
                    </span>
                    <span>
                      {meal.mealType === 'regular' ? 'Tiêu chuẩn' :
                      meal.mealType === 'vegetarian' ? 'Chay' :
                      meal.mealType === 'vegan' ? 'Thuần chay' :
                      meal.mealType === 'kosher' ? 'Kosher' :
                      meal.mealType === 'halal' ? 'Halal' :
                      meal.mealType === 'diabetic' ? 'Tiểu đường' :
                      meal.mealType === 'gluten-free' ? 'Không gluten' :
                      'Không có'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Yêu cầu đặc biệt */}
        {booking.specialRequests && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Yêu cầu đặc biệt</h2>
            <p className="text-gray-700">{booking.specialRequests}</p>
          </div>
        )}

        {/* Thao tác */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Hành động</h2>
          <div className="flex flex-wrap gap-3">
            {booking.status === 'pending' && (
              <button
                onClick={() => handleUpdateStatus('confirmed')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center"
              >
                <FaCheckCircle className="mr-2" /> Xác nhận đặt vé
              </button>
            )}
            
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center"
              >
                <FaTimesCircle className="mr-2" /> Hủy đặt vé
              </button>
            )}
            
            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleUpdateStatus('completed')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
              >
                <FaCheckCircle className="mr-2" /> Đánh dấu hoàn thành
              </button>
            )}
            
            {booking.paymentStatus !== 'paid' && (
              <button
                onClick={() => handleUpdatePaymentStatus('paid')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center"
              >
                <FaCheckCircle className="mr-2" /> Đánh dấu đã thanh toán
              </button>
            )}
            
            {booking.paymentStatus === 'paid' && booking.status !== 'completed' && (
              <button
                onClick={() => handleUpdatePaymentStatus('refunded')}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md flex items-center"
              >
                <FaCheckCircle className="mr-2" /> Đánh dấu đã hoàn tiền
              </button>
            )}
            
            <button
              onClick={handleDeleteBooking}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center"
            >
              <FaTimesCircle className="mr-2" /> Xóa đặt vé
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FlightBookingDetailPage; 