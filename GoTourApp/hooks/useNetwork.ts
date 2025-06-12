import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook để kiểm tra trạng thái kết nối mạng
 */
export const useNetwork = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Kiểm tra kết nối ban đầu
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Kiểm tra kết nối đến một host cụ thể
   * @param host Tên miền cần kiểm tra
   * @returns Promise<boolean> Kết quả kiểm tra
   */
  const checkConnection = async (host: string = 'google.com'): Promise<boolean> => {
    try {
      // Sử dụng AbortController để tạo timeout cho fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout
      
      // Cố gắng ping
      const response = await fetch(`https://${host}`, { 
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return response.status === 200;
    } catch (error) {
      console.error('Lỗi khi kiểm tra kết nối:', error);
      return false;
    }
  };

  return {
    isConnected,
    isInternetReachable,
    checkConnection,
  };
};

export default useNetwork; 