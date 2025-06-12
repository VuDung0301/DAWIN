import api from './api';

export const authService = {
  // Đăng ký tài khoản mới
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      // Lưu thông tin user nếu có
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.get('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (userData) => {
    const response = await api.put('/auth/updatedetails', userData);
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/updatepassword', passwordData);
    return response.data;
  },

  // Kiểm tra trạng thái đăng nhập
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Lấy thông tin user từ localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Lỗi parse user data:', error);
      return null;
    }
  },
};

export default authService; 