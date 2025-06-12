import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { flightsApi, bookingsApi, flightBookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BookingSummary } from '@/components/BookingSummary';
import { TextInput as CustomTextInput } from '@/components/ui/TextInput';
import paymentService from '@/services/paymentService';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/ApiConfig';

// Form cho thông tin hành khách
const PassengerInfoSchema = Yup.object().shape({
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
  gender: Yup.string()
    .oneOf(['Nam', 'Nữ', 'Khác'], 'Vui lòng chọn giới tính')
    .required('Vui lòng chọn giới tính'),
  dob: Yup.date()
    .required('Vui lòng nhập ngày sinh')
    .max(new Date(), 'Ngày sinh không hợp lệ'),
});

// Định nghĩa interface cho dữ liệu chuyến bay từ API mới
interface FlightResponse {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    baggage: string;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared: {
      airline_name: string;
      airline_iata: string;
      airline_icao: string;
      flight_number: string;
      flight_iata: string;
    } | null;
  };
  aircraft: {
    registration: string;
    iata: string;
    icao: string;
  } | null;
  live: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  } | null;
  price?: {
    economy: number;
    business: number;
    firstClass: number;
  };
  seatsAvailable?: {
    economy: number;
    business: number;
    firstClass: number;
  };
  features?: {
    wifi: boolean;
    meals: boolean;
    entertainment: boolean;
    powerOutlets: boolean;
    usb: boolean;
  };
}

// Thêm interface cho FlightPassenger nếu chưa được import
export interface PassengerInfo {
  name: string;
  dob: string;
  passport?: string;
  type: 'adult' | 'child' | 'infant';
}

export default function BookFlightScreen() {
  const params = useLocalSearchParams<{ 
    flightIata: string, 
    flightDate: string,
    departureAirport: string,
    arrivalAirport: string,
    airline: string,
    price: string
  }>();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token } = useAuth();

  const [flight, setFlight] = useState<FlightResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Thông tin đặt vé
  const [seatClass, setSeatClass] = useState<'economy' | 'business' | 'firstClass'>('economy');
  const [numberOfPassengers, setNumberOfPassengers] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Lỗi validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentStep, setCurrentStep] = useState(1);
  // SePay là phương thức thanh toán duy nhất
  const paymentMethod = 'sepay';
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identification, setIdentification] = useState('');
  
  const bookingSteps = ['Thông tin hành khách', 'Thanh toán', 'Xác nhận'];
  
  const calculateTotalPrice = () => {
    if (!flight) {
      // Sử dụng giá từ URL params nếu có
      if (params.price) {
        let basePrice = parseInt(params.price);
        if (isNaN(basePrice)) return 0;
        
        // Điều chỉnh giá theo hạng ghế
        switch (seatClass) {
          case 'business':
            basePrice *= 1.5;
            break;
          case 'firstClass':
            basePrice *= 2.5;
            break;
        }
        
        return basePrice * parseInt(numberOfPassengers || '1');
      }
      return 0;
    }
    
    let basePrice = 0;
    if (flight.price) {
      switch (seatClass) {
        case 'economy':
          basePrice = flight.price.economy;
          break;
        case 'business':
          basePrice = flight.price.business;
          break;
        case 'firstClass':
          basePrice = flight.price.firstClass;
          break;
      }
    } else {
      // Sử dụng giá mặc định nếu không có thông tin giá
      basePrice = parseInt(params.price || '0');
      if (isNaN(basePrice)) basePrice = 1000000; // Giá mặc định
      
      // Điều chỉnh giá theo hạng ghế
      switch (seatClass) {
        case 'business':
          basePrice *= 1.5;
          break;
        case 'firstClass':
          basePrice *= 2.5;
          break;
      }
    }
    
    return basePrice * parseInt(numberOfPassengers || '1');
  };
  
  // Booking data for summary
  const bookingData = {
    flight: flight,
    flightIata: params.flightIata,
    flightDate: params.flightDate,
    departureAirport: flight?.departure?.airport || params.departureAirport,
    arrivalAirport: flight?.arrival?.airport || params.arrivalAirport,
    airline: flight?.airline?.name || params.airline,
    seatClass: seatClass,
    passengers: Number(numberOfPassengers),
    totalPrice: calculateTotalPrice(),
    contactInfo: {
      fullName,
      email,
      phone,
      identification,
    },
    specialRequests,
    paymentMethod: paymentMethod
  };
  
  useEffect(() => {
    fetchFlightData();
    
    // Điền thông tin người dùng nếu đã đăng nhập
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [params.flightIata, params.flightDate, user]);

  const fetchFlightData = async () => {
    const { flightIata, flightDate } = params;
    
    if (!flightIata || !flightDate) {
      Alert.alert('Lỗi', 'Thiếu thông tin chuyến bay cần thiết');
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      const response = await flightsApi.getFlightDetail(flightIata, flightDate);
      if (response.success && response.data) {
        setFlight(response.data);
      } else {
        console.log('Không thể tải thông tin chi tiết chuyến bay, sử dụng thông tin từ params');
        // Tạo flight object từ params để hiển thị thông tin cơ bản
        setFlight({
          flight_date: flightDate,
          flight_status: 'scheduled',
          departure: {
            airport: params.departureAirport || '',
            timezone: '',
            iata: '',
            icao: '',
            terminal: '',
            gate: '',
            delay: null,
            scheduled: new Date().toISOString(),
            estimated: new Date().toISOString(),
            actual: null
          },
          arrival: {
            airport: params.arrivalAirport || '',
            timezone: '',
            iata: '',
            icao: '',
            terminal: '',
            gate: '',
            baggage: '',
            delay: null,
            scheduled: new Date().toISOString(),
            estimated: new Date().toISOString(),
            actual: null
          },
          airline: {
            name: params.airline || '',
            iata: '',
            icao: ''
          },
          flight: {
            number: '',
            iata: flightIata,
            icao: '',
            codeshared: null
          },
          aircraft: null,
          live: null,
          price: {
            economy: parseInt(params.price || '1000000'),
            business: parseInt(params.price || '1000000') * 1.5,
            firstClass: parseInt(params.price || '1000000') * 2.5
          }
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const passengerCount = parseInt(numberOfPassengers);
    if (isNaN(passengerCount) || passengerCount < 1) {
      newErrors.numberOfPassengers = 'Số hành khách phải lớn hơn 0';
    }
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập tên liên hệ';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Tên phải có ít nhất 2 ký tự';
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
    
    if (!identification.trim()) {
      newErrors.identification = 'Vui lòng nhập số CMND/CCCD/Hộ chiếu';
    } else if (!/^[0-9]{9,12}$/.test(identification.trim())) {
      newErrors.identification = 'Số CMND/CCCD/Hộ chiếu không hợp lệ';
    }
    
    setErrors(newErrors);
    console.log('Kết quả validation:', 
      Object.keys(newErrors).length === 0 ? 'Thành công' : 'Thất bại', 
      newErrors
    );
    return Object.keys(newErrors).length === 0;
  };

  const handleBookFlight = async () => {
    if (!validateForm() || !flight) return;
    
    setIsSubmitting(true);
    try {
      if (!token) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Vui lòng đăng nhập để tiếp tục đặt vé',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => router.push('/login') }
          ]
        );
        return;
      }

      const numPassengers = parseInt(numberOfPassengers);
      const totalPrice = calculateTotalPrice();
      
      // Chuẩn bị thông tin đặt vé theo cấu trúc API mới
      const bookingData = {
        flightId: params.flightIata,
        flightDate: params.flightDate,
        seatClass: seatClass,
        numOfPassengers: numPassengers,
        passengers: Array(numPassengers).fill(null).map(() => {
          // Tách fullName thành firstName và lastName
          const cleanName = fullName.trim();
          const nameParts = cleanName.split(' ').filter(part => part.length > 0);
          const lastName = nameParts.length > 1 ? nameParts.pop() : '';
          const firstName = nameParts.length > 0 ? nameParts.join(' ') : cleanName;
          
          return {
            title: 'Mr', // Mặc định title
            firstName: firstName,
            lastName: lastName,
            fullName: cleanName,
            identification: identification,
            dob: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mặc định 25 tuổi
            gender: 'Male',
            nationality: 'Vietnamese',
            type: 'adult',
            seatClass: seatClass
          };
        }),
        contactInfo: {
          fullName: fullName,
          email: email,
          phone: phone,
          identification: identification
        },
        specialRequests: specialRequests || 'Không có yêu cầu đặc biệt',
        totalPrice: totalPrice,
        status: 'pending',
        paymentMethod: 'sepay' // Luôn sử dụng SePay làm phương thức thanh toán mặc định
      };
      
      console.log('Gửi yêu cầu đặt vé với dữ liệu:', JSON.stringify(bookingData));
      
      // Gọi API đặt vé
      const bookingResponse = await flightBookingsApi.createBooking(bookingData, token);
      console.log('Kết quả đặt vé:', bookingResponse);
      
      if (bookingResponse.success) {
        try {
          // Hiển thị thông báo đang tạo thanh toán
          Alert.alert(
            'Đặt vé thành công',
            'Đang chuyển đến trang thanh toán...',
            [{ text: 'OK' }],
            { cancelable: false }
          );
          
          // Tạo payment request cho flight booking
          const paymentRequest = {
            bookingId: bookingResponse.data._id,
            bookingType: 'flight',
            amount: totalPrice,
            paymentMethod: 'sepay'
          };
          
          console.log('Tạo yêu cầu thanh toán:', JSON.stringify(paymentRequest));
          
          try {
            // Gọi API tạo thanh toán
            const paymentResponse = await paymentService.createPayment(paymentRequest);
            console.log('Kết quả tạo thanh toán:', paymentResponse);
            
            // Điều hướng đến trang thanh toán trực tiếp
            router.push({
              pathname: '/booking/payment',
              params: { paymentId: paymentResponse._id }
            });
          } catch (payError) {
            console.error('Lỗi khi tạo thanh toán thông qua service, thử phương án dự phòng', payError);
            
            // Thử phương án dự phòng - sử dụng hàm getOrCreateBookingPayment
            try {
              console.log('Cần lấy payment ID từ API');
              console.log(`Gọi API payments/booking để lấy hoặc tạo payment cho booking ${bookingResponse.data._id}, loại flight`);
              
              // Sử dụng hàm getOrCreateBookingPayment để lấy hoặc tạo payment
              const backupPayment = await paymentService.getOrCreateBookingPayment('flight', bookingResponse.data._id);
              
              if (backupPayment && backupPayment._id) {
                router.push({
                  pathname: '/booking/payment',
                  params: { paymentId: backupPayment._id }
                });
                return;
              }
              
              throw new Error('Không thể tạo thanh toán');
            } catch (backupError) {
              console.error('Lỗi khi lấy payment ID từ API:', backupError);
              
              // Thử gọi API trực tiếp từ axios (phương án cuối cùng)
              try {
                const api = axios.create({
                  baseURL: API_BASE_URL,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });
                
                // Thử lấy hoặc tạo payment cho booking này
                console.log(`Thử trực tiếp API gốc - payments/booking/flight/${bookingResponse.data._id}`);
                const directResponse = await api.get(`/payments/booking/flight/${bookingResponse.data._id}`);
                
                if (directResponse.data?.success && directResponse.data?.data?._id) {
                  router.push({
                    pathname: '/booking/payment',
                    params: { paymentId: directResponse.data.data._id }
                  });
                  return;
                }
                
                // Nếu không lấy được, thử phương án tạo payment trực tiếp
                console.log(`Gọi API payment trực tiếp: /api/payments`);
                const createResponse = await api.post('/payments', paymentRequest);
                
                if (createResponse.data?.success && createResponse.data?.data?._id) {
                  router.push({
                    pathname: '/booking/payment',
                    params: { paymentId: createResponse.data.data._id }
                  });
                  return;
                }
                
                throw new Error('Không thể tạo thanh toán qua mọi phương án');
              } catch (finalError) {
                console.error('Lỗi cuối cùng khi tạo thanh toán:', finalError);
                throw finalError;
              }
            }
          }
        } catch (paymentError) {
          console.error('Lỗi khi tạo thanh toán:', paymentError);
          // Vẫn điều hướng đến trang xác nhận nhưng không có payment ID
          router.push({
            pathname: '/booking/confirmation',
            params: { 
              bookingId: bookingResponse.data._id,
              type: 'flight'
            }
          });
        }
      } else {
        // Xử lý lỗi từ API
        if (bookingResponse.statusCode === 403) {
          Alert.alert(
            'Lỗi quyền truy cập',
            'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Đăng nhập lại', onPress: () => {
                // Đăng xuất và chuyển đến trang đăng nhập
                localStorage.removeItem('userToken');
                router.push('/login');
              }}
            ]
          );
        } else {
          Alert.alert('Lỗi', bookingResponse.message || 'Đã xảy ra lỗi khi đặt vé. Vui lòng thử lại sau.');
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi đặt vé:', error);
      
      // Xử lý các lỗi HTTP cụ thể
      if (error.statusCode === 403) {
        Alert.alert(
          'Lỗi quyền truy cập',
          'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.'
        );
      } else {
        Alert.alert(
          'Lỗi', 
          error.message || 'Đã xảy ra lỗi khi đặt vé. Vui lòng thử lại sau.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm, dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return 'Không xác định';
    }
  };

  const renderFlightSummary = () => {
    if (!flight) return null;

    // Tạo dữ liệu ngày và thời gian
    const departureDate = new Date(flight.departure?.scheduled || new Date());
    const arrivalDate = new Date(flight.arrival?.scheduled || new Date());
    
    // Tính thời gian bay
    const durationInMinutes = differenceInMinutes(arrivalDate, departureDate);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    
    return (
      <View style={styles.flightSummary}>
        <View style={styles.flightHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image 
              source={{ uri: `https://pics.avs.io/200/80/${flight.airline?.iata || 'VN'}.png` }} 
              style={{width: 60, height: 24, marginRight: 8}} 
              resizeMode="contain"
            />
            <Text style={[styles.flightNumber, { color: colors.text }]}>
              {flight.airline?.name || params.airline} 
            </Text>
          </View>
          <Text style={{fontSize: 15, fontWeight: '600', color: colors.tint}}>
            {flight.flight?.iata || params.flightIata}
          </Text>
        </View>

        <View style={styles.flightStatus}>
          <Text style={[
            styles.statusText, 
            { 
              color: flight.flight_status === 'scheduled' ? '#2b8a3e' : 
                     flight.flight_status === 'active' ? '#1971c2' :
                     flight.flight_status === 'landed' ? '#5f3dc4' : '#e03131'
            }
          ]}>
            {flight.flight_status === 'scheduled' ? 'Đúng giờ' : 
             flight.flight_status === 'active' ? 'Đang bay' :
             flight.flight_status === 'landed' ? 'Đã hạ cánh' : 
             flight.flight_status === 'cancelled' ? 'Đã hủy' : flight.flight_status}
          </Text>
        </View>

        <View style={styles.flightDateContainer}>
          <Text style={styles.flightDateText}>
            {format(departureDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </Text>
        </View>

        <View style={styles.flightRoute}>
          <View style={styles.departureInfo}>
            <Text style={[styles.cityCode, { color: colors.text }]}>
              {flight.departure?.iata || 'HAN'}
            </Text>
            <Text style={[styles.cityName, { color: colors.tabIconDefault }]}>
              {flight.departure?.airport || params.departureAirport}
            </Text>
            <Text style={[styles.flightTime, { color: colors.text }]}>
              {format(departureDate, 'HH:mm')}
            </Text>
            {flight.departure?.terminal && (
              <Text style={[styles.terminal, { color: colors.tabIconDefault }]}>
                Terminal: {flight.departure.terminal}
              </Text>
            )}
            {flight.departure?.gate && (
              <Text style={[styles.gate, { color: colors.tabIconDefault }]}>
                Gate: {flight.departure.gate}
              </Text>
            )}
          </View>
          
          <View style={styles.flightInfoCenter}>
            <View style={styles.durationContainer}>
              <Text style={[styles.duration, { color: colors.text }]}>
                {hours}h {minutes}m
              </Text>
            </View>
            <View style={styles.flightPathContainer}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <Ionicons 
                name="airplane" 
                size={22} 
                color={colors.tint} 
                style={{transform: [{rotate: '90deg'}], marginVertical: 6}}
              />
              <View style={styles.line} />
              <View style={styles.dot} />
            </View>
            <Text style={{fontSize: 12, color: colors.tabIconDefault, marginTop: 4}}>
              Bay thẳng
            </Text>
          </View>
          
          <View style={styles.arrivalInfo}>
            <Text style={[styles.cityCode, { color: colors.text }]}>
              {flight.arrival?.iata || 'SGN'}
            </Text>
            <Text style={[styles.cityName, { color: colors.tabIconDefault }]}>
              {flight.arrival?.airport || params.arrivalAirport}
            </Text>
            <Text style={[styles.flightTime, { color: colors.text }]}>
              {format(arrivalDate, 'HH:mm')}
            </Text>
            {flight.arrival?.terminal && (
              <Text style={[styles.terminal, { color: colors.tabIconDefault }]}>
                Terminal: {flight.arrival.terminal}
              </Text>
            )}
            {flight.arrival?.gate && (
              <Text style={[styles.gate, { color: colors.tabIconDefault }]}>
                Gate: {flight.arrival.gate}
              </Text>
            )}
          </View>
        </View>

        {(flight.aircraft || flight.flight?.codeshared) && (
          <View style={styles.flightDetails}>
            {flight.aircraft && (
              <View style={styles.detailItem}>
                <Ionicons name="airplane-outline" size={16} color={colors.tabIconDefault} />
                <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                  {flight.aircraft.icao || flight.aircraft.iata}
                </Text>
              </View>
            )}
            
            {flight.flight?.codeshared && (
              <View style={styles.detailItem}>
                <Ionicons name="git-branch-outline" size={16} color={colors.tabIconDefault} />
                <Text style={[styles.detailText, { color: colors.tabIconDefault }]}>
                  Liên danh: {flight.flight.codeshared.airline_name}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.classSelection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hạng ghế</Text>
          <View style={styles.classOptions}>
            <TouchableOpacity
              style={[
                styles.classOption,
                seatClass === 'economy' && { ...styles.selectedClass, borderColor: colors.tint },
                { borderColor: colors.border }
              ]}
              onPress={() => setSeatClass('economy')}
            >
              <Ionicons 
                name="person-outline" 
                size={18} 
                color={seatClass === 'economy' ? colors.tint : colors.tabIconDefault} 
                style={{marginBottom: 4}}
              />
              <Text style={[
                styles.classText,
                seatClass === 'economy' && styles.selectedClassText,
                { color: seatClass === 'economy' ? colors.tint : colors.text }
              ]}>
                Phổ thông
              </Text>
              <Text style={[
                styles.priceText,
                { color: seatClass === 'economy' ? colors.tint : colors.tabIconDefault }
              ]}>
                {flight.price?.economy ? `${flight.price.economy.toLocaleString('vi-VN')}đ` : 
                  `${parseInt(params.price || '1000000').toLocaleString('vi-VN')}đ`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.classOption,
                seatClass === 'business' && { ...styles.selectedClass, borderColor: colors.tint },
                { borderColor: colors.border }
              ]}
              onPress={() => setSeatClass('business')}
            >
              <Ionicons 
                name="briefcase-outline" 
                size={18} 
                color={seatClass === 'business' ? colors.tint : colors.tabIconDefault}
                style={{marginBottom: 4}} 
              />
              <Text style={[
                styles.classText,
                seatClass === 'business' && styles.selectedClassText,
                { color: seatClass === 'business' ? colors.tint : colors.text }
              ]}>
                Thương gia
              </Text>
              <Text style={[
                styles.priceText,
                { color: seatClass === 'business' ? colors.tint : colors.tabIconDefault }
              ]}>
                {flight.price?.business ? `${flight.price.business.toLocaleString('vi-VN')}đ` : 
                  `${(parseInt(params.price || '1000000') * 1.5).toLocaleString('vi-VN')}đ`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.classOption,
                seatClass === 'firstClass' && { ...styles.selectedClass, borderColor: colors.tint },
                { borderColor: colors.border }
              ]}
              onPress={() => setSeatClass('firstClass')}
            >
              <Ionicons 
                name="star-outline" 
                size={18} 
                color={seatClass === 'firstClass' ? colors.tint : colors.tabIconDefault}
                style={{marginBottom: 4}} 
              />
              <Text style={[
                styles.classText,
                seatClass === 'firstClass' && styles.selectedClassText,
                { color: seatClass === 'firstClass' ? colors.tint : colors.text }
              ]}>
                Hạng nhất
              </Text>
              <Text style={[
                styles.priceText,
                { color: seatClass === 'firstClass' ? colors.tint : colors.tabIconDefault }
              ]}>
                {flight.price?.firstClass ? `${flight.price.firstClass.toLocaleString('vi-VN')}đ` : 
                  `${(parseInt(params.price || '1000000') * 2.5).toLocaleString('vi-VN')}đ`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passengerCountContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Số lượng hành khách</Text>
          <View style={styles.passengerCountSelector}>
            <TouchableOpacity 
              style={styles.passengerCountButton}
              onPress={() => {
                if (parseInt(numberOfPassengers) > 1) {
                  setNumberOfPassengers((parseInt(numberOfPassengers) - 1).toString());
                }
              }}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.passengerCountText}>{numberOfPassengers}</Text>
            <TouchableOpacity 
              style={styles.passengerCountButton}
              onPress={() => {
                setNumberOfPassengers((parseInt(numberOfPassengers) + 1).toString());
              }}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalPriceContainer}>
          <Text style={styles.totalPriceLabel}>Tổng tiền:</Text>
          <Text style={styles.totalPriceValue}>
            {calculateTotalPrice().toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>
    );
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate passenger information
      if (!validateForm()) {
        // Hiển thị thông báo lỗi tổng hợp
        const errorMessages = Object.values(errors).filter(msg => msg).join('\n');
        if (errorMessages) {
          Alert.alert('Thông tin không hợp lệ', errorMessages);
        }
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
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

  if (!flight) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin chuyến bay</Text>
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
            <Text style={[styles.formTitle, { color: colors.text }]}>Thông tin hành khách</Text>
            
            <CustomTextInput
              label="Họ tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
              error={errors.fullName}
            />
            
            <CustomTextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            
            <CustomTextInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="0912345678"
              keyboardType="phone-pad"
              error={errors.phone}
            />
            
            <CustomTextInput
              label="Số CMND/CCCD"
              value={identification}
              onChangeText={setIdentification}
              placeholder="0123456789"
              keyboardType="numeric"
              error={errors.identification}
            />
            
            <CustomTextInput
              label="Yêu cầu đặc biệt"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Nhập yêu cầu đặc biệt nếu có"
              multiline={true}
              numberOfLines={3}
            />
          </View>
        );
        
      case 2:
        return (
          <View style={styles.paymentContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Phương thức thanh toán</Text>
            
            <View style={[styles.paymentMethodContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.paymentMethodHeader}>
                <Ionicons name="wallet-outline" size={24} color={colors.tint} />
                <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>SePay</Text>
              </View>
              
              <Text style={[styles.paymentMethodDescription, { color: colors.tabIconDefault }]}>
                Thanh toán an toàn và nhanh chóng qua SePay. Bạn sẽ được chuyển đến trang thanh toán SePay sau khi xác nhận đặt vé.
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
        
      case 3:
        return (
          <View style={styles.confirmationContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Xác nhận thông tin đặt vé</Text>
            
            <BookingSummary
              type="flight"
              data={bookingData}
            />
            
            <View style={styles.termsContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tabIconDefault} />
              <Text style={[styles.termsText, { color: colors.tabIconDefault }]}>
                Bằng cách nhấn "Xác nhận đặt vé", bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
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
          title: 'Đặt vé máy bay',
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
          {/* Flight Summary */}
          {renderFlightSummary()}

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
          {currentStep < 3 ? (
            <Button
              onPress={goToNextStep}
              title="Tiếp theo"
              variant="primary"
            />
          ) : (
            <Button
              onPress={handleBookFlight}
              isLoading={isSubmitting}
              title="Xác nhận đặt vé"
              variant="primary"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

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
  flightSummary: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
  },
  flightHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  airlineLogoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 36,
    height: 36,
  },
  flightStatus: {
    padding: 12,
    backgroundColor: '#f1f3f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  flightRoute: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  departureInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  arrivalInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cityCode: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cityName: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  flightTime: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  terminal: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.8,
  },
  gate: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.8,
  },
  flightInfoCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  durationContainer: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  duration: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: '#e9ecef',
    position: 'relative',
  },
  flightDetails: {
    padding: 12,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  classSelection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  classOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classOption: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  selectedClass: {
    borderWidth: 2,
    backgroundColor: '#e6f3ff',
  },
  classText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedClassText: {
    fontWeight: '600',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stepIndicatorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentContainer: {
    marginBottom: 20,
  },
  paymentMethodContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    lineHeight: 22,
    marginBottom: 16,
  },
  paymentAmountContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  paymentAmountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  flightDateContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  flightDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  flightPathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#099268',
    marginHorizontal: 4,
  },
  passengerCountContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  passengerCountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  passengerCountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  passengerCountText: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  totalPriceContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2b8a3e',
  },
}); 