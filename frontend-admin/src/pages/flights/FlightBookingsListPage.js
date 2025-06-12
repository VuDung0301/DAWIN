import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaCheckCircle, FaTimesCircle, FaDownload, FaPrint } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { flightBookingsAPI } from '../../services/api';

const FlightBookingsListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    flightId: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, searchTerm, filters]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        keyword: searchTerm,
        ...filters
      };
      
      // Lọc bỏ các params trống
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      console.log('Gọi API danh sách đặt vé máy bay (admin):', params);
      const response = await flightBookingsAPI.getAll(params);
      
      if (response.status === 'success') {
        console.log('Dữ liệu đặt vé máy bay:', response.data);
        setBookings(response.data);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          pages: Math.ceil(response.total / (response.limit || 10)) || 1
        });
      }
    } catch (error) {
      console.error('Error fetching flight bookings:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleUpdateStatus = async (id, newStatus) => {
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'confirmed' ? 'xác nhận' : 'hủy'} đơn đặt vé này không?`)) {
      try {
        let response;
        if (newStatus === 'confirmed') {
          response = await flightBookingsAPI.confirmBooking(id);
        } else if (newStatus === 'cancelled') {
          response = await flightBookingsAPI.cancelBooking(id);
        } else {
          response = await flightBookingsAPI.updateStatus(id, newStatus);
        }
        
        if (response.status === 'success') {
          alert('Cập nhật trạng thái thành công!');
          fetchBookings();
        } else {
          alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Update booking status error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExportExcel = () => {
    alert('Chức năng xuất Excel sẽ được phát triển sau.');
  };

  const getSeatClassName = (seatClass) => {
    switch (seatClass) {
      case 'economy': return 'Phổ thông';
      case 'business': return 'Thương gia';
      case 'firstClass': return 'Hạng nhất';
      default: return seatClass || 'N/A';
    }
  };

  const getStatusName = (status) => {
    if (!status) return 'pending';
    
    switch (status) {
      case 'Đang xử lý': return 'pending';
      case 'Đã xác nhận': return 'confirmed';
      case 'Đã hủy': return 'cancelled';
      case 'Hoàn thành': return 'completed';
      default: return status;
    }
  };

  const columns = [
    {
      key: 'bookingReference',
      label: 'Mã đơn',
      sortable: true,
      render: (item) => item.bookingNumber || `ID: ${item._id?.substring(0, 8) || 'N/A'}`
    },
    {
      key: 'user',
      label: 'Khách hàng',
      render: (item) => {
        if (!item.user) return item.contactInfo?.fullName || 'N/A';
        return item.user.name || item.contactInfo?.fullName || 'N/A';
      }
    },
    {
      key: 'flight',
      label: 'Chuyến bay',
      render: (item) => item.flight ? `${item.flight.flightNumber} (${item.flight.airline})` : 'N/A'
    },
    {
      key: 'route',
      label: 'Tuyến bay',
      render: (item) => item.flight ? `${item.flight.departureCity} - ${item.flight.arrivalCity}` : 'N/A'
    },
    {
      key: 'departureTime',
      label: 'Khởi hành',
      render: (item) => item.flight ? formatDate(item.flight.departureTime) : 'N/A'
    },
    {
      key: 'passengerCount',
      label: 'Số hành khách',
      render: (item) => Array.isArray(item.passengers) ? item.passengers.length : (item.numOfPassengers || 0)
    },
    {
      key: 'seatClass',
      label: 'Hạng ghế',
      render: (item) => getSeatClassName(item.seatClass)
    },
    {
      key: 'totalPrice',
      label: 'Tổng tiền',
      type: 'price',
      sortable: true,
      render: (item) => formatPrice(item.totalPrice || 0)
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      render: (item) => {
        const paymentStatus = item.paymentStatus || 'pending';
        let statusText = 'Chưa thanh toán';
        let cssClass = 'bg-yellow-100 text-yellow-800';
        
        if (paymentStatus === 'paid') {
          statusText = 'Đã thanh toán';
          cssClass = 'bg-green-100 text-green-800';
        } else if (paymentStatus === 'failed') {
          statusText = 'Thanh toán thất bại';
          cssClass = 'bg-red-100 text-red-800';
        } else if (paymentStatus === 'refunded') {
          statusText = 'Đã hoàn tiền';
          cssClass = 'bg-blue-100 text-blue-800';
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cssClass}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'status',
      render: (item) => {
        const status = item.status || 'pending';
        return (
          <StatusBadge 
            status={getStatusName(status)} 
            type="booking" 
          />
        );
      }
    },
    {
      key: 'bookingDate',
      label: 'Ngày đặt',
      sortable: true,
      render: (item) => formatDate(item.bookingDate || item.createdAt)
    },
    {
      key: 'actions',
      label: 'Thao tác',
      type: 'actions',
      actions: [
        {
          icon: <FaEye />,
          label: 'Xem chi tiết',
          component: (item) => (
            <Link to={`/flight-bookings/${item._id}`} className="flex items-center text-blue-600 hover:text-blue-800">
              <FaEye className="mr-1" /> Xem
            </Link>
          ),
          className: 'text-blue-600 hover:text-blue-800'
        },
        {
          icon: <FaCheckCircle />,
          label: 'Xác nhận',
          onClick: (item) => handleUpdateStatus(item._id, 'confirmed'),
          className: 'text-green-600 hover:text-green-800',
          hidden: (item) => item.status !== 'pending' && item.status !== 'Đang xử lý'
        },
        {
          icon: <FaTimesCircle />,
          label: 'Hủy đơn',
          onClick: (item) => handleUpdateStatus(item._id, 'cancelled'),
          className: 'text-red-600 hover:text-red-800',
          hidden: (item) => {
            const status = item.status;
            return status === 'cancelled' || status === 'Đã hủy' || 
                  status === 'completed' || status === 'Hoàn thành';
          }
        },
        {
          icon: <FaDownload />,
          label: 'Tải PDF',
          onClick: (item) => alert(`Tải PDF cho booking ${item.bookingNumber || item._id}`),
          className: 'text-indigo-600 hover:text-indigo-800'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đặt vé máy bay</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center"
            >
              <FaDownload className="mr-2" /> Xuất Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
            >
              <FaPrint className="mr-2" /> In danh sách
            </button>
          </div>
        </div>
        
        {/* Bộ lọc */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    status: '',
                    fromDate: '',
                    toDate: '',
                    flightId: ''
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            searchPlaceholder="Tìm kiếm theo mã đơn, tên khách hàng..."
          />
        </div>
      </div>
    </Layout>
  );
};

export default FlightBookingsListPage; 