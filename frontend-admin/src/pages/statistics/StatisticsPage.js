import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaDownload, 
  FaPrint, 
  FaHotel, 
  FaPlane, 
  FaRoute, 
  FaUsers, 
  FaStar, 
  FaRegCheckCircle,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPercent,
  FaMoneyBillWave,
  FaUserPlus,
  FaChartPie,
  FaChartLine,
  FaFilter,
  FaUps,
  FaArrowDown,
  FaArrowUp
} from 'react-icons/fa';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';
import Layout from '../../components/layout/Layout';
import { reportsAPI } from '../../services/api';

// Component thẻ thống kê nâng cao
const AdvancedStatCard = ({ title, value, icon, color, change, changePercent, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} text-white mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
      {change !== undefined && (
        <div className="flex flex-col items-end">
          <div className={`flex items-center text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            {Math.abs(changePercent)}%
          </div>
          <span className="text-xs text-gray-500">So với kỳ trước</span>
        </div>
      )}
    </div>
  </div>
);

// Component biểu đồ đường cho xu hướng
const LineChart = ({ data, title, height = "h-64" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className={`${height} flex items-center justify-center`}>
          <p className="text-gray-500 italic">Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className={`${height} relative`}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Tạo đường line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.5"
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.value - minValue) / range) * 80 - 10;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Tạo area */}
          <polygon
            fill="url(#gradient)"
            points={`${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.value - minValue) / range) * 80 - 10;
              return `${x},${y}`;
            }).join(' ')} 100,90 0,90`}
          />
          
          {/* Điểm dữ liệu */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - minValue) / range) * 80 - 10;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="1"
                fill="#3B82F6"
                className="hover:r-2 transition-all"
              />
            );
          })}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((d, i) => (
            <span key={i} className="text-center">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component biểu đồ tròn
const PieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 italic">Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center">
        <div className="w-48 h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-300 hover:stroke-width-12"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Tổng</div>
            </div>
          </div>
        </div>
        
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component bảng top performers
const TopPerformersTable = ({ data, title, type }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {data && data.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Tên</th>
              <th className="text-right py-2 font-medium text-gray-600">Đặt chỗ</th>
              <th className="text-right py-2 font-medium text-gray-600">Doanh thu</th>
              <th className="text-right py-2 font-medium text-gray-600">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Link 
                        to={`/${type}/${item._id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {item.name}
                      </Link>
                      {type === 'hotels' && <div className="text-xs text-gray-500">{item.city}</div>}
                      {type === 'tours' && <div className="text-xs text-gray-500">{item.duration} ngày</div>}
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 font-medium">{item.bookings}</td>
                <td className="text-right py-3 text-green-600 font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.revenue || 0)}
                </td>
                <td className="text-right py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {((item.bookings / data.reduce((sum, d) => sum + d.bookings, 0)) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500 italic">Không có dữ liệu</p>
    )}
  </div>
);

const StatisticsPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [stats, setStats] = useState({
    summary: {
      totalBookings: 0,
      totalUsers: 0,
      totalRevenue: 0,
      totalServices: 0,
      newUsers: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      cancelledBookings: 0
    },
    trends: {
      bookingTrend: [],
      revenueTrend: [],
      userTrend: []
    },
    bookings: {
      hotel: 0,
      tour: 0,
      flight: 0
    },
    revenue: {
      byMonth: [],
      byService: { hotel: 0, tour: 0, flight: 0 }
    },
    popular: {
      hotels: [],
      tours: [],
      flights: []
    },
    geographical: {
      cities: [],
      countries: []
    },
    performance: {
      topHotels: [],
      topTours: [],
      topCustomers: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const response = await reportsAPI.getStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (response.success && response.data) {
        // Dữ liệu đã được mở rộng từ backend
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    setDateRange({ startDate, endDate });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Chức năng xuất Excel đang được phát triển');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thống kê & Phân tích</h1>
            <p className="text-gray-600">Tổng quan hiệu suất kinh doanh và xu hướng thị trường</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <FaDownload className="mr-2" /> Xuất Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <FaPrint className="mr-2" /> In báo cáo
            </button>
          </div>
        </div>

        {/* Bộ lọc thời gian nâng cao */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500" />
              <span className="font-medium text-gray-700">Khoảng thời gian:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: '7d', label: '7 ngày' },
                { key: '30d', label: '30 ngày' },
                { key: '90d', label: '3 tháng' },
                { key: '1y', label: '1 năm' }
              ].map(period => (
                <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedPeriod === period.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdvancedStatCard
            title="Tổng đặt chỗ"
            value={stats.summary.totalBookings.toLocaleString()}
            icon={<FaRegCheckCircle className="text-xl" />}
            color="bg-blue-500"
            change={5.2}
            changePercent="5.2"
            subtitle={`${stats.summary.cancelledBookings} đã hủy`}
          />
          
          <AdvancedStatCard
            title="Doanh thu"
            value={formatCurrency(stats.summary.totalRevenue)}
            icon={<HiOutlineCurrencyDollar className="text-xl" />}
            color="bg-green-500"
            change={8.1}
            changePercent="8.1"
            subtitle={`AOV: ${formatCurrency(stats.summary.averageOrderValue)}`}
          />
          
          <AdvancedStatCard
            title="Khách hàng"
            value={stats.summary.totalUsers.toLocaleString()}
            icon={<FaUsers className="text-xl" />}
            color="bg-purple-500"
            change={12.3}
            changePercent="12.3"
            subtitle={`${stats.summary.newUsers} khách mới`}
          />
          
          <AdvancedStatCard
            title="Tỷ lệ chuyển đổi"
            value={`${stats.summary.conversionRate}%`}
            icon={<FaPercent className="text-xl" />}
            color="bg-orange-500"
            change={2.1}
            changePercent="2.1"
            subtitle="Booking/Visitor"
          />
        </div>

        {/* Biểu đồ xu hướng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart
            data={stats.trends.revenueTrend}
            title="Xu hướng doanh thu"
            height="h-80"
          />
          
          <LineChart
            data={stats.trends.bookingTrend}
            title="Xu hướng đặt chỗ"
            height="h-80"
          />
        </div>

        {/* Phân tích theo dịch vụ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart
            data={[
              { label: 'Tour du lịch', value: stats.revenue.byService.tour },
              { label: 'Khách sạn', value: stats.revenue.byService.hotel },
              { label: 'Chuyến bay', value: stats.revenue.byService.flight }
            ]}
            title="Doanh thu theo dịch vụ"
          />
          
          <PieChart
            data={[
              { label: 'Tour du lịch', value: stats.bookings.tour },
              { label: 'Khách sạn', value: stats.bookings.hotel },
              { label: 'Chuyến bay', value: stats.bookings.flight }
            ]}
            title="Lượng đặt chỗ theo dịch vụ"
          />
        </div>

                 {/* Thống kê địa lý */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
             <h3 className="text-lg font-semibold mb-4 flex items-center">
               <FaMapMarkerAlt className="mr-2 text-blue-600" />
               Thống kê theo thành phố
             </h3>
             <div className="space-y-4">
               {(stats.geographical?.cities || []).slice(0, 5).map((city, index) => (
                 <div key={index} className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                     <span className="font-medium">{city.name}</span>
                   </div>
                   <div className="flex items-center space-x-4">
                     <span className="text-sm text-gray-600">{city.bookings} đặt chỗ</span>
                     <div className="w-24 bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full"
                         style={{ width: `${city.percentage}%` }}
                       ></div>
                     </div>
                     <span className="text-sm font-medium text-gray-900 w-12 text-right">
                       {city.percentage}%
                     </span>
                   </div>
                 </div>
               ))}
               {(!stats.geographical?.cities || stats.geographical.cities.length === 0) && (
                 <p className="text-gray-500 italic">Không có dữ liệu</p>
               )}
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
             <h3 className="text-lg font-semibold mb-4 flex items-center">
               <FaEye className="mr-2 text-green-600" />
               Khách hàng hàng đầu
             </h3>
             <div className="space-y-4">
               {(stats.performance?.topCustomers || []).map((customer, index) => (
                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                   <div className="flex items-center">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                       index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                     }`}>
                       {index + 1}
                     </div>
                     <div>
                       <div className="font-medium">{customer.name}</div>
                       <div className="text-sm text-gray-500">{customer.email}</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-medium">{customer.bookings} đặt chỗ</div>
                     <div className="text-sm text-green-600">{formatCurrency(customer.revenue || 0)}</div>
                   </div>
                 </div>
               ))}
               {(!stats.performance?.topCustomers || stats.performance.topCustomers.length === 0) && (
                 <p className="text-gray-500 italic">Không có dữ liệu</p>
               )}
             </div>
           </div>
         </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPerformersTable
            data={stats.performance.topHotels}
            title="Top khách sạn"
            type="hotels"
          />
          
          <TopPerformersTable
            data={stats.performance.topTours}
            title="Top tour du lịch"
            type="tours"
          />
        </div>

                 {/* Insights và Recommendations */}
         <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
           <h3 className="text-xl font-semibold mb-4 flex items-center">
             <FaChartLine className="mr-2" />
             Phân tích & Khuyến nghị
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold mb-2">Xu hướng tích cực</h4>
               <p className="text-sm opacity-90">
                 {stats.growth?.revenue > 0 ? 
                   `Doanh thu tăng ${stats.growth.revenue}% so với kỳ trước` :
                   `Doanh thu tour du lịch chiếm ${((stats.revenue?.byService?.tour || 0) / ((stats.revenue?.byService?.hotel || 0) + (stats.revenue?.byService?.flight || 0) + (stats.revenue?.byService?.tour || 0) + 1) * 100).toFixed(1)}% tổng doanh thu`
                 }
               </p>
             </div>
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold mb-2">Cơ hội cải thiện</h4>
               <p className="text-sm opacity-90">
                 Tỷ lệ hủy đặt chỗ {stats.summary?.totalBookings > 0 ? ((stats.summary?.cancelledBookings / stats.summary?.totalBookings) * 100).toFixed(1) : 0}% 
                 có thể giảm bằng cách cải thiện chính sách hủy
               </p>
             </div>
             <div className="bg-white/10 rounded-lg p-4">
               <h4 className="font-semibold mb-2">Khuyến nghị</h4>
               <p className="text-sm opacity-90">
                 {stats.geographical?.cities && stats.geographical.cities.length > 0 ?
                   `Tập trung phát triển dịch vụ tại ${stats.geographical.cities[0]?.name} để tối đa hóa thị phần` :
                   'Tập trung phát triển dịch vụ tại các thành phố lớn để tối đa hóa thị phần'
                 }
               </p>
             </div>
           </div>
         </div>
      </div>
    </Layout>
  );
};

export default StatisticsPage; 