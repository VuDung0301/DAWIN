import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

interface SePayTransferInfoProps {
  sePayInfo: {
    transactionId: string;
    qrCodeUrl: string;
    reference: string;
    webhookReceived?: boolean;
  };
  amount: number;
}

const SePayTransferInfo: React.FC<SePayTransferInfoProps> = ({ sePayInfo, amount }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [savingQR, setSavingQR] = useState(false);
  const [isQRError, setIsQRError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(`Đã sao chép ${label}`, `${label} đã được sao chép vào clipboard.`);
  };

  const saveQRCodeToGallery = async () => {
    try {
      if (!sePayInfo.qrCodeUrl) {
        Alert.alert('Lỗi', 'Không tìm thấy mã QR');
        return;
      }

      setSavingQR(true);

      // Kiểm tra quyền truy cập vào thư viện media
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập vào thư viện ảnh của bạn.');
        setSavingQR(false);
        return;
      }

      // Tạo tên file
      const fileName = `SePay_QR_${Date.now()}.png`;
      
      // Nếu là URL base64
      if (sePayInfo.qrCodeUrl.startsWith('data:image/')) {
        const fileUri = FileSystem.documentDirectory + fileName;
        
        // Lưu base64 image vào file
        await FileSystem.writeAsStringAsync(
          fileUri, 
          sePayInfo.qrCodeUrl.split(',')[1], 
          { encoding: FileSystem.EncodingType.Base64 }
        );
        
        // Lưu file vào thư viện ảnh
        await MediaLibrary.saveToLibraryAsync(fileUri);
        
        Alert.alert('Thành công', 'Mã QR đã được lưu vào thư viện ảnh.');
      } else {
        // Nếu là URL thông thường
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        // Tải file từ URL
        const downloadedFile = await FileSystem.downloadAsync(
          sePayInfo.qrCodeUrl,
          fileUri
        );
        
        // Lưu file vào thư viện ảnh
        await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
        
        Alert.alert('Thành công', 'Mã QR đã được lưu vào thư viện ảnh.');
      }
    } catch (error) {
      console.error('Lỗi khi lưu mã QR:', error);
      Alert.alert('Lỗi', 'Không thể lưu mã QR. Vui lòng thử lại sau.');
    } finally {
      setSavingQR(false);
    }
  };

  const shareQRCode = async () => {
    try {
      if (!sePayInfo.qrCodeUrl) {
        Alert.alert('Lỗi', 'Không tìm thấy mã QR');
        return;
      }

      setSavingQR(true);

      // Kiểm tra xem thiết bị có hỗ trợ chia sẻ không
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Lỗi', 'Thiết bị của bạn không hỗ trợ chia sẻ');
        setSavingQR(false);
        return;
      }

      // Tạo tên file
      const fileName = `SePay_QR_${Date.now()}.png`;
      
      // Nếu là URL base64
      if (sePayInfo.qrCodeUrl.startsWith('data:image/')) {
        const fileUri = FileSystem.documentDirectory + fileName;
        
        // Lưu base64 image vào file
        await FileSystem.writeAsStringAsync(
          fileUri, 
          sePayInfo.qrCodeUrl.split(',')[1], 
          { encoding: FileSystem.EncodingType.Base64 }
        );
        
        // Chia sẻ file
        await Sharing.shareAsync(fileUri);
      } else {
        // Nếu là URL thông thường
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        // Tải file từ URL
        const downloadedFile = await FileSystem.downloadAsync(
          sePayInfo.qrCodeUrl,
          fileUri
        );
        
        // Chia sẻ file
        await Sharing.shareAsync(downloadedFile.uri);
      }
    } catch (error) {
      console.error('Lỗi khi chia sẻ mã QR:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ mã QR. Vui lòng thử lại sau.');
    } finally {
      setSavingQR(false);
    }
  };

  // Mở ứng dụng SePay nếu có cài đặt
  const openSePayApp = async () => {
    try {
      // Kiểm tra xem có thể mở ứng dụng SePay không
      // Bạn cần thay thế URL scheme thực tế của SePay ở đây
      const url = `sepay://payment?ref=${sePayInfo.reference}&amount=${amount}&id=${sePayInfo.transactionId}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Nếu không cài đặt, chuyển hướng đến trang tải SePay
        Alert.alert(
          'Ứng dụng SePay không được cài đặt',
          'Bạn cần cài đặt ứng dụng SePay để tiếp tục thanh toán. Tải ngay?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Tải SePay', 
              onPress: () => Linking.openURL('https://sepay.vn/apps') 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Lỗi khi mở ứng dụng SePay:', error);
      Alert.alert('Lỗi', 'Không thể mở ứng dụng SePay. Vui lòng thử lại sau.');
    }
  };

  // Xử lý lỗi khi tải mã QR
  const handleQRError = () => {
    setIsQRError(true);
  };

  // Kiểm tra xem có mã QR không
  const hasValidQRCode = sePayInfo && sePayInfo.qrCodeUrl && sePayInfo.qrCodeUrl.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <Text style={styles.headerText}>Thanh toán qua SePay</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          {hasValidQRCode && !isQRError ? (
            <>
              <Image
                source={{ uri: sePayInfo.qrCodeUrl }}
                style={styles.qrCode}
                resizeMode="contain"
                onError={handleQRError}
              />
              <Text style={[styles.scanText, { color: colors.text }]}>
                Quét mã QR để thanh toán
              </Text>
              <View style={styles.qrActions}>
                <TouchableOpacity
                  style={[styles.qrButton, { backgroundColor: colors.tint }]}
                  onPress={saveQRCodeToGallery}
                  disabled={savingQR}
                >
                  {savingQR ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.qrButtonText}>Lưu QR</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.qrButton, { backgroundColor: colors.tint }]}
                  onPress={shareQRCode}
                  disabled={savingQR}
                >
                  {savingQR ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={18} color="#fff" />
                      <Text style={styles.qrButtonText}>Chia sẻ</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.qrError}>
              <Ionicons name="qr-code" size={80} color={colors.tabIconDefault} />
              <Text style={[styles.qrErrorText, { color: colors.text }]}>
                Không thể tải mã QR. Vui lòng sử dụng mã tham chiếu bên dưới để thanh toán.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.transferInfoContainer}>
          <View style={styles.instructionContainer}>
            <Text style={[styles.instructionTitle, { color: colors.text }]}>
              Hướng dẫn thanh toán
            </Text>
            <View style={styles.steps}>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Mở ứng dụng ngân hàng và chọn chức năng Chuyển tiền
                </Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Quét mã QR hoặc chuyển khoản đến tài khoản SePay bên dưới
                </Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Nhập đúng số tiền và <Text style={{fontWeight: 'bold'}}>Nhập chính xác mã tham chiếu</Text> vào mục nội dung chuyển khoản
                </Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Hoàn tất thanh toán và đợi hệ thống xác nhận (thường trong vòng 5 phút)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Tài khoản nhận:
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                CÔNG TY TNHH DAWIN
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard('CÔNG TY TNHH DAWIN', 'Tên tài khoản')}
              >
                <Ionicons name="copy-outline" size={16} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Số tài khoản:
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                12345678910
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard('12345678910', 'Số tài khoản')}
              >
                <Ionicons name="copy-outline" size={16} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Ngân hàng:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              MB - Chi nhánh Hà Nội
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Số tiền:
            </Text>
            <Text style={[styles.infoValue, styles.amountValue, { color: colors.tint }]}>
              {formatPrice(amount)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Mã tham chiếu:
            </Text>
            <View style={styles.infoValueContainer}>
              <Text style={[styles.infoValue, styles.referenceValue, { color: colors.text }]}>
                {sePayInfo.reference}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(sePayInfo.reference, 'Mã tham chiếu')}
              >
                <Ionicons name="copy-outline" size={16} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={18} color="#f39c12" />
            <Text style={styles.warningText}>
              Quan trọng: Sao chép chính xác mã tham chiếu vào nội dung chuyển khoản để hệ thống tự động xác nhận.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.openSePayButton, { backgroundColor: '#4CAF50' }]}
          onPress={openSePayApp}
        >
          <Ionicons name="open-outline" size={20} color="#fff" />
          <Text style={styles.openSePayButtonText}>Mở ứng dụng SePay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    padding: 12,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  scanText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  qrError: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  qrErrorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  qrButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  transferInfoContainer: {
    marginBottom: 16,
  },
  instructionContainer: {
    marginBottom: 16,
  },
  instructionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  steps: {
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '500',
    flex: 1,
  },
  infoValueContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
  },
  copyButton: {
    padding: 4,
  },
  amountValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  referenceValue: {
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 13,
  },
  openSePayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  openSePayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SePayTransferInfo; 