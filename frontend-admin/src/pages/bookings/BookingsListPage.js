import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { bookingsAPI } from '../../services/api';

const BookingsListPage = () => {
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
    hotelId: ''
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
      
      const response = await bookingsAPI.getAll(params);
      
      if (response.success) {
        setBookings(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'confirmed' ? 'xác nhận' : 'hủy'} đơn đặt phòng này không?`)) {
      try {
        const response = await bookingsAPI.update(id, { status: newStatus });
        if (response.success) {
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const columns = [
    {
      key: 'bookingNumber',
      label: 'Mã đơn',
      sortable: true
    },
    {
      key: 'user',
      label: 'Khách hàng',
      render: (item) => item.user ? `${item.user.firstName} ${item.user.lastName}` : 'N/A'
    },
    {
      key: 'hotel',
      label: 'Khách sạn',
      render: (item) => item.hotel ? item.hotel.name : 'N/A'
    },
    {
      key: 'room',
      label: 'Phòng',
      render: (item) => item.room ? item.room.name : 'N/A'
    },
    {
      key: 'checkInDate',
      label: 'Check-in',
      sortable: true,
      render: (item) => formatDate(item.checkInDate)
    },
    {
      key: 'checkOutDate',
      label: 'Check-out',
      sortable: true,
      render: (item) => formatDate(item.checkOutDate)
    },
    {
      key: 'numberOfGuests',
      label: 'Số khách',
      sortable: true
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      type: 'price',
      sortable: true,
      render: (item) => formatPrice(item.totalAmount)
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'status',
      statusType: 'booking',
      render: (item) => <StatusBadge status={item.status} type="booking" />
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
          onClick: (item) => window.location.href = `/bookings/${item._id}`,
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
          onClick: (item) => handleUpdateStatus(item._id, 'canceled'),
          className: 'text-red-600 hover:text-red-800',
          hidden: (item) => item.status === 'canceled' || item.status === 'completed'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đặt phòng</h1>
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
                <option value="canceled">Đã hủy</option>
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
                    hotelId: ''
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
        
        <DataTable
          columns={columns}
          data={bookings}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onRefresh={fetchBookings}
        />
      </div>
    </Layout>
  );
};

export default BookingsListPage; 