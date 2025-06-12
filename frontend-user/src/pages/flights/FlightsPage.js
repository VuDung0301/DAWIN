import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiUsers, FiArrowRight, FiFilter, FiSearch, FiChevronDown, FiClock, FiDollarSign } from 'react-icons/fi';

const FlightsPage = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    flightClass: 'all',
    priceRange: '',
    airlines: [],
    departureTime: '',
    stopover: '',
    sort: 'price',
  });
  
  // State cho các đường bay phổ biến
  const [popularRoutes] = useState([
    { origin: 'Hà Nội', destination: 'Hồ Chí Minh', price: 1200000 },
    { origin: 'Hà Nội', destination: 'Đà Nẵng', price: 850000 },
    { origin: 'Hồ Chí Minh', destination: 'Phú Quốc', price: 950000 },
    { origin: 'Hồ Chí Minh', destination: 'Nha Trang', price: 750000 },
    { origin: 'Đà Nẵng', destination: 'Hà Nội', price: 870000 },
  ]);
  
  // Danh sách hãng hàng không
  const airlines = [
    { id: 'vna', name: 'Vietnam Airlines' },
    { id: 'vja', name: 'Vietjet Air' },
    { id: 'bba', name: 'Bamboo Airways' },
    { id: 'pac', name: 'Pacific Airlines' },
  ];
  
  // Dữ liệu chuyến bay mẫu
  const allFlights = [
            {
              id: 'VN123',
              airline: 'Vietnam Airlines',
              airlineCode: 'VNA',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T08:00:00',
              arrivalTime: '2023-06-15T10:10:00',
              duration: '2h 10m',
              price: 1200000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 12,
            },
            {
              id: 'VJ456',
              airline: 'Vietjet Air',
              airlineCode: 'VJA',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T10:30:00',
              arrivalTime: '2023-06-15T12:45:00',
              duration: '2h 15m',
              price: 850000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 25,
            },
            {
              id: 'BBA789',
              airline: 'Bamboo Airways',
              airlineCode: 'BBA',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T13:15:00',
              arrivalTime: '2023-06-15T15:20:00',
              duration: '2h 5m',
              price: 1100000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 18,
            },
            {
              id: 'VN234',
              airline: 'Vietnam Airlines',
              airlineCode: 'VNA',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T16:45:00',
              arrivalTime: '2023-06-15T18:55:00',
              duration: '2h 10m',
              price: 1350000,
              class: 'business',
              stopover: 0,
              remainingSeats: 5,
            },
            {
              id: 'VJ567',
              airline: 'Vietjet Air',
              airlineCode: 'VJA',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T19:30:00',
              arrivalTime: '2023-06-15T21:40:00',
              duration: '2h 10m',
              price: 950000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 30,
            },
            {
              id: 'PAC123',
              airline: 'Pacific Airlines',
              airlineCode: 'PAC',
              origin: 'Hà Nội',
              destination: 'Hồ Chí Minh',
              departureTime: '2023-06-15T05:45:00',
              arrivalTime: '2023-06-15T08:00:00',
              duration: '2h 15m',
              price: 800000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 22,
            },
            {
              id: 'VN345',
              airline: 'Vietnam Airlines',
              airlineCode: 'VNA',
              origin: 'Hồ Chí Minh',
              destination: 'Phú Quốc',
              departureTime: '2023-06-16T07:30:00',
              arrivalTime: '2023-06-16T08:30:00',
              duration: '1h 0m',
              price: 950000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 15,
            },
            {
              id: 'BBA456',
              airline: 'Bamboo Airways',
              airlineCode: 'BBA',
              origin: 'Hồ Chí Minh',
              destination: 'Nha Trang',
              departureTime: '2023-06-16T14:20:00',
              arrivalTime: '2023-06-16T15:35:00',
              duration: '1h 15m',
              price: 750000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 28,
            },
            {
              id: 'VJ789',
              airline: 'Vietjet Air',
              airlineCode: 'VJA',
              origin: 'Đà Nẵng',
              destination: 'Hà Nội',
              departureTime: '2023-06-17T11:45:00',
              arrivalTime: '2023-06-17T13:05:00',
              duration: '1h 20m',
              price: 870000,
              class: 'economy',
              stopover: 0,
              remainingSeats: 20,
            },
          ];

  // Logic lọc chuyến bay
  const getFilteredFlights = () => {
    let filtered = [...allFlights];

    // Lọc theo điểm đi
    if (filters.origin) {
      filtered = filtered.filter(flight =>
        flight.origin.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    // Lọc theo điểm đến
    if (filters.destination) {
      filtered = filtered.filter(flight =>
        flight.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    // Lọc theo ngày khởi hành
    if (filters.departureDate) {
      filtered = filtered.filter(flight => {
        const flightDate = new Date(flight.departureTime).toISOString().split('T')[0];
        return flightDate === filters.departureDate;
      });
    }

    // Lọc theo hãng hàng không
    if (filters.airlines.length > 0) {
      filtered = filtered.filter(flight =>
        filters.airlines.includes(flight.airlineCode.toLowerCase())
      );
    }

    // Lọc theo khoảng giá
    if (filters.priceRange) {
      if (filters.priceRange === '0-1000000') {
        filtered = filtered.filter(flight => flight.price < 1000000);
      } else if (filters.priceRange === '1000000-2000000') {
        filtered = filtered.filter(flight => flight.price >= 1000000 && flight.price <= 2000000);
      } else if (filters.priceRange === '2000000+') {
        filtered = filtered.filter(flight => flight.price > 2000000);
      }
    }

    // Lọc theo thời gian khởi hành
    if (filters.departureTime) {
      filtered = filtered.filter(flight => {
        const hour = new Date(flight.departureTime).getHours();
        if (filters.departureTime === 'morning') {
          return hour >= 0 && hour < 12;
        } else if (filters.departureTime === 'afternoon') {
          return hour >= 12 && hour < 18;
        } else if (filters.departureTime === 'evening') {
          return hour >= 18 && hour < 24;
        }
        return true;
      });
    }

    // Lọc theo hạng vé
    if (filters.flightClass !== 'all') {
      filtered = filtered.filter(flight => flight.class === filters.flightClass);
    }

    // Lọc theo điểm dừng
    if (filters.stopover !== '') {
      filtered = filtered.filter(flight => flight.stopover === parseInt(filters.stopover));
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration.localeCompare(b.duration);
        case 'departure':
          return new Date(a.departureTime) - new Date(b.departureTime);
        case 'arrival':
          return new Date(a.arrivalTime) - new Date(b.arrivalTime);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Đếm số bộ lọc đang active
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.origin) count++;
    if (filters.destination) count++;
    if (filters.departureDate) count++;
    if (filters.airlines.length > 0) count++;
    if (filters.priceRange) count++;
    if (filters.departureTime) count++;
    if (filters.stopover) count++;
    if (filters.flightClass !== 'all') count++;
    return count;
  };

  // Load dữ liệu chuyến bay
  useEffect(() => {
    setLoading(true);
    
    // Giả lập loading
    const timer = setTimeout(() => {
      const filteredFlights = getFilteredFlights();
      setFlights(filteredFlights);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Xử lý thay đổi filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi hãng hàng không (checkboxes)
  const handleAirlineChange = (airlineId) => {
    setFilters((prev) => {
      const newAirlines = prev.airlines.includes(airlineId)
        ? prev.airlines.filter(a => a !== airlineId)
        : [...prev.airlines, airlineId];
      
      return { ...prev, airlines: newAirlines };
    });
  };

  // Xử lý reset filter
  const handleResetFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      departureDate: '',
      returnDate: '',
      passengers: 1,
      flightClass: 'all',
      priceRange: '',
      airlines: [],
      departureTime: '',
      stopover: '',
      sort: 'price',
    });
  };
  
  // Format giá tiền
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
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="container">
        {/* Header */}
        <div className="pt-8 pb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Vé máy bay</h1>
          <p className="text-gray-600 max-w-2xl mx-auto md:mx-0">
            Tìm và đặt vé máy bay giá rẻ cho chuyến đi của bạn. Đa dạng lựa chọn từ nhiều hãng hàng không uy tín.
          </p>
        </div>

        {/* Đường bay phổ biến */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Đường bay phổ biến</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {popularRoutes.map((route, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setFilters(prev => ({ ...prev, origin: route.origin, destination: route.destination }))}
                className="bg-white rounded-lg shadow-soft p-4 cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium">{route.origin}</div>
                  <FiArrowRight className="text-gray-400" />
                  <div className="font-medium">{route.destination}</div>
                </div>
                <div className="text-primary-600 font-bold">
                  Từ {formatCurrency(route.price)}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-soft mb-8 overflow-hidden">
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Tìm kiếm chuyến bay</h2>
              <button
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className="flex items-center text-primary-600 font-medium relative"
              >
                <FiFilter className="mr-2" />
                <span>Bộ lọc</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ml-2">
                    {getActiveFiltersCount()}
                  </span>
                )}
                <FiChevronDown className={`ml-1 transform transition-transform ${isFilterVisible ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* Basic Search */}
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="origin"
                    value={filters.origin}
                    onChange={handleFilterChange}
                    placeholder="Điểm đi"
                    className="input pl-10"
                  />
                </div>
                
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="destination"
                    value={filters.destination}
                    onChange={handleFilterChange}
                    placeholder="Điểm đến"
                    className="input pl-10"
                  />
                </div>
                
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="departureDate"
                    value={filters.departureDate}
                    onChange={handleFilterChange}
                    className="input pl-10"
                    placeholder="Ngày đi"
                  />
                </div>
                
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="passengers"
                    value={filters.passengers}
                    onChange={handleFilterChange}
                    className="input pl-10"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} hành khách
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        const filteredFlights = getFilteredFlights();
                        setFlights(filteredFlights);
                        setLoading(false);
                      }, 500);
                    }}
                    className="btn btn-primary flex items-center justify-center w-full"
                  >
                    <FiSearch className="mr-2" />
                    <span>Tìm chuyến bay</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Advanced Filters */}
            {isFilterVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Hạng vé</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="class-all"
                          name="flightClass"
                          value="all"
                          checked={filters.flightClass === 'all'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="class-all" className="ml-2 text-gray-700">
                          Tất cả hạng
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="class-economy"
                          name="flightClass"
                          value="economy"
                          checked={filters.flightClass === 'economy'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="class-economy" className="ml-2 text-gray-700">
                          Phổ thông
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="class-business"
                          name="flightClass"
                          value="business"
                          checked={filters.flightClass === 'business'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="class-business" className="ml-2 text-gray-700">
                          Thương gia
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Hãng hàng không</h3>
                    <div className="space-y-2">
                      {airlines.map((airline) => (
                        <div key={airline.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`airline-${airline.id}`}
                            checked={filters.airlines.includes(airline.id)}
                            onChange={() => handleAirlineChange(airline.id)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <label htmlFor={`airline-${airline.id}`} className="ml-2 text-gray-700">
                            {airline.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Khoảng giá</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="price-any"
                          name="priceRange"
                          value=""
                          checked={filters.priceRange === ''}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="price-any" className="ml-2 text-gray-700">
                          Tất cả mức giá
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="price-1"
                          name="priceRange"
                          value="0-1000000"
                          checked={filters.priceRange === '0-1000000'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="price-1" className="ml-2 text-gray-700">
                          Dưới 1,000,000đ
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="price-2"
                          name="priceRange"
                          value="1000000-2000000"
                          checked={filters.priceRange === '1000000-2000000'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="price-2" className="ml-2 text-gray-700">
                          1,000,000đ - 2,000,000đ
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="price-3"
                          name="priceRange"
                          value="2000000+"
                          checked={filters.priceRange === '2000000+'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="price-3" className="ml-2 text-gray-700">
                          Trên 2,000,000đ
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Thời gian khởi hành</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="time-any"
                          name="departureTime"
                          value=""
                          checked={filters.departureTime === ''}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="time-any" className="ml-2 text-gray-700">
                          Bất kỳ thời gian
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="time-morning"
                          name="departureTime"
                          value="morning"
                          checked={filters.departureTime === 'morning'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="time-morning" className="ml-2 text-gray-700">
                          Sáng (00:00 - 12:00)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="time-afternoon"
                          name="departureTime"
                          value="afternoon"
                          checked={filters.departureTime === 'afternoon'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="time-afternoon" className="ml-2 text-gray-700">
                          Chiều (12:00 - 18:00)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="time-evening"
                          name="departureTime"
                          value="evening"
                          checked={filters.departureTime === 'evening'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="time-evening" className="ml-2 text-gray-700">
                          Tối (18:00 - 24:00)
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Điểm dừng</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="stopover-any"
                          name="stopover"
                          value=""
                          checked={filters.stopover === ''}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="stopover-any" className="ml-2 text-gray-700">
                          Tất cả
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="stopover-direct"
                          name="stopover"
                          value="0"
                          checked={filters.stopover === '0'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="stopover-direct" className="ml-2 text-gray-700">
                          Bay thẳng
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="stopover-1"
                          name="stopover"
                          value="1"
                          checked={filters.stopover === '1'}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-primary-600"
                        />
                        <label htmlFor="stopover-1" className="ml-2 text-gray-700">
                          1 điểm dừng
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-outline mr-2"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        const filteredFlights = getFilteredFlights();
                        setFlights(filteredFlights);
                        setLoading(false);
                        setIsFilterVisible(false);
                      }, 500);
                    }}
                    className="btn btn-primary"
                  >
                    Áp dụng
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Results */}
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Hiển thị <span className="font-medium">{flights.length}</span> chuyến bay
              </p>
              
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">Sắp xếp theo:</span>
                <select
                  className="input py-1 px-3 border-gray-300"
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="price">Giá thấp nhất</option>
                  <option value="duration">Thời gian bay ngắn nhất</option>
                  <option value="departure">Giờ khởi hành sớm nhất</option>
                  <option value="arrival">Giờ đến sớm nhất</option>
                </select>
              </div>
            </div>
            
            {/* Flights List */}
            {loading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-soft animate-pulse">
                    <div className="p-6">
                      <div className="flex justify-between mb-6">
                        <div className="h-8 bg-gray-200 w-24 rounded"></div>
                        <div className="h-8 bg-gray-200 w-24 rounded"></div>
                      </div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="h-12 bg-gray-200 w-1/4 rounded"></div>
                        <div className="h-6 bg-gray-200 w-1/5 rounded"></div>
                        <div className="h-12 bg-gray-200 w-1/4 rounded"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-8 bg-gray-200 w-32 rounded"></div>
                        <div className="h-10 bg-gray-200 w-32 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : flights.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {flights.map((flight) => (
                  <motion.div 
                    key={flight.id} 
                    variants={fadeInUp}
                    className="bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="font-bold text-primary-600">{flight.airlineCode}</span>
                          </div>
                          <div>
                            <div className="font-medium">{flight.airline}</div>
                            <div className="text-sm text-gray-500">{flight.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {flight.stopover === 0 ? 'Bay thẳng' : `${flight.stopover} điểm dừng`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Còn {flight.remainingSeats} chỗ
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-center">
                          <div className="text-xl font-bold">{formatTime(flight.departureTime)}</div>
                          <div className="text-sm text-gray-500">{formatDate(flight.departureTime)}</div>
                          <div className="font-medium">{flight.origin}</div>
                        </div>
                        
                        <div className="flex-1 px-8 relative">
                          <div className="border-t border-gray-300 w-full absolute top-1/2 left-0"></div>
                          <div className="text-center relative">
                            <span className="bg-white px-2 text-sm text-gray-500">{flight.duration}</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold">{formatTime(flight.arrivalTime)}</div>
                          <div className="text-sm text-gray-500">{formatDate(flight.arrivalTime)}</div>
                          <div className="font-medium">{flight.destination}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg text-primary-600">
                            {formatCurrency(flight.price)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {flight.class === 'economy' ? 'Phổ thông' : 'Thương gia'}
                          </div>
                        </div>
                        
                        <Link 
                          to={`/flights/${flight.id}`}
                          className="btn btn-primary"
                        >
                          Chọn
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-8 text-center shadow-soft"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiClock className="text-primary-600 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Không tìm thấy chuyến bay</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Không có chuyến bay nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử điều chỉnh bộ lọc hoặc thay đổi ngày bay.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResetFilters}
                    className="btn btn-outline"
                  >
                    Đặt lại bộ lọc
                  </button>
                  <button
                    onClick={() => setIsFilterVisible(true)}
                    className="btn btn-primary"
                  >
                    Điều chỉnh bộ lọc
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlightsPage; 