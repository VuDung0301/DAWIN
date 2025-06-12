/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Hook đơn giản để lấy màu theo theme
 */
export const useThemeColor = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Lấy đối tượng màu từ constants/Colors dựa trên theme
  const colors = Colors[colorScheme || 'light'];
  
  // Các màu chung
  const themeColors = {
    text: isDark ? '#FFFFFF' : '#000000',
    background: isDark ? '#121212' : '#FFFFFF',
    card: isDark ? '#1E1E1E' : '#F8F8F8',
    primary: colors.tint || '#2196F3',
    border: isDark ? '#444444' : '#E0E0E0',
    notification: isDark ? '#FF453A' : '#FF3B30',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
  };
  
  return themeColors;
};
