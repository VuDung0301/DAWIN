import axios from 'axios';

// Base URL của API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Tạo instance axios với cấu hình chung
const api = axios.create({
  baseURL: API_URL,
});

// Thêm interceptor để gắn token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Quan trọng: Không thiết lập Content-Type khi gửi FormData
    // Axios sẽ tự động thiết lập content-type đúng và thêm boundary
    if (config.data instanceof FormData) {
      // Đây là form data, để axios tự xử lý header
      delete config.headers['Content-Type'];
    } else {
      // Nếu không phải FormData thì mới thiết lập content-type
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response và lỗi
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    
    // Nếu token hết hạn hoặc không hợp lệ
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Trả về lỗi để xử lý ở components
    return Promise.reject(
      (response && response.data) || { message: 'Đã xảy ra lỗi kết nối' }
    );
  }
);

// API cho quản lý khách sạn
export const hotelsAPI = {
  getAll: (params) => api.get('/hotels', { params }),
  getById: (id) => api.get(`/hotels/${id}`),
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
  getFeatured: () => api.get('/hotels/featured'),
  getCategories: () => api.get('/hotels/categories'),
  getPopularCities: () => api.get('/hotels/popular-cities'),
};

// API cho quản lý tour
export const toursAPI = {
  getAll: (params) => api.get('/tours', { params }),
  getById: (id) => api.get(`/tours/${id}`),
  create: (data) => api.post('/tours', data),
  update: (id, data) => api.put(`/tours/${id}`, data),
  delete: (id) => api.delete(`/tours/${id}`),
  getFeatured: () => api.get('/tours/featured'),
  getCategories: () => api.get('/tours/categories'),
  getPopularDestinations: () => api.get('/tours/popular-destinations'),
};

// API cho quản lý đặt phòng
export const bookingsAPI = {
  getAll: (params) => api.get('/hotel-bookings/admin/all-bookings', { params }),
  getById: (id) => api.get(`/hotel-bookings/${id}`),
  update: (id, data) => api.put(`/hotel-bookings/${id}`, data),
  delete: (id) => api.delete(`/hotel-bookings/${id}`),
  getStats: () => api.get('/hotel-bookings/stats'),
};

// API cho quản lý đặt tour
export const tourBookingsAPI = {
  getAll: (params) => api.get('/tour-bookings/admin/all-bookings', { params }),
  getById: (id) => api.get(`/tour-bookings/${id}`),
  create: (data) => api.post('/tour-bookings', data),
  update: (id, data) => api.put(`/tour-bookings/${id}`, data),
  delete: (id) => api.delete(`/tour-bookings/${id}`),
  getStats: () => api.get('/tour-bookings/stats'),
};

// API cho quản lý người dùng
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  getUserBookings: (id) => api.get(`/users/${id}/bookings`),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
};

// API cho quản lý đánh giá
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  approve: (id) => api.put(`/reviews/${id}/approve`),
  reject: (id) => api.put(`/reviews/${id}/reject`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// API cho phần thống kê và báo cáo
export const reportsAPI = {
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getBookingStats: (params) => api.get('/reports/bookings', { params }),
  getUserStats: () => api.get('/reports/users'),
  getPopularServices: () => api.get('/reports/popular-services'),
  getStatistics: (params) => api.get('/reports/statistics', { params }),
};

// API xác thực
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => 
    api.post('/auth/reset-password', { token, newPassword }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// API cho quản lý chuyến bay
export const flightsAPI = {
  getAll: (params) => api.get('/flights', { params }),
  search: (params) => api.get('/flights/search', { params }),
  getDomestic: (params) => api.get('/flights/domestic', { params }),
  getInternational: (params) => api.get('/flights/international', { params }),
  getById: (flightIata, date) => api.get(`/flights/${flightIata}/${date}`),
  getAirports: (params) => api.get('/flights/airports', { params }),
  getAirlines: (params) => api.get('/flights/airlines', { params }),
  getSchedules: (iataCode, type, params) => api.get(`/flights/schedules/${iataCode}/${type}`, { params }),
  getFutureFlights: (iataCode, type, date, params) => api.get(`/flights/future/${iataCode}/${type}/${date}`, { params }),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),
};

// API cho quản lý đặt vé máy bay
export const flightBookingsAPI = {
  getAll: (params) => api.get('/flight-bookings', { params }),
  getById: (id) => api.get(`/flight-bookings/${id}`),
  create: (data) => api.post('/flight-bookings', data),
  update: (id, data) => api.put(`/flight-bookings/${id}`, data),
  updateStatus: (id, status) => api.put(`/flight-bookings/${id}/status`, { status }),
  cancelBooking: (id) => api.put(`/flight-bookings/${id}/cancel`),
  confirmBooking: (id) => api.put(`/flight-bookings/${id}/confirm`),
  delete: (id) => api.delete(`/flight-bookings/${id}`),
  getStats: () => api.get('/flight-bookings/stats'),
};

// API cho quản lý cài đặt
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export default api; 