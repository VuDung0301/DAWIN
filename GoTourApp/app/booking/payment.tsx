import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { PaymentResponse, paymentService } from '@/lib/api/payment';
import SePayTransferInfo from '@/components/SePayTransferInfo';

export default function PaymentScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Lấy thông tin thanh toán khi component mount
  useEffect(() => {
    loadPayment();
  }, [paymentId]);
  
  // Kiểm tra định kỳ trạng thái thanh toán nếu đang pending
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (payment && payment.status === 'pending') {
      intervalId = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Kiểm tra mỗi 10 giây
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [payment?.status]);

  const loadPayment = async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      const data = await paymentService.getPayment(paymentId);
      setPayment(data);
      
      // Nếu không phải trạng thái chờ, không cần kiểm tra định kỳ
      if (data.status !== 'pending') {
        console.log('Thanh toán đã hoàn tất hoặc thất bại, không kiểm tra định kỳ');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin thanh toán:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentId || checking) return;

    try {
      setChecking(true);
      const data = await paymentService.checkPaymentStatus(paymentId);
      
      // Kiểm tra nếu data là null (có thể do lỗi kết nối)
      if (!data) {
        console.log('Không nhận được dữ liệu khi kiểm tra trạng thái thanh toán');
        return;
      }
      
      // Cập nhật dữ liệu mới nếu có thay đổi
      if (JSON.stringify(data) !== JSON.stringify(payment)) {
        setPayment(data);
        
        // Nếu thanh toán đã hoàn tất, hiển thị thông báo
        if (data.status === 'completed' && payment?.status !== 'completed') {
          console.log('Giao dịch đã hoàn tất thành công');
          Alert.alert(
            'Thanh toán thành công',
            'Thanh toán của bạn đã được xác nhận. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Chuyển về trang chi tiết đặt chỗ nếu có
                  if (data.booking && data.bookingModel) {
                    router.push({
                      pathname: '/booking/confirmation',
                      params: {
                        bookingId: data.booking,
                        type: data.bookingModel.toLowerCase().replace('booking', '')
                      }
                    });
                  } else {
                    router.push('/(tabs)');
                  }
                }
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      
      // Nếu đang làm mới thủ công, hiển thị thông báo lỗi
      if (refreshing) {
        // Hiển thị thông báo lỗi phù hợp dựa vào loại lỗi
        let errorMessage = 'Không thể kiểm tra trạng thái thanh toán.';
        
        if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.originalError && error.originalError.message) {
          if (error.originalError.code === 'ECONNABORTED') {
            errorMessage = 'Kết nối đến máy chủ quá chậm. Vui lòng thử lại sau.';
          } else if (error.originalError.code === 'ERR_NETWORK' || error.originalError.code === 'ENOTFOUND') {
            errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
          }
        }
        
        Alert.alert(
          'Lỗi kết nối',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
      // Nếu đang kiểm tra tự động, chỉ log lỗi không hiển thị thông báo
    } finally {
      setChecking(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkPaymentStatus();
    setRefreshing(false);
  };

  // Hiển thị trạng thái thanh toán
  const renderPaymentStatus = () => {
    if (!payment) return null;

    let statusText = '';
    let statusColor = '';
    let statusIcon = '';
    let statusDescription = '';

    switch (payment.status) {
      case 'pending':
        statusText = 'Đang chờ thanh toán';
        statusColor = '#f39c12';
        statusIcon = 'time-outline';
        statusDescription = 'Vui lòng hoàn tất thanh toán để tiếp tục giao dịch';
        break;
      case 'completed':
        statusText = 'Đã thanh toán';
        statusColor = '#2ecc71';
        statusIcon = 'checkmark-circle-outline';
        statusDescription = 'Thanh toán của bạn đã được xác nhận';
        break;
      case 'failed':
        statusText = 'Thanh toán thất bại';
        statusColor = '#e74c3c';
        statusIcon = 'close-circle-outline';
        statusDescription = 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại';
        break;
      case 'refunded':
        statusText = 'Đã hoàn tiền';
        statusColor = '#3498db';
        statusIcon = 'refresh-outline';
        statusDescription = 'Số tiền đã được hoàn trả về tài khoản của bạn';
        break;
    }

    return (
      <View style={[styles.statusContainer, { borderColor: statusColor }]}>
        <Ionicons name={statusIcon as any} size={24} color={statusColor} />
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          <Text style={[styles.statusDescription, { color: colors.tabIconDefault }]}>
            {statusDescription}
          </Text>
        </View>
        {(checking || payment.status === 'pending') && (
          <ActivityIndicator size="small" color={statusColor} style={styles.statusLoader} />
        )}
      </View>
    );
  };

  // Render thông tin thanh toán
  const renderPaymentMethod = () => {
    if (!payment) return null;

    // SePay là phương thức thanh toán duy nhất
    if (payment.sePayInfo) {
      return (
        <SePayTransferInfo 
          sePayInfo={payment.sePayInfo} 
          amount={payment.amount} 
        />
      );
    } else {
      // Nếu không có sePayInfo, hiển thị thông báo lỗi
      return (
        <View style={[styles.errorContainer, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Thông tin thanh toán SePay không có sẵn
          </Text>
          <Text style={[styles.errorText, { color: colors.tabIconDefault }]}>
            Không thể tải thông tin thanh toán SePay. Vui lòng thử làm mới trang hoặc liên hệ hỗ trợ.
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.tint }]}
            onPress={checkPaymentStatus}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải thông tin thanh toán...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Thanh toán qua SePay' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderPaymentStatus()}
        
        <View style={styles.detailsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiết thanh toán</Text>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Mã thanh toán:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{payment?._id || '-'}</Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Số tiền:</Text>
            <Text style={[styles.detailValue, styles.amountText, { color: colors.tint }]}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0
              }).format(payment?.amount || 0)}
            </Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Phương thức:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>SePay</Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Ngày tạo:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {payment?.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : '-'}
            </Text>
          </View>
          
          {payment?.paymentDate && (
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Ngày thanh toán:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(payment.paymentDate).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
          
          {payment?.sePayInfo?.webhookReceived && (
            <View style={[styles.webhookBadge, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.webhookText}>Đã nhận xác nhận thanh toán từ SePay</Text>
            </View>
          )}
        </View>
        
        {renderPaymentMethod()}
        
        {payment?.status === 'pending' && (
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.tabIconDefault} />
            <Text style={[styles.instructionText, { color: colors.tabIconDefault }]}>
              Sau khi thanh toán, hệ thống sẽ tự động xác nhận và cập nhật trạng thái đơn hàng của bạn. 
              Quá trình này có thể mất vài phút. Kéo xuống để làm mới trang.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Nút quay về trang chi tiết đặt chỗ */}
      {payment?.booking && payment?.bookingModel && (
        <View style={[styles.backButtonContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => {
              router.push({
                pathname: '/booking/confirmation',
                params: {
                  bookingId: payment.booking,
                  type: payment.bookingModel.toLowerCase().replace('booking', '')
                }
              });
            }}
          >
            <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Quay về chi tiết đặt chỗ</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  statusLoader: {
    marginLeft: 8,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  noMethodContainer: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMethodText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  backButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  qrButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  webhookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  webhookText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
}); 