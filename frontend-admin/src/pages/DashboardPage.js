import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { reportsAPI, hotelsAPI, toursAPI } from '../services/api';
import { 
  FaHotel, 
  FaRoute, 
  FaCalendarAlt, 
  FaUsers, 
  FaChartLine, 
  FaMoneyBillWave 
} from 'react-icons/fa';

// Component cho thẻ thông kê
const StatCard = ({ title, value, icon, color, percent, isUp }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {percent && (
            <div className={`flex items-center mt-2 text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{isUp ? '↑' : '↓'}</span>
              <span>{percent}% so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [featuredTours, setFeaturedTours] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Tải dữ liệu thống kê tổng quan
        const statsData = await reportsAPI.getDashboardStats();
        setStats(statsData.data);

        // Tải khách sạn nổi bật
        const hotelsData = await hotelsAPI.getFeatured();
        setFeaturedHotels(hotelsData.data.slice(0, 4));
        
        // Tải tour nổi bật
        const toursData = await toursAPI.getFeatured();
        setFeaturedTours(toursData.data.tours.slice(0, 4));
        
        // Demo dữ liệu đặt phòng gần đây
        setRecentBookings([
          { id: 'B1001', customerName: 'Nguyễn Văn A', date: '20/05/2023', amount: 1200000, status: 'Đã xác nhận' },
          { id: 'B1002', customerName: 'Trần Thị B', date: '19/05/2023', amount: 2400000, status: 'Chờ xác nhận' },
          { id: 'B1003', customerName: 'Lê Văn C', date: '18/05/2023', amount: 3000000, status: 'Đã xác nhận' },
          { id: 'B1004', customerName: 'Phạm Thị D', date: '17/05/2023', amount: 1800000, status: 'Đã hủy' },
          { id: 'B1005', customerName: 'Hoàng Văn E', date: '16/05/2023', amount: 2100000, status: 'Hoàn thành' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Nếu đang tải dữ liệu
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  // Nếu có lỗi
  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </Layout>
    );
  }

  // Nếu không có dữ liệu thống kê
  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p className="text-gray-500">Không có dữ liệu thống kê</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h1>
        
        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng khách sạn" 
            value={stats.hotelCount || '0'} 
            icon={<FaHotel className="text-white" size={20} />} 
            color="bg-blue-600" 
            percent="12.5"
            isUp={true}
          />
          <StatCard 
            title="Tổng tour" 
            value={stats.tourCount || '0'} 
            icon={<FaRoute className="text-white" size={20} />} 
            color="bg-green-600" 
            percent="8.3"
            isUp={true}
          />
          <StatCard 
            title="Đặt phòng tháng này" 
            value={stats.monthlyBookings || '0'} 
            icon={<FaCalendarAlt className="text-white" size={20} />} 
            color="bg-purple-600" 
            percent="5.2"
            isUp={true}
          />
          <StatCard 
            title="Doanh thu tháng này" 
            value={new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(stats.monthlyRevenue || 0)} 
            icon={<FaMoneyBillWave className="text-white" size={20} />} 
            color="bg-orange-600" 
            percent="3.7"
            isUp={false}
          />
        </div>
        
        {/* Khách sạn nổi bật */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Khách sạn nổi bật</h2>
            <Link to="/hotels" className="text-indigo-600 hover:text-indigo-800 text-sm">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredHotels.map((hotel) => (
              <div key={hotel._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 overflow-hidden">
                  <img src={hotel.coverImage} alt={hotel.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{hotel.name}</h3>
                  <p className="text-gray-600 text-xs">{hotel.city}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-xs ml-1">{hotel.ratingsAverage}</span>
                    </div>
                    <span className="text-green-600 font-medium text-sm">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                      }).format(hotel.pricePerNight || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tour nổi bật */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Tour nổi bật</h2>
            <Link to="/tours" className="text-indigo-600 hover:text-indigo-800 text-sm">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTours.map((tour) => (
              <div key={tour._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 overflow-hidden">
                  <img src={tour.coverImage} alt={tour.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{tour.name}</h3>
                  <p className="text-gray-600 text-xs">{tour.duration} ngày</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-xs ml-1">{tour.ratingsAverage}</span>
                    </div>
                    <span className="text-green-600 font-medium text-sm">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                      }).format(tour.price || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Đơn đặt gần đây */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Đơn đặt phòng gần đây</h2>
            <Link to="/bookings" className="text-indigo-600 hover:text-indigo-800 text-sm">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                      }).format(booking.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${booking.status === 'Đã xác nhận' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' : 
                          booking.status === 'Đã hủy' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage; 