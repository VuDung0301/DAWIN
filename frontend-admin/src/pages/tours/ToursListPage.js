import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEye, FaPlus } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import { toursAPI } from '../../services/api';

const ToursListPage = () => {
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    minPrice: '',
    maxPrice: '',
    duration: ''
  });

  useEffect(() => {
    fetchTours();
  }, [pagination.page, searchTerm, filters]);

  const fetchTours = async () => {
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
      
      const response = await toursAPI.getAll(params);
      
      if (response.success) {
        setTours(response.data.tours);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
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

  const handleDeleteTour = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tour này không?')) {
      try {
        const response = await toursAPI.delete(id);
        if (response.success) {
          fetchTours();
        } else {
          alert('Không thể xóa tour. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Delete tour error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const dates = Array.isArray(dateString) 
      ? dateString.map(d => new Date(d).toLocaleDateString('vi-VN')).join(', ') 
      : new Date(dateString).toLocaleDateString('vi-VN');
    
    return dates;
  };

  const columns = [
    {
      key: 'coverImage',
      label: 'Ảnh',
      type: 'image'
    },
    {
      key: 'name',
      label: 'Tên tour',
      sortable: true
    },
    {
      key: 'duration',
      label: 'Thời gian',
      sortable: true,
      render: (item) => `${item.duration} ngày`
    },
    {
      key: 'difficulty',
      label: 'Độ khó',
      sortable: true,
      render: (item) => {
        const difficultyColors = {
          'dễ': 'bg-green-100 text-green-800',
          'trung bình': 'bg-yellow-100 text-yellow-800',
          'khó': 'bg-red-100 text-red-800'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[item.difficulty] || 'bg-gray-100 text-gray-800'}`}>
            {item.difficulty}
          </span>
        );
      }
    },
    {
      key: 'maxGroupSize',
      label: 'Số người',
      sortable: true
    },
    {
      key: 'price',
      label: 'Giá',
      type: 'price',
      sortable: true
    },
    {
      key: 'startDates',
      label: 'Ngày khởi hành',
      render: (item) => formatDate(item.startDates?.[0])
    },
    {
      key: 'ratingsAverage',
      label: 'Đánh giá',
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">★</span>
          <span>{item.ratingsAverage} ({item.ratingsQuantity})</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      type: 'actions',
      actions: [
        {
          icon: <FaEye />,
          label: 'Xem',
          onClick: (item) => window.location.href = `/tours/${item._id}`,
          className: 'text-blue-600 hover:text-blue-800'
        },
        {
          icon: <FaEdit />,
          label: 'Sửa',
          onClick: (item) => window.location.href = `/tours/edit/${item._id}`,
          className: 'text-green-600 hover:text-green-800'
        },
        {
          icon: <FaTrashAlt />,
          label: 'Xóa',
          onClick: (item) => handleDeleteTour(item._id),
          className: 'text-red-600 hover:text-red-800'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tour</h1>
          <Link to="/tours/create" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <FaPlus className="mr-2" />
            Thêm tour mới
          </Link>
        </div>
        
        {/* Bộ lọc */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
              <select
                name="difficulty"
                value={filters.difficulty}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="dễ">Dễ</option>
                <option value="trung bình">Trung bình</option>
                <option value="khó">Khó</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (ngày)</label>
              <input
                type="number"
                name="duration"
                value={filters.duration}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nhập số ngày"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá thấp nhất</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="VND"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá cao nhất</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="VND"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    difficulty: '',
                    minPrice: '',
                    maxPrice: '',
                    duration: ''
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
          data={tours}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onRefresh={fetchTours}
        />
      </div>
    </Layout>
  );
};

export default ToursListPage; 