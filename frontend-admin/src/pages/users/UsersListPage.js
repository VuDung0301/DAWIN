import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaDownload, FaPrint, FaUserPlus } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import DataTable from '../../components/common/DataTable';
import { usersAPI } from '../../services/api';

const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, filters]);

  const fetchUsers = async () => {
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
      
      console.log('Gọi API danh sách khách hàng:', params);
      const response = await usersAPI.getAll(params);
      
      if (response.success) {
        console.log('Dữ liệu khách hàng:', response.data);
        setUsers(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này không?')) {
      try {
        const response = await usersAPI.delete(id);
        if (response.success) {
          alert('Xóa khách hàng thành công!');
          fetchUsers();
        } else {
          alert('Không thể xóa khách hàng. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Delete user error:', error);
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

  const columns = [
    {
      key: '_id',
      label: 'ID',
      sortable: true,
      render: (item) => item._id ? item._id.substring(0, 8) + '...' : 'N/A'
    },
    {
      key: 'name',
      label: 'Họ và tên',
      sortable: true,
      render: (item) => item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      render: (item) => item.phone || 'N/A'
    },
    {
      key: 'role',
      label: 'Vai trò',
      render: (item) => {
        const roles = {
          admin: 'Quản trị viên',
          user: 'Khách hàng',
          staff: 'Nhân viên'
        };
        return roles[item.role] || item.role || 'N/A';
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => {
        const status = item.isActive === false ? 'inactive' : 'active';
        const statusText = status === 'active' ? 'Hoạt động' : 'Bị khóa';
        const statusClass = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Ngày đăng ký',
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
          component: (item) => (
            <Link to={`/users/${item._id}`} className="flex items-center text-blue-600 hover:text-blue-800">
              <FaEye className="mr-1" /> Xem
            </Link>
          ),
          className: 'text-blue-600 hover:text-blue-800'
        },
        {
          icon: <FaEdit />,
          label: 'Chỉnh sửa',
          component: (item) => (
            <Link to={`/users/edit/${item._id}`} className="flex items-center text-yellow-600 hover:text-yellow-800">
              <FaEdit className="mr-1" /> Sửa
            </Link>
          ),
          className: 'text-yellow-600 hover:text-yellow-800'
        },
        {
          icon: <FaTrash />,
          label: 'Xóa',
          onClick: (item) => handleDelete(item._id),
          className: 'text-red-600 hover:text-red-800',
          hidden: (item) => item.role === 'admin'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
          <div className="flex space-x-2">
            <Link
              to="/users/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center"
            >
              <FaUserPlus className="mr-2" /> Thêm mới
            </Link>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="admin">Quản trị viên</option>
                <option value="user">Khách hàng</option>
                <option value="staff">Nhân viên</option>
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
                <option value="active">Hoạt động</option>
                <option value="inactive">Bị khóa</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    role: '',
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
            data={users}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            searchPlaceholder="Tìm kiếm theo tên, email, số điện thoại..."
          />
        </div>
      </div>
    </Layout>
  );
};

export default UsersListPage; 