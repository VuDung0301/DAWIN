import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HotelsListPage from './pages/hotels/HotelsListPage';
import HotelFormPage from './pages/hotels/HotelFormPage';
import HotelBookingsListPage from './pages/hotels/HotelBookingsListPage';
import ToursListPage from './pages/tours/ToursListPage';
import TourFormPage from './pages/tours/TourFormPage';
import TourBookingsListPage from './pages/tours/TourBookingsListPage';
import FlightsListPage from './pages/flights/FlightsListPage';
import FlightFormPage from './pages/flights/FlightFormPage';
import FlightBookingsListPage from './pages/bookings/FlightBookingsListPage';
import TourDetailPage from './pages/tours/TourDetailPage';
import HotelDetailPage from './pages/hotels/HotelDetailPage';
import FlightDetailPage from './pages/flights/FlightDetailPage';
import HotelBookingDetailPage from './pages/hotels/HotelBookingDetailPage';
import TourBookingDetailPage from './pages/tours/TourBookingDetailPage';
import FlightBookingDetailPage from './pages/bookings/FlightBookingDetailPage';

// Trang mới cho sidebar
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import UserFormPage from './pages/users/UserFormPage';
import ReviewsListPage from './pages/reviews/ReviewsListPage';
import StatisticsPage from './pages/statistics/StatisticsPage';
import SettingsPage from './pages/settings/SettingsPage';

// Kiểm tra xem người dùng đã đăng nhập chưa
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token; // Chuyển đổi sang boolean
};

// Route cần xác thực
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Trang Dashboard */}
        <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
        
        {/* Quản lý khách sạn */}
        <Route path="/hotels" element={<PrivateRoute element={<HotelsListPage />} />} />
        <Route path="/hotels/create" element={<PrivateRoute element={<HotelFormPage />} />} />
        <Route path="/hotels/edit/:id" element={<PrivateRoute element={<HotelFormPage />} />} />
        <Route path="/hotels/:id" element={<PrivateRoute element={<HotelDetailPage />} />} />
        <Route path="/hotel-bookings" element={<PrivateRoute element={<HotelBookingsListPage />} />} />
        <Route path="/hotel-bookings/:id" element={<PrivateRoute element={<HotelBookingDetailPage />} />} />
        
        {/* Quản lý tour */}
        <Route path="/tours" element={<PrivateRoute element={<ToursListPage />} />} />
        <Route path="/tours/create" element={<PrivateRoute element={<TourFormPage />} />} />
        <Route path="/tours/edit/:id" element={<PrivateRoute element={<TourFormPage />} />} />
        <Route path="/tours/:id" element={<PrivateRoute element={<TourDetailPage />} />} />
        <Route path="/tour-bookings" element={<PrivateRoute element={<TourBookingsListPage />} />} />
        <Route path="/tour-bookings/:id" element={<PrivateRoute element={<TourBookingDetailPage />} />} />
        
        {/* Quản lý chuyến bay */}
        <Route path="/flights" element={<PrivateRoute element={<FlightsListPage />} />} />
        <Route path="/flights/create" element={<PrivateRoute element={<FlightFormPage />} />} />
        <Route path="/flights/edit/:id" element={<PrivateRoute element={<FlightFormPage />} />} />
        <Route path="/flights/:flightIata/:date" element={<PrivateRoute element={<FlightDetailPage />} />} />
        <Route path="/flight-bookings" element={<PrivateRoute element={<FlightBookingsListPage />} />} />
        <Route path="/flight-bookings/:id" element={<PrivateRoute element={<FlightBookingDetailPage />} />} />
        
        {/* Quản lý khách hàng */}
        <Route path="/users" element={<PrivateRoute element={<UsersListPage />} />} />
        <Route path="/users/create" element={<PrivateRoute element={<UserFormPage />} />} />
        <Route path="/users/edit/:id" element={<PrivateRoute element={<UserFormPage />} />} />
        <Route path="/users/:id" element={<PrivateRoute element={<UserDetailPage />} />} />
        
        {/* Quản lý đánh giá */}
        <Route path="/reviews" element={<PrivateRoute element={<ReviewsListPage />} />} />
        
        {/* Thống kê */}
        <Route path="/statistics" element={<PrivateRoute element={<StatisticsPage />} />} />
        
        {/* Cài đặt */}
        <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
        
        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
