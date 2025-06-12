import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaTrash, FaCheck, FaTimes, FaDownload, FaPrint, FaStar } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import { reviewsAPI } from '../../services/api';

const ReviewsListPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    rating: '',
    type: '',
    status: ''
  });

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, searchTerm, filters]);

  const fetchReviews = async () => {
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
      
      console.log('Gọi API danh sách đánh giá:', params);
      const response = await reviewsAPI.getAll(params);
      
      if (response.success) {
        console.log('Dữ liệu đánh giá:', response.data);
        setReviews(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
      try {
        const response = await reviewsAPI.delete(id);
        if (response.success) {
          alert('Xóa đánh giá thành công!');
          fetchReviews();
        } else {
          alert('Không thể xóa đánh giá. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Delete review error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const handleApproveReview = async (id, approve) => {
    const action = approve ? 'duyệt' : 'từ chối';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} đánh giá này không?`)) {
      try {
        const response = approve 
          ? await reviewsAPI.approve(id)
          : await reviewsAPI.reject(id);
          
        if (response.success) {
          alert(`${action.charAt(0).toUpperCase() + action.slice(1)} đánh giá thành công!`);
          fetchReviews();
        } else {
          alert(`Không thể ${action} đánh giá. Vui lòng thử lại sau.`);
        }
      } catch (error) {
        console.error('Update review error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleExportExcel = () => {
    alert('Chức năng xuất Excel sẽ được phát triển sau.');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }
    return (
      <div className="flex">
        {stars}
        <span className="ml-1 text-gray-700">({rating})</span>
      </div>
    );
  };

  const columns = [
    {
      key: '_id',
      label: 'ID',
      sortable: true,
      render: (item) => item._id ? item._id.substring(0, 8) + '...' : 'N/A'
    },
    {
      key: 'user',
      label: 'Người đánh giá',
      render: (item) => {
        if (!item.user) return 'Ẩn danh';
        return (
          <Link to={`/users/${item.user._id}`} className="text-indigo-600 hover:text-indigo-800">
            {item.user.name || 'N/A'}
          </Link>
        );
      }
    },
    {
      key: 'rating',
      label: 'Đánh giá',
      sortable: true,
      render: (item) => renderStars(item.rating || 0)
    },
    {
      key: 'content',
      label: 'Nội dung',
      render: (item) => (
        <div className="max-w-xs">
          <div className="font-medium text-sm mb-1">{item.title || 'Không có tiêu đề'}</div>
          <div className="text-gray-600 text-sm truncate">
            {item.review || item.text || 'Không có nội dung'}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Loại dịch vụ',
      render: (item) => {
        if (item.tour) {
          return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Tour</span>;
        } else if (item.hotel) {
          return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Khách sạn</span>;
        }
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">N/A</span>;
      }
    },
    {
      key: 'itemName',
      label: 'Dịch vụ',
      render: (item) => {
        if (item.tour) {
          return (
            <div>
              <Link to={`/tours/${item.tour._id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                {item.tour.name}
              </Link>
              <div className="text-sm text-gray-500">
                {item.tour.price ? `${item.tour.price.toLocaleString('vi-VN')} VNĐ` : ''}
              </div>
            </div>
          );
        } else if (item.hotel) {
          return (
            <div>
              <Link to={`/hotels/${item.hotel._id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                {item.hotel.name}
              </Link>
              <div className="text-sm text-gray-500">
                {item.hotel.city} - {item.hotel.pricePerNight ? `${item.hotel.pricePerNight.toLocaleString('vi-VN')} VNĐ/đêm` : ''}
              </div>
            </div>
          );
        }
        return <span className="text-gray-400">N/A</span>;
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => {
        const status = item.approved === true 
          ? 'approved' 
          : item.approved === false 
            ? 'rejected' 
            : 'pending';
            
        const statusText = status === 'approved' 
          ? 'Đã duyệt' 
          : status === 'rejected' 
            ? 'Từ chối' 
            : 'Chờ duyệt';
            
        const statusClass = status === 'approved' 
          ? 'bg-green-100 text-green-800' 
          : status === 'rejected' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Ngày đăng',
      sortable: true,
      render: (item) => formatDate(item.createdAt)
    },
    {
      key: 'actions',
      label: 'Thao tác',
      type: 'actions',
      actions: [
        {
          icon: <FaCheck />,
          label: 'Duyệt',
          onClick: (item) => handleApproveReview(item._id, true),
          className: 'text-green-600 hover:text-green-800',
          hidden: (item) => item.approved === true
        },
        {
          icon: <FaTimes />,
          label: 'Từ chối',
          onClick: (item) => handleApproveReview(item._id, false),
          className: 'text-red-600 hover:text-red-800',
          hidden: (item) => item.approved === false
        },
        {
          icon: <FaTrash />,
          label: 'Xóa',
          onClick: (item) => handleDelete(item._id),
          className: 'text-red-600 hover:text-red-800'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đánh giá</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại dịch vụ</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="hotel">Khách sạn</option>
                <option value="tour">Tour</option>
                <option value="flight">Chuyến bay</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
              <select
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    rating: '',
                    type: '',
                    status: ''
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
            data={reviews}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            searchPlaceholder="Tìm kiếm theo nội dung, người đánh giá..."
          />
        </div>
      </div>
    </Layout>
  );
};

export default ReviewsListPage; 