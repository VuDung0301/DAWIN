import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clipboard } from '@react-native-community/clipboard';
import { Toast } from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';

const PaymentDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { payment } = route.params;

  const [qrCode, setQrCode] = useState('');

  return (
    <View style={styles.container}>
      {/* Hiển thị thông tin SePay nếu có */}
      {payment?.paymentMethod === 'sepay' && payment?.sePayInfo && (
        <View style={styles.sePayContainer}>
          <Text style={styles.sectionTitle}>Thanh toán qua SePay</Text>
          
          <View style={styles.qrContainer}>
            {/* Sử dụng Image thay vì QRCode để hiển thị mã QR từ URL */}
            <Image
              source={{ uri: payment.sePayInfo.qrCodeUrl }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.sePayDetails}>
            <Text style={styles.instructionText}>
              1. Mở ứng dụng ngân hàng hoặc ví điện tử của bạn
            </Text>
            <Text style={styles.instructionText}>
              2. Quét mã QR bên trên để thanh toán
            </Text>
            <Text style={styles.instructionText}>
              3. Hoặc chuyển khoản thủ công với nội dung:
            </Text>
            
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceText}>{payment.sePayInfo.reference}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  Clipboard.setString(payment.sePayInfo.reference);
                  Toast.show({
                    type: 'success',
                    text1: 'Đã sao chép nội dung chuyển khoản',
                  });
                }}
              >
                <Icon name="copy-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.noteText}>
              * Vui lòng KHÔNG thay đổi nội dung chuyển khoản để hệ thống có thể xác nhận thanh toán của bạn.
            </Text>
          </View>
        </View>
      )}
      
      {/* Hiển thị thông tin thanh toán */}
      <View style={styles.paymentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã thanh toán:</Text>
          <Text style={styles.infoValue}>{payment?._id}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số tiền:</Text>
          <Text style={styles.amountValue}>{payment?.amount?.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phương thức:</Text>
          <Text style={styles.infoValue}>
            {payment?.paymentMethod === 'sepay' ? 'SePay' : 
             payment?.paymentMethod === 'BankTransfer' ? 'Chuyển khoản ngân hàng' : 
             payment?.paymentMethod === 'card' ? 'Thẻ tín dụng' : 
             payment?.paymentMethod}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <View style={[
            styles.statusContainer,
            { 
              backgroundColor: payment?.status === 'completed' ? '#e6f7ee' : 
                               payment?.status === 'pending' ? '#fff8e6' : 
                               payment?.status === 'failed' ? '#ffeeee' : '#f5f5f5'
            }
          ]}>
            <Text style={[
              styles.statusText,
              { 
                color: payment?.status === 'completed' ? '#00a650' : 
                       payment?.status === 'pending' ? '#f5a623' : 
                       payment?.status === 'failed' ? '#d0021b' : '#666'
              }
            ]}>
              {payment?.status === 'completed' ? 'Đã thanh toán' : 
               payment?.status === 'pending' ? 'Đang chờ thanh toán' : 
               payment?.status === 'failed' ? 'Thanh toán thất bại' : 
               payment?.status}
            </Text>
          </View>
        </View>
        
        {payment?.paymentDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
            <Text style={styles.infoValue}>
              {new Date(payment.paymentDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  sePayContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.primary,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  sePayDetails: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
    lineHeight: 20,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#ddeeff',
  },
  referenceText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  noteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  paymentInfo: {
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
};

export default PaymentDetailScreen; 