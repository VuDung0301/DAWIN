import React, { useState, useEffect } from 'react';
import { FaBell, FaUser, FaBars } from 'react-icons/fa';

const Header = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Demo notifications - trong thực tế sẽ lấy từ API
    setNotifications([
      { id: 1, message: 'Có đơn đặt phòng mới', time: '5 phút trước', read: false },
      { id: 2, message: 'Bình luận mới cần duyệt', time: '30 phút trước', read: false },
      { id: 3, message: 'Cập nhật hệ thống thành công', time: '1 giờ trước', read: true },
    ]);
  }, []);
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="mr-4 md:hidden">
          <FaBars className="text-gray-500 text-xl" />
        </button>
        <div className="relative text-gray-600">
          <input 
            type="search" 
            name="search" 
            placeholder="Tìm kiếm..." 
            className="bg-gray-100 h-10 px-5 pr-10 rounded-full text-sm focus:outline-none w-64"
          />
          <button type="submit" className="absolute right-0 top-0 mt-3 mr-4">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
              <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="relative mr-6">
          <button 
            onClick={toggleNotifications}
            className="relative text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <FaBell className="h-6 w-6" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div className="py-2 px-3 bg-gray-100 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold">Thông báo</span>
                  <button className="text-xs text-blue-500 hover:underline">
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-4 px-3 text-gray-500 text-center">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`py-3 px-3 hover:bg-gray-50 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="text-sm mb-1">{notification.message}</div>
                      <div className="text-xs text-gray-500">{notification.time}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="py-2 px-3 bg-gray-100 text-center">
                <button className="text-sm text-blue-500 hover:underline">
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button className="flex items-center focus:outline-none">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 mr-2">
              <FaUser />
            </div>
            <span className="text-gray-700">{user?.name || 'Admin'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 