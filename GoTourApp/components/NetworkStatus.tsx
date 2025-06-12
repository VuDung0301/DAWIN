import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useNetwork from '@/hooks/useNetwork';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Component hiển thị trạng thái kết nối mạng
 */
export const NetworkStatus = () => {
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Nếu kết nối bình thường, không hiển thị gì
  if (isConnected === true && isInternetReachable === true) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.error }]}>
      <Ionicons name="cloud-offline-outline" size={20} color="white" />
      <Text style={styles.text}>
        {isConnected === false
          ? 'Không có kết nối mạng'
          : isInternetReachable === false
          ? 'Không thể kết nối đến internet'
          : 'Đang kiểm tra kết nối...'}
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => checkConnection()}
      >
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40, // Tính cả vùng an toàn phía trên
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  text: {
    color: 'white',
    marginLeft: 8,
  },
  retryButton: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
  },
});

export default NetworkStatus; 