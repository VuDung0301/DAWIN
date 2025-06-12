import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiUsers, FiClock, FiArrowRight, FiCheck, FiX, FiArrowLeft, FiPackage, FiCoffee, FiWifi } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const FlightDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [luggageOption, setLuggageOption] = useState('standard');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [seatOptions, setSeatOptions] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Load dữ liệu chuyến bay
  useEffect(() => {
    const fetchFlightDetails = async () => {
      setLoading(true);
      try {
        // Giả lập data chuyến bay
        setTimeout(() => {
          const mockFlight = {
            id: id,
            airline: 'Vietnam Airlines',
            airlineCode: 'VNA',
            flightNumber: 'VN123',
            origin: 'Hà Nội',
            destination: 'Hồ Chí Minh',
            departureTime: '2023-06-15T08:00:00',
            arrivalTime: '2023-06-15T10:10:00',
            duration: '2h 10m',
            price: {
              economy: 1200000,
              business: 3500000,
              premium: 2200000
            },
            stopover: 0,
            remainingSeats: {
              economy: 45,
              business: 10,
              premium: 15
            },
            aircraft: 'Airbus A350',
            departureTerminal: 'T1',
            arrivalTerminal: 'T1',
            amenities: ['meal', 'wifi', 'usb', 'entertainment'],
            baggageAllowance: {
              cabin: '7kg',
              checked: '23kg'
            }
          };
          
          setFlight(mockFlight);
          setSelectedClass('economy');
          
          // Tạo danh sách ghế giả lập
          const generateSeats = () => {
            const seats = [];
            const rows = 10;
            const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
            
            for (let row = 1; row <= rows; row++) {
              for (let col = 0; col < cols.length; col++) {
                const seatId = `${row}${cols[col]}`;
                const isAvailable = Math.random() > 0.3; // 30% ghế đã đặt
                
                seats.push({
                  id: seatId,
                  available: isAvailable,
                  type: col === 0 || col === 5 ? 'window' : col === 2 || col === 3 ? 'aisle' : 'middle'
                });
              }
            }
            
            return seats;
          };
          
          setSeatOptions(generateSeats());
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching flight details:', error);
        setError('Không thể tải thông tin chuyến bay. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchFlightDetails();
  }, [id]);
  
  // Xử lý chọn ghế
  const handleSeatSelection = (seatId) => {
    const seat = seatOptions.find(s => s.id === seatId);
    if (!seat || !seat.available) return;
    
    // Nếu đã chọn ghế này rồi thì bỏ chọn
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      // Nếu số ghế đã chọn bằng số hành khách thì thay thế ghế đầu tiên
      if (selectedSeats.length >= passengers) {
        setSelectedSeats([...selectedSeats.slice(1), seatId]);
      } else {
        setSelectedSeats([...selectedSeats, seatId]);
      }
    }
  };
  
  // Xử lý chọn loại ghế
  const handleClassSelection = (classType) => {
    setSelectedClass(classType);
    // Reset ghế đã chọn khi thay đổi loại ghế
    setSelectedSeats([]);
  };
  
  // Xử lý đặt vé
  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/flights/${id}` } });
      return;
    }
    
    // Chuyển hướng tới trang thanh toán với thông tin đã chọn
    navigate('/checkout', {
      state: {
        type: 'flight',
        item: {
          id: flight.id,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          origin: flight.origin,
          destination: flight.destination,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          price: calculateTotalPrice(),
          classType: selectedClass,
          passengers,
          luggageOption,
          selectedSeats
        }
      }
    });
  };
  
  // Tính tổng giá vé
  const calculateTotalPrice = () => {
    if (!flight) return 0;
    
    let basePrice = flight.price[selectedClass];
    let luggagePrice = 0;
    
    // Giá hành lý thêm
    if (luggageOption === 'extra') {
      luggagePrice = 200000;
    } else if (luggageOption === 'premium') {
      luggagePrice = 500000;
    }
    
    return (basePrice + luggagePrice) * passengers;
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Format thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-soft p-8 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-24 bg-gray-200 rounded mb-6"></div>
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
            <Link to="/flights" className="btn btn-primary">
              Quay lại danh sách chuyến bay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!flight) return null;

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/flights" className="inline-flex items-center text-primary-600 mb-4 hover:underline">
              <FiArrowLeft className="mr-2" /> Quay lại danh sách chuyến bay
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              {flight.origin} <FiArrowRight className="inline mx-2" /> {flight.destination}
            </h1>
            <p className="text-gray-600">
              {formatDate(flight.departureTime)} • {flight.airline} • {flight.flightNumber}
            </p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chi tiết chuyến bay */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Chi tiết chuyến bay</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-4">
                        <span className="font-bold">{flight.airlineCode}</span>
                      </div>
                      <div>
                        <div className="font-medium">{flight.airline}</div>
                        <div className="text-sm text-gray-500">{flight.aircraft} • {flight.flightNumber}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="text-center">
                        <div className="text-xl font-bold">{formatTime(flight.departureTime)}</div>
                        <div className="text-sm text-gray-500">{formatDate(flight.departureTime)}</div>
                        <div className="font-medium mt-1">{flight.origin}</div>
                        <div className="text-sm text-gray-500">Terminal {flight.departureTerminal}</div>
                      </div>
                      
                      <div className="flex-1 px-4 pt-4 relative">
                        <div className="border-t border-dashed border-gray-300 w-full absolute top-1/2 left-0"></div>
                        <div className="text-center relative">
                          <span className="bg-gray-50 px-2 text-sm text-gray-500">{flight.duration}</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold">{formatTime(flight.arrivalTime)}</div>
                        <div className="text-sm text-gray-500">{formatDate(flight.arrivalTime)}</div>
                        <div className="font-medium mt-1">{flight.destination}</div>
                        <div className="text-sm text-gray-500">Terminal {flight.arrivalTerminal}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thông tin hành lý */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">Hành lý</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <FiPackage className="text-gray-500 mr-2" />
                        <span className="text-gray-700">Hành lý xách tay: {flight.baggageAllowance.cabin}</span>
                      </div>
                      <div className="flex items-center">
                        <FiPackage className="text-gray-500 mr-2" />
                        <span className="text-gray-700">Hành lý ký gửi: {flight.baggageAllowance.checked}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tiện nghi */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">Tiện nghi trên máy bay</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {flight.amenities.includes('meal') && (
                        <div className="flex items-center">
                          <FiCoffee className="text-primary-500 mr-2" />
                          <span>Bữa ăn</span>
                        </div>
                      )}
                      {flight.amenities.includes('wifi') && (
                        <div className="flex items-center">
                          <FiWifi className="text-primary-500 mr-2" />
                          <span>Wi-Fi</span>
                        </div>
                      )}
                      {flight.amenities.includes('usb') && (
                        <div className="flex items-center">
                          <FiCheck className="text-primary-500 mr-2" />
                          <span>Cổng sạc USB</span>
                        </div>
                      )}
                      {flight.amenities.includes('entertainment') && (
                        <div className="flex items-center">
                          <FiCheck className="text-primary-500 mr-2" />
                          <span>Giải trí</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Chọn hạng ghế */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">Chọn hạng ghế</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => handleClassSelection('economy')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedClass === 'economy' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Phổ thông</div>
                        <div className="text-primary-600 font-bold mt-1">
                          {formatCurrency(flight.price.economy)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Còn {flight.remainingSeats.economy} chỗ
                        </div>
                      </div>
                      
                      <div
                        onClick={() => handleClassSelection('premium')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedClass === 'premium' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Phổ thông đặc biệt</div>
                        <div className="text-primary-600 font-bold mt-1">
                          {formatCurrency(flight.price.premium)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Còn {flight.remainingSeats.premium} chỗ
                        </div>
                      </div>
                      
                      <div
                        onClick={() => handleClassSelection('business')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedClass === 'business' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Thương gia</div>
                        <div className="text-primary-600 font-bold mt-1">
                          {formatCurrency(flight.price.business)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Còn {flight.remainingSeats.business} chỗ
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chọn hành lý */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">Tùy chọn hành lý</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => setLuggageOption('standard')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          luggageOption === 'standard' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Tiêu chuẩn</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {flight.baggageAllowance.cabin} xách tay + {flight.baggageAllowance.checked} ký gửi
                        </div>
                        <div className="text-primary-600 font-medium mt-1">
                          Miễn phí
                        </div>
                      </div>
                      
                      <div
                        onClick={() => setLuggageOption('extra')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          luggageOption === 'extra' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Thêm hành lý</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Thêm 10kg hành lý ký gửi
                        </div>
                        <div className="text-primary-600 font-medium mt-1">
                          + {formatCurrency(200000)}
                        </div>
                      </div>
                      
                      <div
                        onClick={() => setLuggageOption('premium')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          luggageOption === 'premium' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">Gói cao cấp</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Thêm 20kg hành lý + ưu tiên làm thủ tục
                        </div>
                        <div className="text-primary-600 font-medium mt-1">
                          + {formatCurrency(500000)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chọn ghế */}
                  <div>
                    <h3 className="font-bold mb-3">Chọn ghế (tùy chọn)</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-4 text-center text-sm text-gray-500">
                        Chọn {passengers} ghế • Đã chọn: {selectedSeats.join(', ') || 'Chưa chọn'}
                      </div>
                      
                      <div className="mb-4 flex justify-center">
                        <div className="inline-flex items-center mr-4">
                          <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                          <span className="text-sm">Đã đặt</span>
                        </div>
                        <div className="inline-flex items-center mr-4">
                          <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
                          <span className="text-sm">Còn trống</span>
                        </div>
                        <div className="inline-flex items-center">
                          <div className="w-4 h-4 bg-primary-500 mr-2"></div>
                          <span className="text-sm">Đã chọn</span>
                        </div>
                      </div>
                      
                      <div className="relative mb-4">
                        <div className="w-full h-16 bg-gray-300 rounded-t-xl flex items-center justify-center">
                          <span className="font-medium text-gray-700">Buồng lái</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-2 mb-8">
                        {seatOptions.map((seat) => (
                          <div 
                            key={seat.id}
                            onClick={() => seat.available && handleSeatSelection(seat.id)}
                            className={`h-10 flex items-center justify-center rounded cursor-pointer ${
                              !seat.available 
                                ? 'bg-gray-200 cursor-not-allowed' 
                                : selectedSeats.includes(seat.id)
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white border border-gray-300 hover:border-primary-400'
                            }`}
                          >
                            {seat.id}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Booking Summary */}
            <div>
              <div className="bg-white rounded-xl shadow-soft overflow-hidden sticky top-24">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Tóm tắt đặt vé</h2>
                  
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Hãng hàng không:</span>
                      <span className="font-medium">{flight.airline}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Chuyến bay:</span>
                      <span className="font-medium">{flight.flightNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Ngày bay:</span>
                      <span className="font-medium">{formatDate(flight.departureTime)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Thời gian:</span>
                      <span className="font-medium">
                        {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Hạng vé:</span>
                      <span className="font-medium">
                        {selectedClass === 'economy' ? 'Phổ thông' : selectedClass === 'premium' ? 'Phổ thông đặc biệt' : 'Thương gia'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
                      Số hành khách
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUsers className="text-gray-400" />
                      </div>
                      <select
                        id="passengers"
                        value={passengers}
                        onChange={(e) => {
                          setPassengers(Number(e.target.value));
                          setSelectedSeats([]);
                        }}
                        className="input pl-10"
                      >
                        {[...Array(6)].map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1} hành khách
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between py-2">
                      <span>Giá vé ({passengers} x {formatCurrency(flight.price[selectedClass])})</span>
                      <span>{formatCurrency(flight.price[selectedClass] * passengers)}</span>
                    </div>
                    
                    {luggageOption !== 'standard' && (
                      <div className="flex justify-between py-2">
                        <span>Hành lý thêm</span>
                        <span>{formatCurrency(luggageOption === 'extra' ? 200000 * passengers : 500000 * passengers)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-2">
                      <span>Thuế và phí</span>
                      <span>{formatCurrency(calculateTotalPrice() * 0.1)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-primary-600">{formatCurrency(calculateTotalPrice() * 1.1)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleBooking}
                    className="btn btn-primary w-full py-3"
                  >
                    Đặt vé
                  </button>
                  
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    <FiCheck className="inline-block mr-1" />
                    Đảm bảo hoàn tiền 100% nếu chuyến bay bị hủy
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

export default FlightDetailsPage; 