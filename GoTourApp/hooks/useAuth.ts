import { useState, useEffect, createContext, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { authApi } from '@/lib/api';

// Định nghĩa kiểu dữ liệu cho context
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUserInfo: (userData: { name?: string; email?: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
}

// Tạo context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage key
const TOKEN_KEY = 'auth_token';

// Hook để quản lý authentication
export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token và lấy thông tin user khi khởi động
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        
        if (storedToken) {
          setToken(storedToken);
          const response = await authApi.getMe(storedToken);
          
          if (response.success && response.data && response.data.user) {
            setUser(response.data.user);
          } else {
            // Token không hợp lệ hoặc hết hạn
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        // Reset token trong trường hợp lỗi
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (e) {
          console.error('Không thể xóa token:', e);
        }
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromToken();
  }, []);

  // Đăng nhập
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      
      // Kiểm tra lỗi mạng
      if (response.statusCode === 0 && response.message === 'Không thể kết nối đến server') {
        return { 
          success: false, 
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.'
        };
      }
      
      if (response.success && response.token && response.data) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.token);
        setToken(response.token);
        setUser(response.data.user);
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.message || 'Đăng nhập không thành công' 
      };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi đăng nhập' };
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData: { name: string; email: string; password: string; phone?: string }) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      
      // Kiểm tra lỗi mạng
      if (response.statusCode === 0 && response.message === 'Không thể kết nối đến server') {
        return { 
          success: false, 
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.'
        };
      }
      
      if (response.success) {
        // Không tự động đăng nhập sau khi đăng ký
        // Trả về kết quả thành công nhưng không lưu token hay user data
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.message || 'Đăng ký không thành công' 
      };
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi đăng ký' };
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      // Dù có lỗi hay không, vẫn xóa token và reset state
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  // Cập nhật thông tin người dùng
  const updateUserInfo = async (userData: { name?: string; email?: string; phone?: string }) => {
    if (!token) {
      return { success: false, message: 'Bạn chưa đăng nhập' };
    }
    
    try {
      setIsLoading(true);
      const response = await authApi.updateDetails(token, userData);
      
      if (response.success && response.data && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.message || 'Cập nhật không thành công' 
      };
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi cập nhật' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserInfo,
  };
};

// Hook để sử dụng Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
}; 