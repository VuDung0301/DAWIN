import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * Hook đơn giản để hiển thị thông báo
 */
export const useToast = () => {
  const [isVisible, setIsVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    // Sử dụng Alert của React Native thay thế cho toast
    Alert.alert(
      type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo',
      message,
      [{ text: 'OK' }]
    );
    
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, duration);
  };

  return {
    isVisible,
    showToast,
  };
}; 