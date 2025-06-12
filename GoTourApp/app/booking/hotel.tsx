import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Hotel, HotelRoom } from '@/types';
import { hotelsApi, bookingsApi, hotelBookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BookingSummary } from '@/components/BookingSummary';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Form cho thông tin đặt phòng
const BookingInfoSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'Tên quá ngắn')
    .max(50, 'Tên quá dài')
    .required('Vui lòng nhập họ tên'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số')
    .required('Vui lòng nhập số điện thoại'),
  identification: Yup.string()
    .matches(/^[0-9]{9,12}$/, 'CCCD/CMND không hợp lệ')
    .required('Vui lòng nhập CCCD/CMND'),
  specialRequests: Yup.string(),
});

export default function HotelBookingScreen() {
  const { 
    hotelId, 
    roomId, 
    roomName, 
    price, 
    checkIn, 
    checkOut, 
    guests 
  } = useLocalSearchParams<{ 
    hotelId: string, 
    roomId: string, 
    roomName: string, 
    price: string, 
    checkIn: string, 
    checkOut: string, 
    guests: string 
  }>();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token, isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<HotelRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomCount, setRoomCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvalidAccess, setIsInvalidAccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const paymentMethod = 'sepay'; // Phương thức thanh toán mặc định - đảm bảo viết thường
  
  // Thông tin đặt phòng
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(addDays(new Date(), 1));
  const [showCheckInDatePicker, setShowCheckInDatePicker] = useState(false);
  const [showCheckOutDatePicker, setShowCheckOutDatePicker] = useState(false);
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Lỗi validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bookingSteps = ['Chọn phòng', 'Thông tin khách hàng', 'Thanh toán', 'Xác nhận'];

  const [numberOfNights, setNumberOfNights] = useState(1);

  useEffect(() => {
    // Kiểm tra xem có đủ thông tin để đặt phòng không
    if (!hotelId || !roomId || !checkIn || !checkOut) {
      setIsInvalidAccess(true);
      Alert.alert(
        'Thông tin không hợp lệ',
        'Không đủ thông tin để đặt phòng. Vui lòng quay lại và chọn phòng.',
        [
          {
            text: 'Quay lại',
            onPress: () => router.back()
          }
        ]
      );
      return;
    }
    
    fetchHotelData();
    
    // Tính số đêm lưu trú khi component mount hoặc khi checkIn/checkOut thay đổi
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const nights = differenceInDays(end, start) || 1;
      setNumberOfNights(nights);
    }
  }, [hotelId, roomId, checkIn, checkOut]);

  const fetchHotelData = async () => {
    setIsLoading(true);
    try {
      const response = await hotelsApi.getById(hotelId);
      if (response.success && response.data) {
        setHotel(response.data);
        
        // Tạo phòng mặc định nếu roomId là 'default' hoặc không tìm thấy phòng
        if (roomId === 'default' || !response.data.roomTypes || response.data.roomTypes.length === 0) {
          // Tạo đối tượng phòng mặc định dựa trên thông tin truyền vào
          const defaultRoom: HotelRoom = {
            _id: roomId,
            name: roomName || 'Phòng tiêu chuẩn',
            pricePerNight: parseFloat(price || '0'),
            capacity: parseInt(guests || '2'),
            description: 'Phòng tiêu chuẩn tại ' + response.data.name,
            amenities: [],
            images: [],
            available: true
          };
          setRoom(defaultRoom);
        } else {
          // Tìm phòng đã chọn trong danh sách phòng nếu có
          const selectedRoom = response.data.roomTypes.find(
            (r: any) => r._id === roomId
          );
          
          if (selectedRoom) {
            setRoom(selectedRoom);
          } else {
            // Nếu không tìm thấy, vẫn dùng thông tin phòng mặc định
            const defaultRoom: HotelRoom = {
              _id: roomId,
              name: roomName || 'Phòng tiêu chuẩn',
              pricePerNight: parseFloat(price || '0'),
              capacity: parseInt(guests || '2'),
              description: 'Phòng tiêu chuẩn tại ' + response.data.name,
              amenities: [],
              images: [],
              available: true
            };
            setRoom(defaultRoom);
          }
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin khách sạn');
        router.back();
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khách sạn:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      identification: '',
      specialRequests: '',
    },
    validationSchema: BookingInfoSchema,
    onSubmit: async (values) => {
      if (!hotel || !room) return;

      // Kiểm tra người dùng đã đăng nhập chưa
      if (!isAuthenticated || !token) {
        Alert.alert(
          'Cần đăng nhập', 
          'Bạn cần đăng nhập để đặt phòng', 
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
          ]
        );
        return;
      }

      setIsSubmitting(true);
      try {
        // Đảm bảo có giá trị nights hợp lệ
        const nights = numberOfNights || 1;
        
        const bookingData = {
          hotelId: hotel._id,
          roomId: room._id || roomId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          guests: parseInt(numberOfGuests || guests || '2'),
          contactName: values.fullName,
          contactEmail: values.email,
          contactPhone: values.phone,
          specialRequests: values.specialRequests,
          totalPrice: calculateTotalPrice(),
          status: 'pending' as 'pending' | 'confirmed' | 'cancelled',
          paymentMethod: 'sepay',
          nights: nights,
          roomCount: roomCount,
        };

        const response = await hotelBookingsApi.create(bookingData, token);
        
        if (response.success) {
          router.push({
            pathname: '/booking/confirmation',
            params: { 
              bookingId: response.data._id,
              type: 'hotel'
            }
          });
        } else {
          Alert.alert('Lỗi', response.message || 'Đã xảy ra lỗi khi đặt phòng');
        }
      } catch (error) {
        console.error('Lỗi khi đặt phòng:', error);
        Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý đặt phòng. Vui lòng thử lại sau.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Format ngày
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  // Tính số đêm
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return differenceInDays(end, start) || 1;
  };

  // Tính tổng tiền
  const calculateTotalPrice = () => {
    if (!room) return 0;
    const nights = numberOfNights; // Sử dụng state đã lưu trữ
    const roomPrice = parseFloat(price || room.pricePerNight?.toString() || '0');
    const totalRoomPrice = roomPrice * nights * roomCount;
    const serviceFee = totalRoomPrice * 0.05; // Phí dịch vụ 5%
    
    return totalRoomPrice + serviceFee;
  };

  // Tăng số lượng phòng
  const increaseRoomCount = () => {
    // Giới hạn số lượng phòng đặt tối đa là 5
    if (roomCount < 5) {
      setRoomCount(prev => prev + 1);
    } else {
      Alert.alert('Thông báo', 'Đã đạt số lượng phòng tối đa có thể đặt');
    }
  };

  // Giảm số lượng phòng
  const decreaseRoomCount = () => {
    if (roomCount > 1) {
      setRoomCount(prev => prev - 1);
    }
  };

  const handleCheckInDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowCheckInDatePicker(false);
    if (event.type === 'set' && date) {
      setCheckInDate(date);
      
      // Tự động cập nhật ngày check-out nếu nhỏ hơn check-in
      if (differenceInDays(checkOutDate, date) < 1) {
        setCheckOutDate(addDays(date, 1));
      }
      
      // Cập nhật số đêm
      const nights = differenceInDays(checkOutDate, date) || 1;
      setNumberOfNights(nights);
      
      setErrors({ ...errors, checkInDate: '' });
    }
  };

  const handleCheckOutDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowCheckOutDatePicker(false);
    if (event.type === 'set' && date) {
      // Đảm bảo ngày check-out sau ngày check-in ít nhất 1 ngày
      if (differenceInDays(date, checkInDate) < 1) {
        Alert.alert('Lưu ý', 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày');
        setCheckOutDate(addDays(checkInDate, 1));
        setNumberOfNights(1);
      } else {
        setCheckOutDate(date);
        // Cập nhật số đêm
        const nights = differenceInDays(date, checkInDate) || 1;
        setNumberOfNights(nights);
      }
      setErrors({ ...errors, checkOutDate: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!checkInDate) {
      newErrors.checkInDate = 'Vui lòng chọn ngày nhận phòng';
    }
    
    if (!checkOutDate) {
      newErrors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
    }
    
    if (differenceInDays(checkOutDate, checkInDate) < 1) {
      newErrors.checkOutDate = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày';
    }
    
    const guestsCount = parseInt(numberOfGuests || guests || '0');
    if (isNaN(guestsCount) || guestsCount < 1) {
      newErrors.numberOfGuests = 'Số khách phải lớn hơn 0';
    } else if (room && guestsCount > room.capacity) {
      newErrors.numberOfGuests = `Số khách tối đa là ${room.capacity}`;
    }
    
    // Kiểm tra thông tin liên hệ
    if (!formik.values.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên người đặt phòng';
    }
    
    if (!formik.values.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formik.values.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
    }
    
    if (!formik.values.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formik.values.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    console.log('Kết quả kiểm tra form:', 
      Object.keys(newErrors).length === 0 ? 'Hợp lệ' : `Có ${Object.keys(newErrors).length} lỗi`,
      newErrors
    );
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookHotel = async () => {
    if (!validateForm() || !hotel || !room) return;
    
    setIsSubmitting(true);
    try {
      // Kiểm tra token trước khi gọi API
      if (!token) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để đặt phòng');
        router.push('/(auth)/login');
        return;
      }
      
      console.log('Kiểm tra tính khả dụng của phòng...');
      
      // Trước tiên kiểm tra khả dụng của phòng
      const availabilityResponse = await bookingsApi.checkHotelAvailability(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate,
        parseInt(numberOfGuests || guests || '2')
      );

      console.log('Kết quả kiểm tra tính khả dụng:', JSON.stringify(availabilityResponse));
      
      if (!availabilityResponse.success) {
        Alert.alert('Không thể đặt phòng', availabilityResponse.message || 'Vui lòng kiểm tra lại thông tin đặt phòng');
        return;
      }
      
      console.log('Tạo đặt phòng...');
      
      // Đảm bảo có giá trị nights hợp lệ
      const nights = numberOfNights || 1;
      
      // Chuẩn bị dữ liệu đặt phòng theo cấu trúc model của backend
      const bookingData = {
        hotelId: hotel._id,
        roomId: room._id || roomId,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        guests: {
          adults: parseInt(numberOfGuests || guests || '2'),
          children: 0
        },
        contactInfo: {
          fullName: formik.values.fullName,
          email: formik.values.email,
          phone: formik.values.phone
        },
        specialRequests: formik.values.specialRequests,
        totalPrice: calculateTotalPrice(),
        status: 'pending',
        nights: nights,
        roomCount: roomCount,
        paymentMethod: 'sepay',
      };
      
      console.log('Dữ liệu đặt phòng:', JSON.stringify(bookingData));
      
      // Gọi API đặt phòng
      const response = await hotelBookingsApi.create(bookingData, token);
      
      console.log('Kết quả đặt phòng:', JSON.stringify(response));
      
      if (response.success) {
        router.push({
          pathname: '/booking/confirmation',
          params: { 
            bookingId: response.data._id,
            type: 'hotel'
          }
        });
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đặt phòng. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi đặt phòng:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đặt phòng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (isInvalidAccess || !hotel) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin khách sạn hoặc phòng</Text>
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
            <Text style={[styles.formTitle, { color: colors.text }]}>Chọn loại phòng và thông tin lưu trú</Text>
            
            {/* Chọn ngày */}
            <View style={styles.dateContainer}>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: colors.text }]}>Ngày nhận phòng</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                    onPress={() => setShowCheckInDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.tabIconDefault} />
                    <Text style={[styles.dateButtonText, { color: colors.text }]}>
                      {format(checkInDate, 'dd/MM/yyyy', { locale: vi })}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: colors.text }]}>Ngày trả phòng</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                    onPress={() => setShowCheckOutDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.tabIconDefault} />
                    <Text style={[styles.dateButtonText, { color: colors.text }]}>
                      {format(checkOutDate, 'dd/MM/yyyy', { locale: vi })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={[styles.nightsInfo, { color: colors.tabIconDefault }]}>
                {numberOfNights} đêm lưu trú
              </Text>
            </View>

            {/* Chọn loại phòng */}
            {hotel && hotel.roomTypes && hotel.roomTypes.length > 1 && (
              <View style={styles.roomSelectionContainer}>
                <Text style={[styles.roomSelectionTitle, { color: colors.text }]}>Chọn loại phòng</Text>
                {hotel.roomTypes.map((roomType: any, index: number) => (
                  <TouchableOpacity
                    key={roomType._id}
                    style={[
                      styles.roomTypeOption,
                      {
                        borderColor: room?._id === roomType._id ? colors.tint : colors.border,
                        backgroundColor: room?._id === roomType._id ? colors.tint + '10' : colors.cardBackground
                      }
                    ]}
                    onPress={() => setRoom(roomType)}
                  >
                    <View style={styles.roomTypeInfo}>
                      <Text style={[styles.roomTypeName, { color: colors.text }]}>{roomType.name}</Text>
                      <Text style={[styles.roomTypeDesc, { color: colors.tabIconDefault }]}>
                        {roomType.description || `Tối đa ${roomType.capacity} người`}
                      </Text>
                      {roomType.amenities && roomType.amenities.length > 0 && (
                        <Text style={[styles.roomTypeAmenities, { color: colors.tabIconDefault }]}>
                          {roomType.amenities.slice(0, 3).join(' • ')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.roomTypePrice}>
                      <Text style={[styles.roomPrice, { color: colors.tint }]}>
                        {(roomType.priceDiscount || roomType.price).toLocaleString('vi-VN')}đ
                      </Text>
                      <Text style={[styles.roomPriceUnit, { color: colors.tabIconDefault }]}>/đêm</Text>
                      {roomType.priceDiscount && roomType.priceDiscount < roomType.price && (
                        <Text style={[styles.roomOldPrice, { color: colors.tabIconDefault }]}>
                          {roomType.price.toLocaleString('vi-VN')}đ
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date pickers */}
            {showCheckInDatePicker && (
              <DateTimePicker
                value={checkInDate}
                mode="date"
                display="default"
                onChange={handleCheckInDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {showCheckOutDatePicker && (
              <DateTimePicker
                value={checkOutDate}
                mode="date"
                display="default"
                onChange={handleCheckOutDateChange}
                minimumDate={checkInDate}
              />
            )}
          </View>
        );
        
      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Thông tin người đặt phòng</Text>
            
            <TextInput
              label="Họ và tên"
              value={formik.values.fullName}
              onChangeText={formik.handleChange('fullName')}
              onBlur={formik.handleBlur('fullName')}
              placeholder="Nhập họ và tên"
              icon="person-outline"
            />
            {formik.touched.fullName && formik.errors.fullName ? (
              <Text style={styles.errorText}>{formik.errors.fullName}</Text>
            ) : null}
            
            <TextInput
              label="Email"
              value={formik.values.email}
              onChangeText={formik.handleChange('email')}
              onBlur={formik.handleBlur('email')}
              placeholder="Nhập email liên hệ"
              keyboardType="email-address"
              icon="mail-outline"
            />
            {formik.touched.email && formik.errors.email ? (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            ) : null}
            
            <TextInput
              label="Số điện thoại"
              value={formik.values.phone}
              onChangeText={formik.handleChange('phone')}
              onBlur={formik.handleBlur('phone')}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            {formik.touched.phone && formik.errors.phone ? (
              <Text style={styles.errorText}>{formik.errors.phone}</Text>
            ) : null}
            
            <TextInput
              label="Yêu cầu đặc biệt (nếu có)"
              value={formik.values.specialRequests}
              onChangeText={formik.handleChange('specialRequests')}
              onBlur={formik.handleBlur('specialRequests')}
              placeholder="Ví dụ: phòng không hút thuốc, phòng tầng cao..."
              multiline
              numberOfLines={3}
              icon="document-text-outline"
            />
            {formik.touched.specialRequests && formik.errors.specialRequests ? (
              <Text style={styles.errorText}>{formik.errors.specialRequests}</Text>
            ) : null}
          </View>
        );
        
      case 3:
        return (
          <View style={styles.paymentContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phương thức thanh toán</Text>
            
            <View style={[styles.paymentMethodContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.paymentMethodHeader}>
                <Ionicons name="wallet-outline" size={24} color={colors.tint} />
                <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>SePay</Text>
              </View>
              
              <Text style={[styles.paymentMethodDescription, { color: colors.tabIconDefault }]}>
                Thanh toán an toàn và nhanh chóng qua SePay. Bạn sẽ được chuyển đến trang thanh toán SePay sau khi xác nhận đặt phòng.
              </Text>
              
              <View style={[styles.paymentAmountContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.paymentAmountLabel, { color: colors.tabIconDefault }]}>Số tiền thanh toán:</Text>
                <Text style={[styles.paymentAmount, { color: colors.tint }]}>
                  {calculateTotalPrice().toLocaleString('vi-VN')} VND
                </Text>
              </View>
            </View>
          </View>
        );
        
      case 4:
        return (
          <View style={styles.confirmationContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Xác nhận thông tin đặt phòng</Text>
            
            <View style={styles.bookingSummaryContainer}>
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Khách sạn:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{hotel.name}</Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Phòng:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{room?.name || 'Phòng tiêu chuẩn'}</Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Ngày nhận phòng:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {format(checkInDate, 'EEE, dd/MM/yyyy', { locale: vi })}
                </Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Ngày trả phòng:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {format(checkOutDate, 'EEE, dd/MM/yyyy', { locale: vi })}
                </Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Số đêm:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{numberOfNights}</Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Số người:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {room?.capacity || parseInt(numberOfGuests || '2')} người
                </Text>
              </View>
              
              <View style={styles.bookingSummaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Phương thức thanh toán:</Text>
                <Text style={[styles.summaryText, { color: colors.text }]}>
                  SePay
                </Text>
              </View>
              
              <View style={[styles.totalPriceRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalPriceLabel, { color: colors.text }]}>Tổng tiền:</Text>
                <Text style={[styles.totalPriceValue, { color: colors.tint }]}>
                  {calculateTotalPrice().toLocaleString('vi-VN')} VND
                </Text>
              </View>
            </View>
            
            <View style={styles.termsContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tabIconDefault} />
              <Text style={[styles.termsText, { color: colors.tabIconDefault }]}>
                Bằng cách nhấn "Xác nhận đặt phòng", bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
              </Text>
            </View>
          </View>
        );
        
      default:
        return (
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.text }}>Không có nội dung để hiển thị</Text>
          </View>
        );
    }
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate room selection and dates
      if (!room) {
        Alert.alert('Thông báo', 'Vui lòng chọn loại phòng');
        return;
      }
      if (!checkInDate || !checkOutDate) {
        Alert.alert('Thông báo', 'Vui lòng chọn ngày nhận và trả phòng');
        return;
      }
      if (checkInDate >= checkOutDate) {
        Alert.alert('Thông báo', 'Ngày trả phòng phải sau ngày nhận phòng');
        return;
      }
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate customer information
      if (!formik.values.fullName.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập họ tên người đặt phòng');
        return;
      }
      if (!formik.values.email.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập email liên hệ');
        return;
      }
      if (!formik.values.phone.trim()) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: 'Đặt phòng khách sạn',
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {renderCurrentStep()}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button
          icon={<Ionicons name="arrow-back-outline" size={20} color={colors.cardBackground} />}
          title="Quay lại"
          variant="secondary"
          onPress={goBack}
          style={{ flex: 1, marginRight: 10 }}
        />
        
        {currentStep < 4 ? (
          <Button
            icon={<Ionicons name="arrow-forward-outline" size={20} color="white" />}
            title="Tiếp theo"
            variant="primary"
            onPress={goToNextStep}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            icon={<Ionicons name="checkmark-outline" size={20} color="white" />}
            title="Xác nhận đặt phòng"
            variant="primary"
            onPress={handleBookHotel}
            isLoading={isSubmitting}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  stepIndicatorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formContainer: {
    marginBottom: 20,
  },
  paymentContainer: {
    marginBottom: 20,
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentMethodContainer: {
    padding: 16,
    borderRadius: 8,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paymentMethodDescription: {
    fontSize: 14,
  },
  paymentAmountContainer: {
    marginTop: 16,
  },
  paymentAmountLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookingSummaryContainer: {
    marginBottom: 20,
  },
  bookingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalPriceLabel: {
    fontSize: 14,
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 16,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  nightsInfo: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  roomSelectionContainer: {
    marginBottom: 20,
  },
  roomSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roomTypeOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTypeInfo: {
    flex: 1,
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomTypeDesc: {
    fontSize: 14,
    marginBottom: 2,
  },
  roomTypeAmenities: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  roomTypePrice: {
    alignItems: 'flex-end',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomPriceUnit: {
    fontSize: 12,
  },
  roomOldPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
}); 