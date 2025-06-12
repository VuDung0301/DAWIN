import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { isTokenExpired } from '../../utils/authUtils';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Kiểm tra xác thực khi component được mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Nếu không có token hoặc token hết hạn, chuyển hướng về trang đăng nhập
    if (!token || isTokenExpired(token)) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Toggle sidebar hiển thị (responsive)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (responsive) */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
        
        <footer className="bg-white p-4 border-t border-gray-200 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} DAWIN Admin - Hệ thống quản lý du lịch
        </footer>
      </div>
    </div>
  );
};

export default Layout; 