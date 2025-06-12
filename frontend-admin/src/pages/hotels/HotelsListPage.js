import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEye, FaPlus } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import { hotelsAPI } from '../../services/api';

const HotelsListPage = () => {
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    stars: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchHotels();
  }, [pagination.page, searchTerm, filters]);

  const fetchHotels = async () => {
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
      
      const response = await hotelsAPI.getAll(params);
      
      if (response.success) {
        setHotels(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
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

  const handleDeleteHotel = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách sạn này không?')) {
      try {
        const response = await hotelsAPI.delete(id);
        if (response.success) {
          fetchHotels();
        } else {
          alert('Không thể xóa khách sạn. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Delete hotel error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  const columns = [
    {
      key: 'coverImage',
      label: 'Ảnh',
      type: 'image'
    },
    {
      key: 'name',
      label: 'Tên khách sạn',
      sortable: true
    },
    {
      key: 'city',
      label: 'Thành phố',
      sortable: true
    },
    {
      key: 'stars',
      label: 'Sao',
      sortable: true,
      render: (item) => (
        <div className="flex">
          {[...Array(item.stars)].map((_, i) => (
            <span key={i} className="text-yellow-500">★</span>
          ))}
        </div>
      )
    },
    {
      key: 'pricePerNight',
      label: 'Giá/đêm',
      type: 'price',
      sortable: true
    },
    {
      key: 'category',
      label: 'Danh mục',
      sortable: true
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
          onClick: (item) => window.location.href = `/hotels/${item._id}`,
          className: 'text-blue-600 hover:text-blue-800'
        },
        {
          icon: <FaEdit />,
          label: 'Sửa',
          onClick: (item) => window.location.href = `/hotels/edit/${item._id}`,
          className: 'text-green-600 hover:text-green-800'
        },
        {
          icon: <FaTrashAlt />,
          label: 'Xóa',
          onClick: (item) => handleDeleteHotel(item._id),
          className: 'text-red-600 hover:text-red-800'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý khách sạn</h1>
          <Link to="/hotels/create" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <FaPlus className="mr-2" />
            Thêm khách sạn mới
          </Link>
        </div>
        
        {/* Bộ lọc */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nhập tên thành phố"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số sao</label>
              <select
                name="stars"
                value={filters.stars}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="nghỉ dưỡng">Nghỉ dưỡng</option>
                <option value="thành phố">Thành phố</option>
                <option value="ven biển">Ven biển</option>
                <option value="núi">Núi</option>
                <option value="gia đình">Gia đình</option>
                <option value="doanh nhân">Doanh nhân</option>
                <option value="cặp đôi">Cặp đôi</option>
              </select>
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
                    city: '',
                    stars: '',
                    category: '',
                    minPrice: '',
                    maxPrice: ''
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
          data={hotels}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onRefresh={fetchHotels}
        />
      </div>
    </Layout>
  );
};

export default HotelsListPage; 