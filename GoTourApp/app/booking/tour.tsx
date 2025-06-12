import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Tour } from '@/types';
import { toursApi, bookingsApi } from '@/lib/api';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BookingSummary } from '@/components/BookingSummary';
import { TextInput } from '@/components/ui/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '@/lib/api/payment';
import { NumberInput } from '@/components/ui/NumberInput';

export default function BookTourScreen() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Thông tin đặt tour
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // Lỗi validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentStep, setCurrentStep] = useState(1);
  // SePay là phương thức thanh toán duy nhất
  const paymentMethod = 'sepay';
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const bookingSteps = ['Chi tiết tour', 'Thông tin khách hàng', 'Thanh toán', 'Xác nhận'];
  
  const calculateTotalPrice = () => {
    if (!tour) return 0;
    const price = tour.priceDiscount || tour.price;
    return price * numberOfPeople;
  };
  
  // Booking data for summary
  const bookingData = {
    tour: tour,
    date: selectedDate,
    guests: {
      adults: numberOfPeople,
      children: 0,
    },
    totalPrice: calculateTotalPrice(),
    contactInfo: {
      fullName,
      email,
      phone,
    },
    specialRequests,
  };
  
  // Lấy danh sách ngày khởi hành khả dụng
  const getAvailableDates = () => {
    if (!tour || !tour.startDates) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tour.startDates
      .map(dateStr => new Date(dateStr))
      .filter(date => date >= today)
      .sort((a, b) => a.getTime() - b.getTime());
  };
  
  useEffect(() => {
    fetchTourData();
    
    // Điền thông tin người dùng nếu đã đăng nhập
    if (user) {
      setContactName(user.name || '');
      setContactEmail(user.email || '');
      setContactPhone(user.phone || '');
      
      // Cập nhật thông tin form
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [tourId, user]);

  const fetchTourData = async () => {
    if (!tourId) return;

    setIsLoading(true);
    try {
      const response = await toursApi.getById(tourId);
      if (response.success && response.data) {
        setTour(response.data);
        
        // Đặt ngày khởi hành mặc định là ngày đầu tiên trong danh sách khả dụng
        const availableDates = response.data.startDates
          ? response.data.startDates
              .map((dateStr: string) => new Date(dateStr))
              .filter((date: Date) => date >= new Date())
              .sort((a: Date, b: Date) => a.getTime() - b.getTime())
          : [];
        
        if (availableDates.length > 0) {
          setSelectedDate(availableDates[0]);
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin tour');
        router.back();
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tour:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      setErrors({ ...errors, selectedDate: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validation cho step 1 (chi tiết tour)
    if (currentStep === 1) {
      if (!selectedDate) {
        newErrors.selectedDate = 'Vui lòng chọn ngày khởi hành';
      }
      
      if (numberOfPeople < 1) {
        newErrors.numberOfPeople = 'Số người phải lớn hơn 0';
      } else if (tour && numberOfPeople > tour.maxGroupSize) {
        newErrors.numberOfPeople = `Số người tối đa là ${tour.maxGroupSize}`;
      }
    }
    
    // Validation cho step 2 (thông tin khách hàng)
    if (currentStep === 2) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập tên liên hệ';
      }
      
      if (!phone.trim()) {
        newErrors.phone = 'Vui lòng nhập số điện thoại';
      } else if (!/^[0-9]{10}$/.test(phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
      }
      
      if (!email.trim()) {
        newErrors.email = 'Vui lòng nhập email';
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        newErrors.email = 'Email không hợp lệ';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookTour = async () => {
    if (!tour || !selectedDate) return;
    
    setIsSubmitting(true);
    try {
      // Tính toán tổng tiền trực tiếp
      const totalPrice = calculateTotalPrice();
      
      console.log('Tổng tiền tính toán:', totalPrice);
      
      const bookingData = {
        tourId: tourId,
        startDate: selectedDate.toISOString(),
        numOfPeople: numberOfPeople,
        contactName: fullName,
        contactEmail: email,
        contactPhone: phone,
        specialRequests,
        totalPrice: totalPrice,
        status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        paymentMethod: 'sepay',
      };
      
      // Kiểm tra token trước khi gọi API
      if (!token) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để đặt tour');
        router.push('/(auth)/login');
        return;
      }
      
      console.log('Gửi yêu cầu đặt tour:', JSON.stringify(bookingData));
      
      // Trước tiên kiểm tra khả dụng của tour
      const testResponse = await bookingsApi.testTourBooking(
        tourId,
        selectedDate.toISOString(),
        numberOfPeople
      );
      
      if (!testResponse.success) {
        Alert.alert('Không thể đặt tour', testResponse.message || 'Vui lòng kiểm tra lại thông tin đặt tour');
        return;
      }
      
      // Tiếp tục đặt tour nếu kiểm tra thành công
      const response = await bookingsApi.bookTour(bookingData, token);
      
      if (response.success) {
        console.log('Đặt tour thành công, ID:', response.data._id);
        
        try {
          // Hiển thị thông báo đang tạo thanh toán
          Alert.alert(
            'Đặt tour thành công',
            'Đang chuyển đến trang thanh toán...',
            [{ text: 'OK' }],
            { cancelable: false }
          );
          
          // Tạo payment request
          const paymentRequest = {
            bookingId: response.data._id,
            bookingType: 'tour',
            amount: totalPrice,
            paymentMethod: 'sepay'
          };
          
          console.log('Tạo yêu cầu thanh toán:', JSON.stringify(paymentRequest));
          
          // Gọi API tạo thanh toán
          const paymentResponse = await paymentService.createPayment(paymentRequest);
          console.log('Kết quả tạo thanh toán:', paymentResponse);
          
          // Điều hướng đến trang thanh toán trực tiếp
          router.push({
            pathname: '/booking/payment',
            params: { paymentId: paymentResponse._id }
          });
        } catch (paymentError) {
          console.error('Lỗi khi tạo thanh toán:', paymentError);
          // Vẫn điều hướng đến trang xác nhận nhưng không có payment ID
          router.push({
            pathname: '/booking/confirmation',
            params: { 
              bookingId: response.data._id,
              type: 'tour'
            }
          });
        }
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đặt tour. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi đặt tour:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đặt tour. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
  };

  // Tour Info Summary
  const renderTourSummary = () => {
    if (!tour) return null;

    // Sử dụng kiểm tra an toàn cho các thuộc tính
    const coverImage = tour.coverImage || '';
    const locations = tour.locations || [];
    const startLocation = tour.startLocation || {};
    const duration = tour.duration || 1;
    const startDates = tour.startDates || [];
    const maxGroupSize = tour.maxGroupSize || 10;
    const price = tour.price || 0;
    const priceDiscount = tour.priceDiscount;

    return (
      <View style={[styles.tourCard, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.tourHeader}>
          <Text style={[styles.tourName, { color: colors.text }]}>{tour.name}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(tour.difficulty) }]}>
            <Text style={styles.difficultyText}>{tour.difficulty}</Text>
          </View>
        </View>
        
        {coverImage && (
          <Image 
            source={{ uri: coverImage }} 
            style={styles.tourImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.tourHighlights}>
          <View style={styles.highlightItem}>
            <Ionicons name="location-outline" size={18} color={colors.tint} />
            <Text style={[styles.highlightText, { color: colors.text }]}>
              {locations.length > 0 ? 
                `${locations.length} điểm tham quan` : 
                startLocation.description || "Điểm khởi hành"}
            </Text>
          </View>
          
          <View style={styles.highlightItem}>
            <Ionicons name="time-outline" size={18} color={colors.tint} />
            <Text style={[styles.highlightText, { color: colors.text }]}>
              {duration} ngày {duration > 1 ? `(${duration - 1} đêm)` : ''}
            </Text>
          </View>
          
          <View style={styles.highlightItem}>
            <Ionicons name="calendar-outline" size={18} color={colors.tint} />
            <Text style={[styles.highlightText, { color: colors.text }]}>
              {startDates.length} lịch khởi hành
            </Text>
          </View>
          
          <View style={styles.highlightItem}>
            <Ionicons name="people-outline" size={18} color={colors.tint} />
            <Text style={[styles.highlightText, { color: colors.text }]}>
              Tối đa {maxGroupSize} người/nhóm
            </Text>
          </View>
        </View>
        
        <View style={[styles.tourInfoDivider, { backgroundColor: colors.border }]} />
        
        <View style={styles.tourPriceInfo}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Giá gốc:</Text>
            <Text style={[styles.priceValue, { color: colors.text, textDecorationLine: priceDiscount ? 'line-through' : 'none' }]}>
              {price.toLocaleString('vi-VN')}đ/người
            </Text>
          </View>
          
          {priceDiscount && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Giá ưu đãi:</Text>
              <Text style={[styles.discountPrice, { color: colors.tint }]}>
                {priceDiscount.toLocaleString('vi-VN')}đ/người
              </Text>
            </View>
          )}
          
          {priceDiscount && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Tiết kiệm:</Text>
              <Text style={[styles.savingPrice, { color: '#4CAF50' }]}>
                {(price - priceDiscount).toLocaleString('vi-VN')}đ/người ({Math.round((price - priceDiscount) / price * 100)}%)
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate tour details
      if (!selectedDate) {
        Alert.alert('Thông báo', 'Vui lòng chọn ngày khởi hành');
        return;
      }
      if (numberOfPeople < 1) {
        Alert.alert('Thông báo', 'Số người phải lớn hơn 0');
        return;
      }
      if (tour && numberOfPeople > tour.maxGroupSize) {
        Alert.alert('Thông báo', `Số người tối đa là ${tour.maxGroupSize}`);
        return;
      }
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate customer information
      if (!fullName.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập họ tên người đặt tour');
        return;
      }
      if (!email.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập email liên hệ');
        return;
      }
      if (!phone.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại liên hệ');
        return;
      }
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };
  
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin tour</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.tint }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Thông tin người đặt tour</Text>
            
            {/* Custom Date Picker cho danh sách ngày khởi hành */}
            <View style={styles.datePickerContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Ngày khởi hành</Text>
              <TouchableOpacity 
                style={[styles.datePickerButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                onPress={() => {
                  const availableDates = getAvailableDates();
                  if (availableDates.length === 0) {
                    Alert.alert('Thông báo', 'Hiện tại tour không có lịch khởi hành khả dụng');
                    return;
                  }
                  
                  const dateOptions = availableDates.map((date, index) => ({
                    text: format(date, 'EEEE, dd/MM/yyyy', { locale: vi }),
                    onPress: () => setSelectedDate(date)
                  }));
                  
                  Alert.alert(
                    'Chọn ngày khởi hành',
                    'Vui lòng chọn ngày khởi hành phù hợp:',
                    [
                      ...dateOptions,
                      { text: 'Hủy', style: 'cancel' }
                    ]
                  );
                }}
              >
                <View style={styles.datePickerContent}>
                  <Ionicons name="calendar-outline" size={20} color={colors.tabIconDefault} />
                  <Text style={[styles.datePickerText, { color: selectedDate ? colors.text : colors.tabIconDefault }]}>
                    {selectedDate ? format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi }) : 'Chọn ngày khởi hành'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color={colors.tabIconDefault} />
              </TouchableOpacity>
              
              {/* Hiển thị số lịch khởi hành khả dụng */}
              <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
                Có {getAvailableDates().length} lịch khởi hành khả dụng
              </Text>
            </View>
            
                         <NumberInput
               label="Số người"
               value={numberOfPeople}
               onValueChange={setNumberOfPeople}
               min={1}
               max={tour?.maxGroupSize || 10}
               helperText={`Tối đa ${tour?.maxGroupSize || 10} người/nhóm`}
             />
            
            <TextInput
              label="Yêu cầu đặc biệt (nếu có)"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Ví dụ: thức ăn chay, ghế trẻ em..."
              multiline
              numberOfLines={3}
              icon="document-text-outline"
            />
          </View>
        );
        
      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Thông tin khách hàng</Text>
            
            <TextInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              icon="person-outline"
            />
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email liên hệ"
              keyboardType="email-address"
              icon="mail-outline"
            />
            
            <TextInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              icon="call-outline"
            />
          </View>
                  );
          
        case 3:
          return (
            <View style={styles.paymentContainer}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Phương thức thanh toán</Text>
              
              <View style={[styles.paymentMethodContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.paymentMethodHeader}>
                  <Ionicons name="wallet-outline" size={24} color={colors.tint} />
                  <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>SePay</Text>
                </View>
                
                <Text style={[styles.paymentMethodDescription, { color: colors.tabIconDefault }]}>
                  Thanh toán an toàn và nhanh chóng qua SePay. Bạn sẽ được chuyển đến trang thanh toán SePay sau khi xác nhận đặt tour.
                </Text>
                
                <View style={[styles.paymentAmountContainer, { backgroundColor: colors.background }]}>
                  <Text style={[styles.paymentAmountLabel, { color: colors.tabIconDefault }]}>Số tiền thanh toán:</Text>
                  <Text style={[styles.paymentAmount, { color: colors.tint }]}>
                    {calculateTotalPrice().toLocaleString('vi-VN')} VND
                  </Text>
                </View>
                
                {/* Hiển thị chi tiết giá */}
                <View style={[styles.priceBreakdown, { backgroundColor: colors.background }]}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>
                      Giá tour ({numberOfPeople} người):
                    </Text>
                    <Text style={[styles.priceValue, { color: colors.text }]}>
                      {((tour?.priceDiscount || tour?.price || 0) * numberOfPeople).toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                  
                  {tour?.priceDiscount && tour?.price && tour.priceDiscount < tour.price && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.discountLabel, { color: '#4CAF50' }]}>
                        Tiết kiệm:
                      </Text>
                      <Text style={[styles.discountValue, { color: '#4CAF50' }]}>
                        -{((tour.price - tour.priceDiscount) * numberOfPeople).toLocaleString('vi-VN')} VND
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng cộng:</Text>
                    <Text style={[styles.totalValue, { color: colors.tint }]}>
                      {calculateTotalPrice().toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
          
        case 4:
          return (
            <View style={styles.confirmationContainer}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Xác nhận thông tin đặt tour</Text>
              
              <BookingSummary
                type="tour"
                data={{
                  tour: tour,
                  startDate: selectedDate,
                  people: numberOfPeople,
                  totalPrice: calculateTotalPrice(),
                  contactInfo: { fullName, email, phone },
                  paymentMethod: 'sepay'
                }}
              />
              
              <View style={styles.termsContainer}>
                <Ionicons name="information-circle-outline" size={20} color={colors.tabIconDefault} />
                <Text style={[styles.termsText, { color: colors.tabIconDefault }]}>
                  Bằng cách nhấn "Xác nhận đặt tour", bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
                </Text>
              </View>
            </View>
          );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: 'Đặt tour du lịch',
          headerShown: true,
        }}
      />

      <View style={styles.stepIndicatorContainer}>
        <StepIndicator
          steps={bookingSteps}
          currentStep={currentStep - 1}
          completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i)}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Tour Summary */}
          {renderTourSummary()}

          <View style={styles.formContainer}>
            {renderCurrentStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Button
            onPress={goBack}
            title={currentStep === 1 ? 'Quay lại' : 'Trước đó'}
            variant="secondary"
          />
        </View>
        
        <View style={{ flex: 1 }}>
          {currentStep < 4 ? (
            <Button
              onPress={goToNextStep}
              title="Tiếp theo"
              variant="primary"
            />
          ) : (
            <Button
              onPress={handleBookTour}
              isLoading={isSubmitting}
              title="Xác nhận đặt tour"
              variant="primary"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Hàm lấy màu dựa vào độ khó
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'dễ':
      return '#4CAF50';
    case 'trung bình':
      return '#FF9800';
    case 'khó':
      return '#F44336';
    default:
      return '#4CAF50';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  tourCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tourHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tourName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  tourImage: {
    width: '100%',
    height: 180,
  },
  tourHighlights: {
    padding: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightText: {
    marginLeft: 8,
    fontSize: 14,
  },
  tourInfoDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  tourPriceInfo: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  savingPrice: {
    fontSize: 14,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentContainer: {
    marginBottom: 20,
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  paymentSummary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  paymentMethodContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paymentMethodDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  paymentAmountContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  paymentAmountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceBreakdown: {
    borderRadius: 8,
    padding: 12,
  },
  discountLabel: {
    fontSize: 14,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  termsText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stepIndicatorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  selectedPaymentMethod: {
    // Add any necessary styles for selected payment method
  },
  paymentMethodContainer: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  paymentMethodDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  paymentAmountContainer: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  paymentAmountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 