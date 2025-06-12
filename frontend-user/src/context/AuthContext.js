import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra đăng nhập khi khởi động ứng dụng
    const checkLoginStatus = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Thử lấy thông tin user từ localStorage trước
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            console.log('Đã tìm thấy thông tin user trong localStorage:', storedUser);
            setCurrentUser(storedUser);
          }
          
          // Sau đó gọi API để cập nhật thông tin mới nhất
          const userData = await authService.getCurrentUser();
          if (userData.success && userData.data) {
            console.log('Cập nhật thông tin user từ API:', userData.data);
            setCurrentUser(userData.data);
            // Cập nhật lại localStorage
            localStorage.setItem('user', JSON.stringify(userData.data));
          }
        } catch (error) {
          console.error('Lỗi lấy thông tin người dùng:', error);
          // Nếu có lỗi với API, vẫn giữ thông tin từ localStorage nếu có
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setCurrentUser(storedUser);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    checkLoginStatus();
  }, []);

  // Đăng nhập
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      
      // Sử dụng thông tin user từ response hoặc lấy từ localStorage
      const user = response.user || response.data?.user || authService.getStoredUser();
      if (user) {
        console.log('Setting user after login:', user);
        setCurrentUser(user);
      }
      
      toast.success('Đăng nhập thành công!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      toast.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      // Vẫn clear dữ liệu local ngay cả khi API lỗi
      setCurrentUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thông tin người dùng
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      setCurrentUser(response.data);
      toast.success('Cập nhật thông tin thành công!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword(passwordData);
      toast.success('Đổi mật khẩu thành công!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 