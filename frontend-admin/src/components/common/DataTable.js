import React, { useState } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaSync, FaTrash } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import Pagination from './Pagination';

const DataTable = ({
  columns,
  data,
  pagination,
  isLoading,
  onPageChange,
  onSearch,
  onDelete,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  // Xử lý sắp xếp
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Render cell dựa trên kiểu dữ liệu và cấu hình
  const renderCell = (column, item) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(item);
    }
    
    switch (column.type) {
      case 'image':
        return (
          <img 
            src={value || 'https://via.placeholder.com/150'} 
            alt={item.name || 'Hình ảnh'} 
            className="w-12 h-12 object-cover rounded"
          />
        );
      case 'status':
        return <StatusBadge status={value} type={column.statusType} />;
      case 'date':
        return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
      case 'datetime':
        return value ? new Date(value).toLocaleString('vi-VN') : '-';
      case 'boolean':
        return value ? 'Có' : 'Không';
      case 'price':
        return value ? new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(value) : '-';
      case 'actions':
        return column.actions.map((action, index) => {
          // Kiểm tra xem action có bị ẩn không
          if (action.hidden && action.hidden(item)) {
            return null;
          }
          
          // Nếu action có component, ưu tiên sử dụng component
          if (action.component) {
            return (
              <span key={index} className="p-1 ml-1">
                {action.component(item)}
              </span>
            );
          }
          
          // Ngược lại sử dụng onClick
          return (
            <button
              key={index}
              onClick={() => action.onClick(item)}
              className={`p-1 ml-1 rounded ${action.className || 'text-gray-600 hover:text-gray-900'}`}
              title={action.label}
            >
              {action.icon}
            </button>
          );
        });
      default:
        return value || '-';
    }
  };
  
  // Hiển thị icon sắp xếp
  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    
    if (sortConfig.key === column.key) {
      return sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
    }
    return <FaSort className="ml-1 text-gray-400" />;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Phần tìm kiếm và các nút điều khiển */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="border rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-0 top-0 mt-2 mr-3">
              <FaSearch className="text-gray-500" />
            </button>
          </div>
          <button
            type="submit"
            className="ml-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
          >
            Tìm kiếm
          </button>
        </form>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              <FaSync className="mr-2" />
              Làm mới
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              <FaTrash className="mr-2" />
              Xóa đã chọn
            </button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={item.id || rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                      {renderCell(column, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {pagination && (
        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable; 