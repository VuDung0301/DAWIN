import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaCheckCircle, FaTimesCircle, FaDownload } from 'react-icons/fa';
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
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: ''
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
      
      const response = await flightBookingsAPI.getAll(params);
      
      if (response.success) {
        setBookings(response.data);
        setPagination({
          page: response.currentPage || 1,
          limit: pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu đặt vé máy bay:', error);
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
          fetchBookings();
        } else {
          alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const handleUpdatePaymentStatus = async (id, newStatus) => {
    const confirmMessage = `Bạn có chắc chắn muốn đánh dấu đơn này là "${newStatus === 'paid' ? 'đã thanh toán' : 'chưa thanh toán'}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await flightBookingsAPI.updatePaymentStatus(id, { paymentStatus: newStatus });
        if (response.success) {
          alert('Cập nhật trạng thái thanh toán thành công');
          fetchBookings();
        } else {
          alert('Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt vé này? Hành động này không thể hoàn tác.')) {
      try {
        const response = await flightBookingsAPI.delete(id);
        if (response.success) {
          alert('Xóa đơn đặt vé thành công');
          fetchBookings();
        } else {
          alert('Không thể xóa đơn đặt vé. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Lỗi khi xóa đơn đặt vé:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const columns = [
    {
      key: 'bookingReference',
      label: 'Mã đặt vé',
      sortable: true
    },
    {
      key: 'user',
      label: 'Khách hàng',
      render: (item) => item.user ? `${item.user.name}` : 'N/A'
    },
    {
      key: 'flight',
      label: 'Chuyến bay',
      render: (item) => item.flight ? `${item.flight.airline} - ${item.flight.flightNumber}` : 'N/A'
    },
    {
      key: 'route',
      label: 'Tuyến bay',
      render: (item) => item.flight ? 
        `${item.flight.departureAirport} → ${item.flight.arrivalAirport}` : 'N/A'
    },
    {
      key: 'departureTime',
      label: 'Ngày bay',
      render: (item) => item.flight ? formatDate(item.flight.departureTime) : 'N/A'
    },
    {
      key: 'passengers',
      label: 'Số hành khách',
      render: (item) => item.passengers ? item.passengers.length : 0
    },
    {
      key: 'totalPrice',
      label: 'Tổng tiền',
      sortable: true,
      render: (item) => formatPrice(item.totalPrice)
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} type="booking" />
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      sortable: true,
      render: (item) => (
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full 
          ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
            item.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
            item.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'}`}>
          {item.paymentStatus === 'paid' ? 'Đã thanh toán' : 
           item.paymentStatus === 'refunded' ? 'Đã hoàn tiền' :
           item.paymentStatus === 'failed' ? 'Thanh toán thất bại' :
           'Chờ thanh toán'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Ngày đặt',
      sortable: true,
      render: (item) => formatDate(item.createdAt)
    },
    {
      key: 'actions',
      label: 'Thao tác',
      type: 'actions',
      actions: [
        {
          icon: <FaEye />,
          label: 'Xem chi tiết',
          onClick: (item) => window.location.href = `/flight-bookings/${item._id}`,
          className: 'text-blue-600 hover:text-blue-800'
        },
        {
          icon: <FaCheckCircle />,
          label: 'Xác nhận',
          onClick: (item) => handleUpdateStatus(item._id, 'confirmed'),
          className: 'text-green-600 hover:text-green-800',
          hidden: (item) => item.status !== 'pending'
        },
        {
          icon: <FaTimesCircle />,
          label: 'Hủy đơn',
          onClick: (item) => handleUpdateStatus(item._id, 'cancelled'),
          className: 'text-red-600 hover:text-red-800',
          hidden: (item) => item.status === 'cancelled' || item.status === 'completed'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đặt vé máy bay</h1>
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
                    toDate: ''
                  });
                }}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
        
        {/* Bảng dữ liệu */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
              <div className="w-full md:w-1/3">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đặt vé, tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <button
                  onClick={fetchBookings}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Làm mới
                </button>
              </div>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={bookings}
            isLoading={isLoading}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
              onPageChange: handlePageChange
            }}
            emptyMessage="Không có dữ liệu đặt vé máy bay"
          />
        </div>
      </div>
    </Layout>
  );
};

export default FlightBookingsListPage; 