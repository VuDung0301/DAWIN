import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import { flightsAPI } from '../../services/api';
import { format } from 'date-fns';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

const FlightsListPage = () => {
  const [flights, setFlights] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    airline: '',
    departureCity: '',
    arrivalCity: ''
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'domestic', or 'international'
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlights();
  }, [pagination.page, searchTerm, filters, activeTab]);

  const fetchFlights = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Thêm từ khóa tìm kiếm nếu có
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Thêm bộ lọc hãng bay nếu có
      if (filters.airline && filters.airline.trim()) {
        params.airline = filters.airline;
      }

      // Thêm bộ lọc thành phố khởi hành nếu có
      if (filters.departureCity && filters.departureCity.trim()) {
        params.departureCity = filters.departureCity;
      }

      // Thêm bộ lọc thành phố đến nếu có
      if (filters.arrivalCity && filters.arrivalCity.trim()) {
        params.arrivalCity = filters.arrivalCity;
      }
      
      console.log('API Params:', params);
      console.log('Active Tab:', activeTab);
      
      let response;
      
      // Gọi API dựa vào tab đang active
      switch (activeTab) {
        case 'domestic':
          response = await flightsAPI.getDomestic(params);
          break;
        case 'international':
          response = await flightsAPI.getInternational(params);
          break;
        default: // 'all'
          response = await flightsAPI.getAll(params);
          break;
      }
      
      console.log('API Response:', response);
      
      if (response && response.success) {
        // Xử lý dữ liệu trả về từ API
        const flightData = Array.isArray(response.data) ? response.data : [];
        
        // Chuyển đổi dữ liệu thành định dạng phù hợp cho hiển thị
        const formattedFlights = flightData.map(flight => ({
          id: flight._id || flight.id || '',
          flightNumber: flight.flightNumber || '',
          flightIata: flight.flightNumber || '',
          flightStatus: flight.status || 'Đúng giờ',
          airline: flight.airline || '',
          airlineIata: flight.flightNumber?.substring(0, 2) || '',
          departureAirport: flight.departureAirport || `${flight.departureCity} Airport` || '',
          departureIata: flight.departureCity?.substring(0, 3)?.toUpperCase() || '',
          departureCity: flight.departureCity || '',
          departureTime: flight.departureTime || null,
          departureTerminal: flight.departureTerminal || 'T1',
          departureGate: flight.departureGate || '',
          arrivalAirport: flight.arrivalAirport || `${flight.arrivalCity} Airport` || '',
          arrivalIata: flight.arrivalCity?.substring(0, 3)?.toUpperCase() || '',
          arrivalCity: flight.arrivalCity || '',
          arrivalTime: flight.arrivalTime || null,
          arrivalTerminal: flight.arrivalTerminal || 'T1',
          arrivalGate: flight.arrivalGate || '',
          status: flight.status || 'Đúng giờ',
          delay: flight.delay || 0,
          aircraft: flight.aircraft || '',
          active: flight.active !== false,
          date: flight.departureTime ? new Date(flight.departureTime).toISOString().split('T')[0] : '',
          price: flight.price || {},
          duration: flight.duration || 0,
          features: flight.features || {},
          isDomestic: flight.isDomestic !== false,
          image: flight.image || ''
        }));
        
        console.log('Formatted Flights:', formattedFlights);
        setFlights(formattedFlights);
        
        // Cập nhật phân trang từ response
        if (response.pagination) {
          setPagination({
            page: response.pagination.page || 1,
            limit: response.pagination.limit || 10,
            total: response.pagination.total || 0,
            pages: response.pagination.pages || 1
          });
        } else {
          // Fallback nếu không có pagination info
          setPagination(prev => ({
            ...prev,
            total: flightData.length
          }));
        }
      } else {
        console.error('Lỗi API hoặc không có dữ liệu:', response?.message || 'Unknown error');
        setFlights([]);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
      setFlights([]);
      toast.error('Có lỗi xảy ra khi tải danh sách chuyến bay');
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm trích xuất tên thành phố từ tên sân bay
  const extractCity = (airportName) => {
    if (!airportName) return '';
    // Trích xuất phần đầu tiên của tên sân bay là thành phố
    return airportName.split(' ')[0];
  };

  // Hàm chuyển đổi trạng thái chuyến bay thành tiếng Việt
  const mapFlightStatus = (status) => {
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

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteFlight = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyến bay này không?')) {
      try {
        const response = await flightsAPI.delete(id);
        if (response.success) {
          fetchFlights();
        } else {
          alert('Không thể xóa chuyến bay. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Delete flight error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'HH:mm dd/MM/yyyy');
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const columns = [
    {
      key: 'flightNumber',
      label: 'Mã chuyến bay',
      sortable: true,
      render: (flight) => (
        <Link 
          to={`/flights/${flight.id}`} 
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          {flight.flightNumber || flight.flight?.iata || "N/A"}
        </Link>
      )
    },
    {
      key: 'airline',
      label: 'Hãng bay',
      sortable: true,
      render: (flight) => {
        const airlineName = flight.airline?.name || flight.airline || 'N/A';
        const airlineIata = flight.airline?.iata || '';
        return (
          <div className="flex items-center">
            {flight.airline?.logo ? (
              <img 
                src={flight.airline.logo} 
                alt={airlineName} 
                className="w-8 h-8 mr-2 rounded-full"
              />
            ) : null}
            <span>{airlineName} {airlineIata ? `(${airlineIata})` : ''}</span>
          </div>
        );
      }
    },
    {
      key: 'route',
      label: 'Hành trình',
      sortable: true,
      render: (flight) => {
        return (
          <div className="flex items-center">
            <div className="text-center">
              <div className="font-medium">{flight.departureIata}</div>
              <div className="text-xs text-gray-500">{flight.departureCity}</div>
            </div>
            <div className="mx-2 text-gray-400">→</div>
            <div className="text-center">
              <div className="font-medium">{flight.arrivalIata}</div>
              <div className="text-xs text-gray-500">{flight.arrivalCity}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'scheduledTime',
      label: 'Thời gian',
      sortable: true,
      render: (flight) => {
        // Format thời gian theo định dạng giờ:phút
        const formatTime = (timeStr) => {
          if (!timeStr || timeStr === 'N/A') return 'N/A';
          try {
            const date = new Date(timeStr);
            return date.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          } catch (error) {
            return timeStr;
          }
        };
        
        return (
          <div>
            <div className="font-medium">{formatTime(flight.departureTime)}</div>
            <div className="text-gray-500">{formatTime(flight.arrivalTime)}</div>
          </div>
        );
      }
    },
    {
      key: 'date',
      label: 'Ngày bay',
      sortable: true,
      render: (flight) => {
        if (!flight.departureTime) return 'N/A';
        
        try {
          const date = new Date(flight.departureTime);
          return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch (error) {
          return 'N/A';
        }
      }
    },
    {
      key: 'duration',
      label: 'Thời gian bay',
      sortable: true,
      render: (flight) => {
        const duration = flight.duration || 0;
        
        if (duration <= 0) return 'N/A';
        
        // Chuyển đổi thời gian bay (phút) thành giờ và phút
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        return (
          <div className="text-center">
            {hours > 0 ? `${hours}h` : ''} {minutes > 0 ? `${minutes}m` : ''}
          </div>
        );
      }
    },
    {
      key: 'price',
      label: 'Giá vé',
      type: 'price',
      sortable: true,
      render: (flight) => {
        const economyPrice = flight.price?.economy || 0;
        const businessPrice = flight.price?.business || 0;
        const firstClassPrice = flight.price?.firstClass || 0;
        
        // Format giá tiền theo định dạng VND
        const formatPrice = (price) => {
          if (!price) return 'Không có';
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(price);
        };
        
        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 w-20">Economy:</span>
              <span className="font-medium">{formatPrice(economyPrice)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 w-20">Business:</span>
              <span className="font-medium">{formatPrice(businessPrice)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 w-20">First Class:</span>
              <span className="font-medium">{formatPrice(firstClassPrice)}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'status',
      statusType: 'flight',
      sortable: true,
      render: (flight) => {
        const status = flight.status || flight.flightStatus || 'unknown';
        return <StatusBadge status={status} type="flight" />;
      }
    },
    {
      key: 'actions',
      label: 'Thao tác',
      type: 'actions',
      actions: [
        {
          label: 'Xem chi tiết',
          icon: <FaEye />,
          className: 'text-blue-600 hover:text-blue-800',
          onClick: (flight) => navigate(`/flights/${flight.id}`)
        },
        {
          label: 'Sửa',
          icon: <FaEdit />,
          className: 'text-yellow-600 hover:text-yellow-800',
          onClick: (flight) => navigate(`/flights/edit/${flight.id}`)
        },
        {
          label: 'Xóa',
          icon: <FaTrash />,
          className: 'text-red-600 hover:text-red-800',
          onClick: (flight) => handleDeleteFlight(flight.id)
        },
      ],
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Quản lý chuyến bay</h1>
          <Link
            to="/flights/add"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> Thêm chuyến bay
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => handleTabChange('all')}
                >
                  Tất cả
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'domestic' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => handleTabChange('domestic')}
                >
                  Nội địa
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'international' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => handleTabChange('international')}
                >
                  Quốc tế
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="border rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  name="airline"
                  value={filters.airline}
                  onChange={handleFilterChange}
                  className="border rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả hãng bay</option>
                  <option value="Vietnam Airlines">Vietnam Airlines</option>
                  <option value="Vietjet Air">Vietjet Air</option>
                  <option value="Bamboo Airways">Bamboo Airways</option>
                  <option value="Pacific Airlines">Pacific Airlines</option>
                  <option value="VNA">VNA</option>
                  <option value="VJ">VJ</option>
                  <option value="QH">QH</option>
                  <option value="BL">BL</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ airline: '', departureCity: '', arrivalCity: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
          
          {/* Hiển thị thông báo khi không có dữ liệu */}
          {flights.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-500 bg-gray-50">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy chuyến bay</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filters.airline ? 
                  'Không có chuyến bay phù hợp với tiêu chí tìm kiếm của bạn.' : 
                  'Hiện tại chưa có dữ liệu chuyến bay nào.'
                }
              </p>
              {(searchTerm || filters.airline) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ airline: '', departureCity: '', arrivalCity: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
          
          <DataTable
            columns={columns}
            data={flights}
            isLoading={isLoading}
            pagination={{
              totalItems: pagination.total,
              itemsPerPage: pagination.limit,
              currentPage: pagination.page,
              onPageChange: handlePageChange,
              totalPages: pagination.pages
            }}
            emptyMessage="Không tìm thấy chuyến bay nào"
          />
        </div>
      </div>
    </Layout>
  );
};

export default FlightsListPage; 