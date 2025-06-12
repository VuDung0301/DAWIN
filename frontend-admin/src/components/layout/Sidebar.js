import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaHotel, 
  FaRoute, 
  FaCalendarAlt, 
  FaUsers, 
  FaChartBar, 
  FaCog,
  FaSignOutAlt,
  FaCommentDots,
  FaPlane
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  
  // Kiểm tra menu hiện tại để highlight
  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'bg-indigo-700' : '';
  };

  // Danh sách menu
  const menuItems = [
    { path: '/dashboard', icon: <FaHome size={18} />, label: 'Tổng quan' },
    { path: '/hotels', icon: <FaHotel size={18} />, label: 'Quản lý khách sạn' },
    { path: '/hotel-bookings', icon: <FaCalendarAlt size={18} />, label: 'Đặt phòng khách sạn' },
    { path: '/tours', icon: <FaRoute size={18} />, label: 'Quản lý tour' },
    { path: '/tour-bookings', icon: <FaCalendarAlt size={18} />, label: 'Đặt tour' },
    { path: '/flights', icon: <FaPlane size={18} />, label: 'Chuyến bay' },
    { path: '/flight-bookings', icon: <FaCalendarAlt size={18} />, label: 'Đặt vé máy bay' },
    { path: '/users', icon: <FaUsers size={18} />, label: 'Khách hàng' },
    { path: '/reviews', icon: <FaCommentDots size={18} />, label: 'Đánh giá' },
    { path: '/statistics', icon: <FaChartBar size={18} />, label: 'Thống kê' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-64 bg-indigo-800 text-white flex flex-col">
      <div className="p-5 border-b border-indigo-700">
        <h1 className="text-2xl font-bold">DAWIN Admin</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="py-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                to={item.path} 
                className={`flex items-center px-5 py-3 hover:bg-indigo-700 transition-colors ${isActive(item.path)}`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-indigo-700">
        <button 
          onClick={handleLogout}
          className="flex items-center px-5 py-3 w-full text-left hover:bg-indigo-700 transition-colors rounded"
        >
          <span className="mr-3"><FaSignOutAlt size={18} /></span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 