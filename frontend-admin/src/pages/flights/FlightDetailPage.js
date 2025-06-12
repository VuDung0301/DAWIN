import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlaneDeparture, FaPlaneArrival, FaClock, FaUser, FaPlane, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { flightsAPI, flightBookingsAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';
import viLocale from 'date-fns/locale/vi';

const FlightDetailPage = () => {
  const { flightIata, date } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        setLoading(true);
        const flightData = await flightsAPI.getById(flightIata, date);
        
        if (flightData.success) {
          // Định dạng dữ liệu chuyến bay
          const flightDetails = flightData.data;
          setFlight(flightDetails);
          
          // Lấy thông tin đặt vé
          const bookingsData = await flightBookingsAPI.getAll({ flight: flightIata, date });
          if (bookingsData.success) {
            setBookings(bookingsData.data.bookings || []);
          }
        } else {
          setError('Không thể tải thông tin chuyến bay');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu chuyến bay:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu chuyến bay');
      } finally {
        setLoading(false);
      }
    };

    if (flightIata && date) {
      fetchFlightData();
    }
  }, [flightIata, date]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'HH:mm - dd/MM/yyyy', { locale: viLocale });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return 'N/A';
    
    try {
      const departureTime = new Date(departure);
      const arrivalTime = new Date(arrival);
      
      const diffInMs = arrivalTime - departureTime;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'landed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'incident': 'bg-yellow-100 text-yellow-800',
      'diverted': 'bg-purple-100 text-purple-800',
      'delayed': 'bg-orange-100 text-orange-800'
    };
    
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Lịch trình',
      'active': 'Đang bay',
      'landed': 'Đã hạ cánh',
      'cancelled': 'Đã hủy',
      'incident': 'Sự cố',
      'diverted': 'Chuyển hướng',
      'delayed': 'Trễ'
    };
    
    return statusMap[status] || 'Không xác định';
  };

  // Hiển thị loading
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  // Hiển thị lỗi
  if (error || !flight) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin chuyến bay'}</p>
          <Link to="/flights" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách chuyến bay
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
            <button 
              onClick={() => navigate(-1)} 
              className="text-indigo-600 hover:text-indigo-800 mr-4">
              <FaArrowLeft className="inline mr-2" />
              Quay lại
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {flight.airline?.name || 'N/A'} - {flight.flight?.iata || 'N/A'}
            </h1>
          </div>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(flight.flight_status)}`}>
              {getStatusText(flight.flight_status)}
            </span>
          </div>
        </div>

        {/* Thông tin chuyến bay chính */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <FaCalendarAlt className="text-indigo-600 mr-2" />
                <span className="font-semibold text-lg">Ngày bay: {flight.flight_date}</span>
              </div>
              
              <div className="flex items-center mb-6">
                <FaPlane className="text-indigo-600 mr-2" />
                <div>
                  <span className="font-semibold">Mã chuyến bay: {flight.flight?.iata}</span>
                  {flight.flight?.codeshared && (
                    <p className="text-sm text-gray-500 mt-1">
                      Codeshare: {flight.flight.codeshared.airline_name} - {flight.flight.codeshared.flight_iata}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thông tin khởi hành */}
                <div className="border p-4 rounded-lg bg-gray-50">
                  <div className="flex items-start mb-2">
                    <FaPlaneDeparture className="text-indigo-600 mt-1 mr-2" />
                    <div>
                      <h3 className="font-bold text-lg">{flight.departure?.airport}</h3>
                      <p className="text-gray-600 text-sm">
                        <FaMapMarkerAlt className="inline mr-1" /> 
                        {flight.departure?.iata} ({flight.departure?.timezone})
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-semibold">Thời gian lên máy bay:</p>
                    <p>{formatDateTime(flight.departure?.scheduled)}</p>
                    
                    {flight.departure?.terminal && (
                      <p className="mt-1 text-gray-600">
                        Terminal: {flight.departure.terminal}
                        {flight.departure.gate && `, Gate: ${flight.departure.gate}`}
                      </p>
                    )}
                    
                    {flight.departure?.delay && (
                      <p className="mt-2 text-red-600">
                        Trễ: {flight.departure.delay} phút
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Thông tin đến */}
                <div className="border p-4 rounded-lg bg-gray-50">
                  <div className="flex items-start mb-2">
                    <FaPlaneArrival className="text-indigo-600 mt-1 mr-2" />
                    <div>
                      <h3 className="font-bold text-lg">{flight.arrival?.airport}</h3>
                      <p className="text-gray-600 text-sm">
                        <FaMapMarkerAlt className="inline mr-1" /> 
                        {flight.arrival?.iata} ({flight.arrival?.timezone})
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-semibold">Thời gian hạ cánh:</p>
                    <p>{formatDateTime(flight.arrival?.scheduled)}</p>
                    
                    {flight.arrival?.terminal && (
                      <p className="mt-1 text-gray-600">
                        Terminal: {flight.arrival.terminal}
                        {flight.arrival.gate && `, Gate: ${flight.arrival.gate}`}
                      </p>
                    )}
                    
                    {flight.arrival?.baggage && (
                      <p className="mt-1 text-gray-600">
                        Baggage: {flight.arrival.baggage}
                      </p>
                    )}
                    
                    {flight.arrival?.delay && (
                      <p className="mt-2 text-red-600">
                        Trễ: {flight.arrival.delay} phút
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
              <div className="flex items-center mb-4">
                <FaClock className="text-indigo-600 mr-2" />
                <div>
                  <p className="text-gray-600">Thời gian bay</p>
                  <p className="font-semibold text-lg">
                    {calculateDuration(flight.departure?.scheduled, flight.arrival?.scheduled)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <img 
                  src={`https://pics.avs.io/200/80/${flight.airline?.iata}.png`} 
                  alt={flight.airline?.name} 
                  className="h-8 mr-2"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div>
                  <p className="font-semibold">{flight.airline?.name}</p>
                  <p className="text-sm text-gray-500">IATA: {flight.airline?.iata} / ICAO: {flight.airline?.icao}</p>
                </div>
              </div>
              
              {flight.aircraft && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="font-semibold">Tàu bay:</p>
                  <p>IATA: {flight.aircraft.iata || 'N/A'}</p>
                  <p>ICAO: {flight.aircraft.icao || 'N/A'}</p>
                  <p>Đăng ký: {flight.aircraft.registration || 'N/A'}</p>
                </div>
              )}
              
              {flight.live && (
                <div className="border-t border-gray-200 pt-4 mt-4 bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold text-green-800">Thông tin trực tiếp:</p>
                  <p>Đã cập nhật: {formatDateTime(flight.live.updated)}</p>
                  <p>Độ cao: {flight.live.altitude || 'N/A'} m</p>
                  <p>Tốc độ: {flight.live.speed_horizontal || 'N/A'} km/h</p>
                  <p>Hướng: {flight.live.direction || 'N/A'}°</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách đặt vé */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6">Danh sách đặt vé ({bookings?.length || 0})</h2>
          
          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mã đặt vé</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Khách hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày đặt</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số hành khách</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tổng tiền</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                        {booking.bookingReference}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.user?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(booking.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.passengers?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(booking.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            booking.bookingStatus === 'completed' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link 
                          to={`/flight-bookings/${booking._id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">Chưa có đặt vé nào cho chuyến bay này</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FlightDetailPage; 