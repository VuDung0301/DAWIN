import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Share,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { TourBooking, HotelBooking, FlightBooking } from '@/types';
import { bookingsApi, fetchApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BookingSummary } from '@/components/BookingSummary';
import { paymentService } from '@/lib/api/payment';

type BookingType = 'flight' | 'hotel' | 'tour';

export default function BookingConfirmationScreen() {
  const { bookingId, type, paymentId } = useLocalSearchParams<{ bookingId: string, type: string, paymentId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [booking, setBooking] = useState<TourBooking | HotelBooking | FlightBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [bookingTitle, setBookingTitle] = useState<string>('');
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Kiểm tra trạng thái quyền hiện tại
      const permissionInfo = await MediaLibrary.getPermissionsAsync();
      
      // Nếu đã có quyền, không cần yêu cầu thêm
      if (permissionInfo.status === MediaLibrary.PermissionStatus.GRANTED) {
        setPermissionStatus(MediaLibrary.PermissionStatus.GRANTED);
        return;
      }
      
      // Yêu cầu quyền nếu chưa có
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status);
      
      // Hiển thị hướng dẫn nếu quyền bị từ chối
      if (status !== MediaLibrary.PermissionStatus.GRANTED) {
        console.log('Quyền truy cập media bị từ chối');
      }
    } catch (error) {
      console.error('Lỗi khi yêu cầu quyền truy cập media:', error);
      setPermissionStatus(MediaLibrary.PermissionStatus.DENIED);
    }
  };

  const fetchBookingData = async () => {
    if (!bookingId && !type) {
      // Kiểm tra nếu có tham số id từ URL
      const params = useLocalSearchParams();
      const id = params.id as string;
      
      if (id) {
        console.log('Đã tìm thấy id từ params:', id);
        try {
          setIsLoading(true);
          setError(null);
          
          // Phân tích URL để xác định loại booking
          let bookingType: BookingType = 'flight';
          const currentPath = window.location.pathname;
          
          if (currentPath.includes('/booking/tour')) {
            bookingType = 'tour';
          } else if (currentPath.includes('/booking/hotel')) {
            bookingType = 'hotel';
          } else if (currentPath.includes('/booking/flight')) {
            bookingType = 'flight';
          }
          
          // Lấy thông tin booking
          const bookingData = await bookingsApi.getBookingById(
            id, 
            bookingType, 
            // token - nếu cần
          );
          
          if (bookingData) {
            console.log('Dữ liệu booking:', bookingData);
            setBooking(bookingData);
            
            let title = '';
            const tourInfo = (bookingData as any).tour;
            const hotelInfo = (bookingData as any).hotel;
            const flightInfo = (bookingData as any).flight;
            
            if (bookingType === 'tour' && tourInfo) {
              title = `Tour - ${tourInfo.name || 'Chi tiết đặt tour'}`;
            } else if (bookingType === 'hotel' && hotelInfo) {
              title = `Khách sạn - ${hotelInfo.name || 'Chi tiết đặt phòng'}`;
            } else if (bookingType === 'flight' && flightInfo) {
              title = `Chuyến bay - ${flightInfo.flightNumber || 'Chi tiết đặt vé'}`;
            } else {
              title = 'Chi tiết đặt chỗ';
            }
            setBookingTitle(title);
          } else {
            setError('Không tìm thấy thông tin đặt chỗ');
          }
        } catch (err) {
          console.error('Lỗi khi tải dữ liệu booking từ ID:', err);
          setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.');
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    if (!bookingId || !type) {
      setError('Thiếu thông tin đặt chỗ cần thiết');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (type !== 'tour' && type !== 'hotel' && type !== 'flight') {
        setError('Loại đặt chỗ không hợp lệ');
        return;
      }
      
      console.log(`Đang tải dữ liệu đặt chỗ loại ${type} với id ${bookingId}`);
      const bookingData = await bookingsApi.getBookingById(
        bookingId, 
        type as BookingType, 
        // token - nếu cần
      );
      
      if (bookingData) {
        console.log('Đã nhận dữ liệu đặt chỗ:', bookingData);
        setBooking(bookingData);
        
        let title = '';
        const tourInfo = (bookingData as any).tour;
        const hotelInfo = (bookingData as any).hotel;
        const flightInfo = (bookingData as any).flight;
        
        if (type === 'tour' && tourInfo) {
          title = `Tour - ${tourInfo.name || 'Chi tiết đặt tour'}`;
        } else if (type === 'hotel' && hotelInfo) {
          title = `Khách sạn - ${hotelInfo.name || 'Chi tiết đặt phòng'}`;
        } else if (type === 'flight' && flightInfo) {
          title = `Chuyến bay - ${flightInfo.flightNumber || 'Chi tiết đặt vé'}`;
        } else {
          title = 'Chi tiết đặt chỗ';
        }
        setBookingTitle(title);

        // Nếu có payment ID từ params, lưu vào booking state
        if (paymentId) {
          console.log('Đã nhận payment ID từ route params:', paymentId);
          setBooking(prevBooking => prevBooking ? { ...prevBooking, paymentId } : null);
        }
      } else {
        setError('Không tìm thấy thông tin đặt chỗ');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu booking:', err);
      setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentIdFromBooking = async (bookingId: string, bookingType: BookingType) => {
    if (!bookingId || !bookingType) {
      console.log('Thiếu thông tin để lấy payment ID');
      return null;
    }

    // Tránh gọi API nếu đã có payment ID hoặc đang gọi API
    if (booking && 'paymentId' in booking && booking.paymentId || isLoadingPayment) {
      console.log('Đã có payment ID hoặc đang tải:', booking?.paymentId);
      return booking?.paymentId;
    }

    try {
      setIsLoadingPayment(true);
      console.log(`Gọi API lấy payment ID cho booking ${bookingId}, loại ${bookingType}`);
      
      if (!token) {
        console.log('Không có token xác thực, không thể lấy thông tin payment');
        Alert.alert('Lỗi xác thực', 'Bạn cần đăng nhập lại để thực hiện chức năng này.');
        return null;
      }
      
      // Sử dụng API endpoint mới từ payments service
      const response = await fetchApi(`/payments/booking/${bookingType}/${bookingId}`, 'GET', undefined, token);
      
      console.log('Kết quả từ API payment:', response);
      
      if (response && response.success && response.data) {
        // Lấy payment từ response
        const payment = response.data;
        
        // Cập nhật booking với payment ID và URL nếu có
        setBooking((prevBooking) => {
          if (prevBooking) {
            return { 
              ...prevBooking, 
              paymentId: payment._id,
              paymentStatus: payment.status || 'pending'
            } as any; // Sử dụng type assertion để tránh lỗi TypeScript
          }
          return prevBooking;
        });
        
        // Trả về payment ID
        return payment._id;
      } else if (response && !response.success) {
        console.log('Lỗi khi lấy thông tin payment:', response.message);
        Alert.alert('Lỗi', response.message || 'Không thể lấy thông tin thanh toán');
        return null;
      } else {
        console.log('Không lấy được thông tin payment từ response');
        return null;
      }
    } catch (error) {
      console.error('Lỗi khi lấy payment ID từ API:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi lấy thông tin thanh toán');
      return null;
    } finally {
      setIsLoadingPayment(false);
    }
  };

  useEffect(() => {
    fetchBookingData();
  }, [bookingId, type]);
  
  useEffect(() => {
    // Nếu có payment ID từ params, lưu vào booking state
    if (paymentId && booking) {
      console.log('Đã nhận payment ID từ route params:', paymentId);
      setBooking({...booking, paymentId});
    }
    // Nếu không có payment ID từ params nhưng có booking đã tải
    else if (booking && !booking.paymentId && booking.paymentMethod === 'sepay') {
      console.log('Cần lấy payment ID từ API');
      if (bookingId && type) {
        getPaymentIdFromBooking(bookingId, type as BookingType);
      }
    }
  }, [paymentId, booking]);

  // Booking data for BookingSummary component
  useEffect(() => {
    if (booking) {
      // Đảm bảo totalPrice là số
      if (booking.totalPrice === undefined || booking.totalPrice === null) {
        const bookingAny = booking as any;
        
        if (type === 'tour' && bookingAny.tour) {
          // Tính toán tổng giá nếu không có sẵn
          const price = bookingAny.tour.priceDiscount || bookingAny.tour.price || 0;
          const numPeople = bookingAny.numOfPeople || 1;
          bookingAny.totalPrice = price * numPeople;
        } else if (type === 'hotel' && bookingAny.hotel) {
          // Tính giá dựa trên phòng và số đêm
          const roomPrice = bookingAny.roomType?.price || 0;
          const nights = bookingAny.checkOut && bookingAny.checkIn ? 
            Math.ceil((new Date(bookingAny.checkOut).getTime() - new Date(bookingAny.checkIn).getTime()) / (1000 * 3600 * 24)) : 1;
          bookingAny.totalPrice = roomPrice * nights;
        } else if (type === 'flight' && bookingAny.flight) {
          // Tính giá dựa trên giá vé và số hành khách
          const ticketPrice = bookingAny.flight.price || 0;
          const passengers = Array.isArray(bookingAny.passengers) ? 
            bookingAny.passengers.length : bookingAny.numOfPassengers || 1;
          bookingAny.totalPrice = ticketPrice * passengers;
        }
      }
      
      console.log('Dữ liệu booking được tải:', JSON.stringify({
        id: booking._id,
        type,
        totalPrice: booking.totalPrice,
        status: booking.status
      }));
    }
  }, [booking, type]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return 'Không có dữ liệu';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm', { locale: vi });
    } catch (error) {
      return 'Không có dữ liệu';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return 'Không có dữ liệu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Đang chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return 'Đang chờ xác nhận';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thanh toán thất bại';
      default: return 'Chờ thanh toán';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank_transfer': return 'Chuyển khoản ngân hàng';
      case 'credit_card': return 'Thẻ tín dụng';
      case 'momo': return 'Ví MoMo';
      case 'zalopay': return 'ZaloPay';
      case 'vnpay': return 'VNPay';
      case 'sepay': return 'SePay';
      default: return 'Không xác định';
    }
  };

  const calculateDuration = (departureTime?: string, arrivalTime?: string): string => {
    if (!departureTime || !arrivalTime) return 'N/A';
    
    try {
      const departure = new Date(departureTime);
      const arrival = new Date(arrivalTime);
      
      // Tính thời gian bay tính bằng phút
      const durationMinutes = Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
      
      // Chuyển đổi thành giờ và phút
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      // Định dạng giờ và phút
      let result = '';
      if (hours > 0) {
        result += `${hours}h`;
      }
      if (minutes > 0 || hours === 0) {
        result += `${minutes}m`;
      }
      
      return result;
    } catch (error) {
      console.error('Lỗi khi tính thời gian bay:', error);
      return 'N/A';
    }
  };

  const getBookingCode = (booking: any): string => {
    if (!booking) return 'N/A';
    return booking.bookingReference || booking.bookingNumber || 'N/A';
  };

  const handleShare = async () => {
    if (!booking) return;
    
    try {
      const bookingType = type === 'tour' ? 'Tour' : type === 'hotel' ? 'Khách sạn' : 'Chuyến bay';
      let title = '';
      
      if (type === 'tour' && booking.tour && typeof booking.tour !== 'string') {
        title = booking.tour.name;
      } else if (type === 'hotel' && booking.hotel && typeof booking.hotel !== 'string') {
        title = booking.hotel.name;
      } else if (type === 'flight' && booking.flight && typeof booking.flight !== 'string') {
        title = `${booking.flight.departureCity} - ${booking.flight.arrivalCity}`;
      }
      
      const message = `Tôi đã đặt ${bookingType} "${title}" trên Dawin App! Mã đặt chỗ: ${getBookingCode(booking)}`;
      
      await Share.share({
        message,
        title: 'Chia sẻ thông tin đặt chỗ',
      });
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ thông tin đặt chỗ.');
    }
  };

  const getBookingTitle = (): string => {
    if (!booking) return '';
    
    if (type === 'flight' && 'flight' in booking) {
      const flightBooking = booking as any;
      return `${flightBooking.flight.departureCity} - ${flightBooking.flight.arrivalCity}`;
    } else if (type === 'hotel' && 'hotel' in booking) {
      const hotelBooking = booking as any;
      return hotelBooking.hotel.name;
    } else if (type === 'tour' && 'tour' in booking) {
      const tourBooking = booking as any;
      return tourBooking.tour.name;
    }
    
    return 'Đặt chỗ';
  };

  const generateBookingHtml = () => {
    if (!booking) return '';
    
    const tourDetails = booking.tour && typeof booking.tour !== 'string' ? booking.tour : null;
    const hotelDetails = booking.hotel && typeof booking.hotel !== 'string' ? booking.hotel : null;
    const flightDetails = booking.flight && typeof booking.flight !== 'string' ? booking.flight : null;
    
    // Format tiền tệ
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Chi tiết đặt chỗ</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #4285f4;
        }
        .title {
          font-size: 22px;
          margin: 20px 0;
          color: #4285f4;
        }
        .section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .booking-status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          color: white;
          background-color: ${booking.status === 'confirmed' ? '#4caf50' : 
                            booking.status === 'cancelled' ? '#f44336' : '#ff9800'};
        }
        .payment-status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          color: white;
          background-color: ${booking.paymentStatus === 'paid' ? '#4caf50' : 
                            booking.paymentStatus === 'failed' ? '#f44336' : '#ff9800'};
        }
        .info-row {
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f2f2f2;
          text-align: left;
          padding: 10px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Dawin</div>
          <p>Chi tiết đặt chỗ của bạn</p>
        </div>
        
        <div class="section">
          <div class="title">Thông tin đặt chỗ</div>
          <div>Mã đặt chỗ: ${getBookingCode(booking)}</div>
          <div>Ngày đặt: ${new Date(booking.createdAt || booking.bookingDate).toLocaleString('vi-VN')}</div>
          <div>Trạng thái đặt chỗ: <span class="booking-status">${getStatusText(booking.status)}</span></div>
          <div>Trạng thái thanh toán: <span class="payment-status">${getPaymentStatusText(booking.paymentStatus)}</span></div>
          <div>Phương thức thanh toán: ${getPaymentMethodText(booking.paymentMethod)}</div>
        </div>
        
        ${getBookingDetailsForPdf()}
        
        ${getContactDetailsForPdf()}
        
        ${getPaymentDetailsForPdf()}
        
        <div class="footer">
          <p>Cảm ơn bạn đã sử dụng dịch vụ của Dawin!</p>
          <p>Nếu có thắc mắc, vui lòng liên hệ hotline: 1900 1234 hoặc email: support@dawin.vn</p>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const getBookingDetailsForPdf = () => {
    if (!booking) return '';
    
    if (type === 'flight' && 'flight' in booking) {
      const flightBooking = booking as any;
      if (!flightBooking.flight) return '';
      
      return `
        <div class="section">
          <div class="section-title">Thông tin chuyến bay</div>
          <div class="item">
            <span class="label">Chuyến bay:</span>
            <span class="value">${flightBooking.flight.airline || ''} ${flightBooking.flight.flightNumber || ''}</span>
          </div>
          <div class="item">
            <span class="label">Từ:</span>
            <span class="value">${flightBooking.flight.departureCity || ''}</span>
          </div>
          <div class="item">
            <span class="label">Đến:</span>
            <span class="value">${flightBooking.flight.arrivalCity || ''}</span>
          </div>
          <div class="item">
            <span class="label">Ngày khởi hành:</span>
            <span class="value">${formatDate(flightBooking.flight.departureTime || '')}</span>
          </div>
          <div class="item">
            <span class="label">Giờ khởi hành:</span>
            <span class="value">${formatTime(flightBooking.flight.departureTime || '')}</span>
          </div>
          <div class="item">
            <span class="label">Hạng ghế:</span>
            <span class="value">${flightBooking.seatClass || ''}</span>
          </div>
          <div class="item">
            <span class="label">Số hành khách:</span>
            <span class="value">${flightBooking.passengers ? (Array.isArray(flightBooking.passengers) ? flightBooking.passengers.length : flightBooking.passengers) : 0}</span>
          </div>
        </div>
      `;
    } else if (type === 'hotel' && 'hotel' in booking) {
      const hotelBooking = booking as any;
      if (!hotelBooking.hotel) return '';
      
      return `
        <div class="section">
          <div class="section-title">Thông tin khách sạn</div>
          <div class="item">
            <span class="label">Khách sạn:</span>
            <span class="value">${hotelBooking.hotel.name || ''}</span>
          </div>
          <div class="item">
            <span class="label">Địa chỉ:</span>
            <span class="value">${hotelBooking.hotel.address || ''}, ${hotelBooking.hotel.city || ''}</span>
          </div>
          <div class="item">
            <span class="label">Loại phòng:</span>
            <span class="value">${hotelBooking.roomType ? hotelBooking.roomType.name || '' : ''}</span>
          </div>
          <div class="item">
            <span class="label">Ngày nhận phòng:</span>
            <span class="value">${formatDate(hotelBooking.checkInDate || '')}</span>
          </div>
          <div class="item">
            <span class="label">Ngày trả phòng:</span>
            <span class="value">${formatDate(hotelBooking.checkOutDate || '')}</span>
          </div>
          <div class="item">
            <span class="label">Số khách:</span>
            <span class="value">
              ${typeof hotelBooking.guests === 'object' 
                ? `${hotelBooking.guests.adults || 0} người lớn${hotelBooking.guests.children > 0 ? `, ${hotelBooking.guests.children} trẻ em` : ''}`
                : hotelBooking.guests || 0}
            </span>
          </div>
        </div>
      `;
    } else if (type === 'tour' && 'tour' in booking) {
      const tourBooking = booking as any;
      if (!tourBooking.tour) return '';
      
      return `
        <div class="section">
          <div class="section-title">Thông tin tour</div>
          <div class="item">
            <span class="label">Tên tour:</span>
            <span class="value">${tourBooking.tour.name || ''}</span>
          </div>
          <div class="item">
            <span class="label">Điểm khởi hành:</span>
            <span class="value">${tourBooking.tour.startLocation ? (tourBooking.tour.startLocation.description || 'N/A') : 'N/A'}</span>
          </div>
          <div class="item">
            <span class="label">Thời gian:</span>
            <span class="value">${tourBooking.tour.duration || 0} ngày</span>
          </div>
          <div class="item">
            <span class="label">Ngày khởi hành:</span>
            <span class="value">${formatDate(tourBooking.startDate || '')}</span>
          </div>
          <div class="item">
            <span class="label">Số người tham gia:</span>
            <span class="value">${tourBooking.numOfPeople || 0}</span>
          </div>
        </div>
      `;
    }
    
    return '';
  };

  const getContactDetailsForPdf = () => {
    if (!booking) return '';
    
    const contactInfo = booking.contactInfo || {};
    const specialRequests = booking.specialRequests || '';
    
    const contactName = contactInfo.fullName || 
                        contactInfo.name || 
                        (booking as any).contactName || 
                        'N/A';
    
    return `
      <div class="section">
        <div class="section-title">Thông tin liên hệ</div>
        <div class="item">
          <span class="label">Họ và tên:</span>
          <span class="value">${contactName}</span>
        </div>
        <div class="item">
          <span class="label">Email:</span>
          <span class="value">${contactInfo.email || (booking as any).contactEmail || 'N/A'}</span>
        </div>
        <div class="item">
          <span class="label">Số điện thoại:</span>
          <span class="value">${contactInfo.phone || (booking as any).contactPhone || 'N/A'}</span>
        </div>
        ${specialRequests ? `
        <div class="item">
          <span class="label">Yêu cầu đặc biệt:</span>
          <span class="value">${specialRequests}</span>
        </div>
        ` : ''}
      </div>
    `;
  };

  const getPaymentDetailsForPdf = () => {
    if (!booking) return '';
    
    return `
      <div class="section">
        <div class="section-title">Thông tin thanh toán</div>
        <div class="item">
          <span class="label">Trạng thái đặt chỗ:</span>
          <span class="value">
            <span class="status status-${booking.status}">${getStatusText(booking.status)}</span>
          </span>
        </div>
        <div class="item">
          <span class="label">Trạng thái thanh toán:</span>
          <span class="value">
            <span class="status status-${booking.paymentStatus === 'paid' ? 'confirmed' : booking.paymentStatus === 'pending' ? 'pending' : 'cancelled'}">
              ${getPaymentStatusText(booking.paymentStatus)}
            </span>
          </span>
        </div>
        <div class="item">
          <span class="label">Phương thức thanh toán:</span>
          <span class="value">${getPaymentMethodText(booking.paymentMethod)}</span>
        </div>
        <div class="item">
          <span class="label">Tổng tiền:</span>
          <span class="value" style="font-weight: bold; color: #4a90e2;">${booking.totalPrice && typeof booking.totalPrice === 'number' ? booking.totalPrice.toLocaleString('vi-VN') : 0}đ</span>
        </div>
      </div>
    `;
  };

  const generatePdf = async () => {
    if (!booking) return;
    
    try {
      setIsGeneratingPdf(true);
      const html = generateBookingHtml();
      
      if (html) {
        // Tạo file PDF từ HTML
        const { uri } = await Print.printToFileAsync({ html });
        setPdfUri(uri);
        
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const pdfName = `booking_${getBookingCode(booking).replace(/[^a-zA-Z0-9]/g, '')}_${new Date().getTime()}.pdf`;
          
          // Chia sẻ trực tiếp thay vì lưu vào thư viện
          try {
            await Sharing.shareAsync(uri, {
              UTI: '.pdf',
              mimeType: 'application/pdf',
              dialogTitle: 'Lưu hoặc chia sẻ eTicket'
            });
            console.log('PDF đã được chia sẻ thành công');
            return;
          } catch (sharingError) {
            console.error('Lỗi khi chia sẻ PDF:', sharingError);
            
            // Nếu chia sẻ thất bại, thử lưu vào bộ nhớ
            try {
              const fileUri = `${FileSystem.documentDirectory}${pdfName}`;
              await FileSystem.copyAsync({
                from: uri,
                to: fileUri
              });
              
              if (permissionStatus === MediaLibrary.PermissionStatus.GRANTED) {
                try {
                  await MediaLibrary.createAssetAsync(fileUri);
                  Alert.alert(
                    'Thành công',
                    'Tệp PDF đã được lưu vào thư viện của bạn.'
                  );
                } catch (assetError) {
                  console.error('Lỗi khi tạo asset:', assetError);
                  Alert.alert(
                    'Thông báo',
                    'Không thể lưu vào thư viện, nhưng bạn có thể chia sẻ file trực tiếp.',
                    [
                      { 
                        text: 'Chia sẻ', 
                        onPress: async () => {
                          try {
                            await Sharing.shareAsync(fileUri, {
                              mimeType: 'application/pdf',
                              dialogTitle: 'Chia sẻ eTicket',
                            });
                          } catch (error) {
                            console.error('Lỗi khi chia sẻ:', error);
                          }
                        } 
                      },
                      { text: 'Hủy', style: 'cancel' }
                    ]
                  );
                }
              } else {
                // Nếu không có quyền, vẫn cố gắng chia sẻ
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Lưu hoặc chia sẻ eTicket',
                });
              }
            } catch (fileError) {
              console.error('Lỗi khi thao tác với file:', fileError);
              Alert.alert('Lỗi', 'Không thể lưu hoặc chia sẻ PDF. Vui lòng thử lại sau.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      Alert.alert('Lỗi', 'Không thể tạo file PDF. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Cập nhật giao diện xác nhận đặt vé máy bay với thông tin chi tiết theo model mới
  const renderFlightBookingDetails = () => {
    // Kiểm tra nếu là booking tour hoặc hotel, không hiển thị lỗi
    if (type !== 'flight') {
      return null;
    }
    
    // Kiểm tra nếu booking không tồn tại hoặc không có thông tin flight
    if (!booking) {
      console.log('Không có dữ liệu booking để hiển thị');
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
          <Text style={styles.errorText}>Không có dữ liệu đặt chỗ để hiển thị</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Truy cập an toàn các thuộc tính
    const flightInfo = (booking as any).flight || {};
    if (!flightInfo || (typeof flightInfo === 'object' && Object.keys(flightInfo).length === 0)) {
      console.log('Thiếu thông tin chuyến bay');
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
          <Text style={styles.errorText}>Thiếu thông tin chuyến bay cần thiết</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Lấy thông tin chi tiết từ booking
    const flightBooking = booking;
    const flight = flightInfo;

    // Kiểm tra xem có thuộc tính details không
    const bookingDetails = (booking as any).details;
    const passengers = (booking as any).passengers || [];

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Chi tiết đặt vé máy bay</Text>
        
        {/* Thông tin chuyến bay */}
        <View style={styles.flightInfoContainer}>
          <View style={styles.airlineInfo}>
            <Image 
              source={{ uri: flight.airlineLogo || 'https://seeklogo.com/images/V/vietnam-airlines-logo-BD3D2CBB7F-seeklogo.com.png' }} 
              style={styles.airlineLogo} 
            />
            <View>
              <Text style={styles.airlineName}>{flight.airline || 'Không có thông tin'}</Text>
              <Text style={styles.flightNumber}>{flight.flightNumber || 'Không có thông tin'}</Text>
            </View>
          </View>
          
          <View style={styles.routeContainer}>
            <View style={styles.locationContainer}>
              <Text style={styles.timeText}>{flight.departureTime ? formatTime(flight.departureTime) : 'N/A'}</Text>
              <Text style={styles.locationCode}>{flight.departureAirport || flight.departureCity || 'N/A'}</Text>
              <Text style={styles.locationName}>{flight.departureCity || 'Không có thông tin'}</Text>
            </View>
            
            <View style={styles.flightDurationContainer}>
              <Text style={styles.durationText}>{
                flight.departureTime && flight.arrivalTime 
                  ? calculateDuration(flight.departureTime, flight.arrivalTime) 
                  : 'N/A'
              }</Text>
              <View style={styles.flightProgressContainer}>
                <View style={styles.flightProgressLine} />
                <Ionicons name="airplane" size={24} color={colors.tint} style={styles.planeIcon} />
              </View>
              <Text style={styles.directText}>Bay thẳng</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <Text style={styles.timeText}>{flight.arrivalTime ? formatTime(flight.arrivalTime) : 'N/A'}</Text>
              <Text style={styles.locationCode}>{flight.arrivalAirport || flight.arrivalCity || 'N/A'}</Text>
              <Text style={styles.locationName}>{flight.arrivalCity || 'Không có thông tin'}</Text>
            </View>
          </View>
        </View>
        
        {/* Thông tin hành khách */}
        {passengers && passengers.length > 0 ? (
          <View style={styles.passengerSection}>
            <Text style={styles.sectionSubtitle}>
              <Ionicons name="people" size={18} color={colors.tint} style={{marginRight: 8}} />
              Thông tin hành khách
            </Text>
            {passengers.map((passenger: any, index: number) => (
              <View key={index} style={styles.passengerItem}>
                <View style={styles.passengerHeader}>
                  <Text style={styles.passengerName}>
                    {passenger.title} {passenger.firstName} {passenger.lastName}
                  </Text>
                  <View style={styles.passengerTypeBadge}>
                    <Text style={styles.passengerTypeText}>
                      {passenger.type === 'adult' ? 'Người lớn' : 
                       passenger.type === 'child' ? 'Trẻ em' : 'Em bé'}
                    </Text>
                  </View>
                </View>
                {passenger.nationality && (
                  <Text style={styles.passengerDetail}>Quốc tịch: {passenger.nationality}</Text>
                )}
                {passenger.dob && (
                  <Text style={styles.passengerDetail}>Ngày sinh: {formatDate(passenger.dob)}</Text>
                )}
                {passenger.passportNumber && (
                  <Text style={styles.passengerDetail}>Hộ chiếu: {passenger.passportNumber}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.passengerSection}>
            <Text style={styles.sectionSubtitle}>
              <Ionicons name="people" size={18} color={colors.tint} style={{marginRight: 8}} />
              Thông tin hành khách
            </Text>
            <Text style={styles.passengerDetail}>Số lượng: {(booking as any).numOfPassengers || 1} hành khách</Text>
          </View>
        )}
        
        {/* Thông tin đặt chỗ - chỉ hiển thị nếu có */}
        {bookingDetails?.seatSelections && bookingDetails.seatSelections.length > 0 && (
          <View style={styles.seatSection}>
            <Text style={styles.sectionSubtitle}>Chỗ ngồi</Text>
            <View style={styles.seatGrid}>
              {bookingDetails.seatSelections.map((seat: any, index: number) => (
                <View key={index} style={styles.seatItem}>
                  <Text style={styles.seatLabel}>
                    Hành khách {seat.passenger + 1}:
                  </Text>
                  <Text style={styles.seatNumber}>{seat.seatNumber}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Thông tin hành lý - chỉ hiển thị nếu có */}
        {bookingDetails?.baggageOptions && bookingDetails.baggageOptions.length > 0 && (
          <View style={styles.baggageSection}>
            <Text style={styles.sectionSubtitle}>Hành lý</Text>
            {bookingDetails.baggageOptions.map((baggage: any, index: number) => (
              <View key={index} style={styles.baggageItem}>
                <Text style={styles.baggageLabel}>
                  Hành khách {baggage.passenger + 1}:
                </Text>
                <View style={styles.baggageDetails}>
                  <Text style={styles.baggageText}>
                    Hành lý ký gửi: {baggage.checkedBaggage} kg
                  </Text>
                  <Text style={styles.baggageText}>
                    Hành lý xách tay: {baggage.cabinBaggage} kg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Thông tin đặt vé */}
        <View style={styles.bookingInfoSection}>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Mã đặt vé:</Text>
            <Text style={styles.bookingInfoValue}>{(booking as any).bookingReference || (booking as any).bookingNumber || 'N/A'}</Text>
          </View>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Ngày đặt:</Text>
            <Text style={styles.bookingInfoValue}>{formatDate((booking as any).createdAt || '')}</Text>
          </View>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Trạng thái:</Text>
            <View style={[styles.statusBadge, 
              (booking as any).status === 'confirmed' ? styles.statusConfirmed : 
              (booking as any).status === 'cancelled' ? styles.statusCancelled : 
              (booking as any).status === 'completed' ? styles.statusCompleted : 
              styles.statusPending
            ]}>
              <Text style={styles.statusText}>
                {(booking as any).status === 'confirmed' ? 'Đã xác nhận' : 
                 (booking as any).status === 'cancelled' ? 'Đã hủy' : 
                 (booking as any).status === 'completed' ? 'Hoàn thành' : 
                 'Chờ xác nhận'}
              </Text>
            </View>
          </View>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Thanh toán:</Text>
            <View style={[styles.statusBadge, 
              (booking as any).paymentStatus === 'paid' ? styles.statusConfirmed : 
              (booking as any).paymentStatus === 'refunded' ? styles.statusCompleted : 
              (booking as any).paymentStatus === 'failed' ? styles.statusCancelled : 
              styles.statusPending
            ]}>
              <Text style={styles.statusText}>
                {(booking as any).paymentStatus === 'paid' || (booking as any).paymentStatus === 'confirmed' ? 'Đã thanh toán' : 
                 (booking as any).paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 
                 (booking as any).paymentStatus === 'failed' ? 'Thanh toán thất bại' : 
                 'Chờ thanh toán'}
              </Text>
            </View>
          </View>
          {(booking as any).paymentMethod && (
            <View style={styles.bookingInfoItem}>
              <Text style={styles.bookingInfoLabel}>Phương thức thanh toán:</Text>
              <Text style={styles.bookingInfoValue}>
                {(booking as any).paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                 (booking as any).paymentMethod === 'sepay' ? 'SePay' :
                 (booking as any).paymentMethod}
              </Text>
            </View>
          )}
        </View>
        
        {/* Thông tin liên hệ */}
        {(booking as any).contactInfo && (
          <View style={styles.contactSection}>
            <Text style={styles.sectionSubtitle}>Thông tin liên hệ</Text>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Họ tên:</Text>
              <Text style={styles.contactValue}>
                {(booking as any).contactInfo.name || (booking as any).contactInfo.fullName || (booking as any).contactInfo.email || 'N/A'}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{(booking as any).contactInfo.email || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Điện thoại:</Text>
              <Text style={styles.contactValue}>{(booking as any).contactInfo.phone || 'N/A'}</Text>
            </View>
            
            {booking.specialRequests && (
              <View style={styles.specialRequests}>
                <Text style={[styles.specialRequestsLabel, { color: colors.tabIconDefault }]}>
                  Yêu cầu đặc biệt:
                </Text>
                <Text style={[styles.specialRequestsText, { color: colors.text }]}>
                  {booking.specialRequests}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handlePayment = async () => {
    if (!booking || !bookingId || !type) return;
    
    try {
      console.log('Xử lý thanh toán cho booking:', bookingId);
      setIsLoadingPayment(true);
      
      // Nếu đã có payment ID, chuyển đến trang thanh toán ngay
      if (booking && 'paymentId' in booking && booking.paymentId) {
        console.log('Chuyển đến trang thanh toán với ID:', booking.paymentId);
        router.push({
          pathname: '/booking/payment',
          params: { paymentId: booking.paymentId }
        });
        return;
      }
      
      // Lấy payment ID từ API hoặc tạo mới
      try {
        const paymentId = await getPaymentIdFromBooking(bookingId, type as BookingType);
        
        if (paymentId) {
          // Chuyển đến trang thanh toán
          router.push({
            pathname: '/booking/payment',
            params: { paymentId }
          });
          return;
        }
      } catch (error) {
        console.log('Lỗi khi lấy payment ID:', error);
        // Tiếp tục để tạo payment mới nếu không lấy được
      }
      
      // Nếu không lấy được payment, tạo mới payment
      Alert.alert(
        'Khởi tạo thanh toán',
        'Không thể lấy thông tin thanh toán hiện tại. Bạn muốn tạo yêu cầu thanh toán mới?',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Tạo mới', 
            onPress: async () => {
              try {
                setIsLoadingPayment(true);
                
                // Tạo payment request
                const paymentRequest = {
                  bookingId: booking._id,
                  bookingType: type as BookingType,
                  amount: booking.totalPrice || 0,
                  paymentMethod: 'sepay' as const
                };
                
                // Gọi API tạo thanh toán
                console.log('Tạo payment mới với dữ liệu:', paymentRequest);
                const paymentResponse = await paymentService.createPayment(paymentRequest);
                
                if (paymentResponse && paymentResponse._id) {
                  console.log('Đã tạo payment thành công:', paymentResponse._id);
                  
                  // Cập nhật booking với paymentId mới
                  setBooking(prevBooking => prevBooking ? 
                    { ...prevBooking, paymentId: paymentResponse._id } as any : null
                  );
                  
                  // Chuyển đến trang thanh toán
                  router.push({
                    pathname: '/booking/payment',
                    params: { paymentId: paymentResponse._id }
                  });
                } else {
                  throw new Error('Không nhận được payment ID từ API');
                }
              } catch (error) {
                console.error('Lỗi khi tạo payment mới:', error);
                Alert.alert('Lỗi', 'Không thể tạo thanh toán. Vui lòng thử lại sau.');
              } finally {
                setIsLoadingPayment(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Thêm hàm xử lý hủy đơn
  const handleCancelBooking = () => {
    Alert.alert(
      'Xác nhận hủy đơn',
      'Bạn có chắc chắn muốn hủy đơn này không? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: cancelBooking
        }
      ]
    );
  };

  // Hàm gọi API để hủy đơn
  const cancelBooking = async () => {
    if (!bookingId || !type || !token) {
      Alert.alert('Lỗi', 'Không thể hủy đơn. Thiếu thông tin cần thiết.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await bookingsApi.cancelBooking(bookingId, type as BookingType, token);
      
      if (response && response.success) {
        Alert.alert(
          'Thành công',
          'Đơn đã được hủy thành công.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Cập nhật lại trạng thái booking
                if (booking) {
                  setBooking({
                    ...booking,
                    status: 'cancelled'
                  });
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể hủy đơn. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi hủy đơn:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi hủy đơn. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContactInfo = () => {
    const contactInfo = booking &&
      ((booking as any).contactInfo || // Từ booking.contactInfo
      {
        name: (booking as any).user?.name || '',
        phone: (booking as any).user?.phone || '',
        email: (booking as any).user?.email || ''
      });

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin liên hệ</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Người đặt:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {contactInfo?.name || (booking as any).user?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {contactInfo?.email || (booking as any).user?.email || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textDim }]}>Số điện thoại:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {contactInfo?.phone || (booking as any).user?.phone || 'N/A'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ color: colors.text, marginTop: 20 }}>Đang tải thông tin đặt chỗ...</Text>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#f44336" />
        <Text style={{ color: colors.text, marginTop: 20, textAlign: 'center' }}>
          {error || 'Không thể tải thông tin đặt chỗ'}
        </Text>
        <Button 
          style={{ marginTop: 20 }}
          size="medium"
          title="Quay về trang chủ"
          onPress={() => router.push('/') }
          variant="primary"
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Xác nhận đặt chỗ", headerShown: true }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[
          styles.confirmationBanner, 
          { 
            backgroundColor: booking.status === 'cancelled' ? '#f44336' : 
                            booking.status === 'confirmed' ? '#4caf50' : 
                            booking.status === 'completed' ? '#2196f3' : 
                            booking.status === 'pending' ? '#ff9800' : colors.tint 
          }
        ]}>
          <Ionicons 
            name={booking.status === 'cancelled' ? "close-circle" : 
                  booking.status === 'pending' ? "time-outline" : "checkmark-circle"} 
            size={50} 
            color="white" 
          />
          <View style={styles.confirmationTextContainer}>
            <Text style={styles.confirmationTitle}>
              {booking.status === 'cancelled' ? 'Đặt chỗ đã bị hủy' : 
               booking.status === 'confirmed' ? 'Đặt chỗ đã xác nhận!' : 
               booking.status === 'completed' ? 'Đặt chỗ hoàn thành!' : 
               booking.status === 'pending' ? 'Đang chờ xác nhận' :
               'Đặt chỗ thành công!'}
            </Text>
            <Text style={styles.confirmationText}>
              Mã đặt chỗ: {booking.bookingReference || booking.bookingNumber || 'N/A'}
            </Text>
          </View>
        </View>
        
        <BookingSummary type={type as any} data={booking} />

        <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.tabIconDefault }]}>
              Trạng thái đặt chỗ:
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.tabIconDefault }]}>
              Trạng thái thanh toán:
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(booking.paymentStatus) }]}>
              <Text style={styles.statusText}>{getPaymentStatusText(booking.paymentStatus)}</Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.tabIconDefault }]}>
              Phương thức thanh toán:
            </Text>
            <Text style={[styles.paymentMethod, { color: colors.text }]}>
              {getPaymentMethodText(booking.paymentMethod)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Thông tin liên hệ
            </Text>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.tabIconDefault} />
              <Text style={[styles.contactLabel, { color: colors.tabIconDefault }]}>
                Người đặt:
              </Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {booking.contactInfo?.fullName || booking.contactInfo?.name || 
                 (booking.user && typeof booking.user !== 'string' ? booking.user.name : '') || ''}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.tabIconDefault} />
              <Text style={[styles.contactLabel, { color: colors.tabIconDefault }]}>
                Email:
              </Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {booking.contactInfo?.email || 
                 (booking.user && typeof booking.user !== 'string' ? booking.user.email : '') || ''}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.tabIconDefault} />
              <Text style={[styles.contactLabel, { color: colors.tabIconDefault }]}>
                Số điện thoại:
              </Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {booking.contactInfo?.phone || 
                 (booking.user && typeof booking.user !== 'string' ? booking.user.phone : '') || ''}
              </Text>
            </View>
            
            {booking.specialRequests && (
              <View style={styles.specialRequests}>
                <Text style={[styles.specialRequestsLabel, { color: colors.tabIconDefault }]}>
                  Yêu cầu đặc biệt:
                </Text>
                <Text style={[styles.specialRequestsText, { color: colors.text }]}>
                  {booking.specialRequests}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Hiển thị chi tiết dựa vào loại booking - CHỈ HIỂN THỊ CHI TIẾT CHO HOTEL VÀ FLIGHT */}
        {type === 'hotel' && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Chi tiết đặt phòng</Text>
            </View>
            <View style={styles.bookingDetailsContent}>
              {(booking as any).hotel && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Khách sạn:</Text>
                    <Text style={styles.detailValue}>{(booking as any).hotel.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ:</Text>
                    <Text style={styles.detailValue}>{(booking as any).hotel.address || 'N/A'}</Text>
                  </View>
                </>
              )}
              {(booking as any).room && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại phòng:</Text>
                  <Text style={styles.detailValue}>{(booking as any).room.name}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhận phòng:</Text>
                <Text style={styles.detailValue}>{formatDate((booking as any).checkInDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trả phòng:</Text>
                <Text style={styles.detailValue}>{formatDate((booking as any).checkOutDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Số người:</Text>
                <Text style={styles.detailValue}>
                  {typeof (booking as any).guests === 'object' 
                    ? `${(booking as any).guests.adults || 0} người lớn${(booking as any).guests.children > 0 ? `, ${(booking as any).guests.children} trẻ em` : ''}`
                    : (booking as any).guests || 1}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tổng tiền:</Text>
                <Text style={[styles.detailValue, {fontWeight: 'bold', color: colors.tint}]}>
                  {(booking as any).totalPrice?.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {type === 'flight' && renderFlightBookingDetails()}
        
        <View style={styles.actionsContainer}>
          <Button 
            style={{ marginVertical: 8 }}
            textStyle={{ fontWeight: 'bold' }}
            size="medium"
            variant="primary"
            title="Tải eTicket"
            onPress={generatePdf}
            isLoading={isGeneratingPdf}
            icon={<Ionicons name="document-text-outline" size={20} color="white" />}
            iconPosition="left"
          />
          
          {booking.status !== 'cancelled' && booking.status !== 'completed' && 
           booking.paymentMethod === 'sepay' && (booking.paymentStatus === 'pending') && (
            <Button 
              style={{ marginVertical: 8 }}
              textStyle={{ fontWeight: 'bold' }}
              size="medium" 
              variant="primary"
              title="Thanh toán ngay"
              onPress={handlePayment}
              isLoading={isLoadingPayment}
              disabled={isLoadingPayment}
              icon={<Ionicons name="wallet-outline" size={20} color="white" />}
              iconPosition="left"
            />
          )}
          
          <Button 
            style={{ marginVertical: 8 }}
            textStyle={{ fontWeight: 'bold' }}
            size="medium"
            variant="secondary"
            title="Chia sẻ thông tin đặt chỗ"
            onPress={handleShare}
            icon={<Ionicons name="share-outline" size={20} color="white" />}
            iconPosition="left"
          />
          
          {/* Hiển thị thông báo hủy đơn nếu đã bị hủy */}
          {booking.status === 'cancelled' && (
            <View style={[styles.statusCard, { backgroundColor: '#ffebee', borderColor: '#f44336' }]}>
              <View style={styles.statusRow}>
                <Ionicons name="information-circle-outline" size={24} color="#f44336" />
                <Text style={[styles.statusLabel, { color: '#f44336', marginLeft: 8 }]}>
                  Đơn đặt chỗ này đã bị hủy
                </Text>
              </View>
            </View>
          )}

          {/* Hiển thị thông báo đang chờ xác nhận */}
          {booking.status === 'pending' && (
            <View style={[styles.statusCard, { backgroundColor: '#fff3e0', borderColor: '#ff9800' }]}>
              <View style={styles.statusRow}>
                <Ionicons name="time-outline" size={24} color="#ff9800" />
                <Text style={[styles.statusLabel, { color: '#ff9800', marginLeft: 8 }]}>
                  Đơn đặt chỗ đang chờ xác nhận
                </Text>
              </View>
              <Text style={[styles.statusLabel, { color: '#666', fontSize: 14, marginTop: 8 }]}>
                Chúng tôi sẽ xác nhận đơn đặt chỗ của bạn trong vòng 24 giờ
              </Text>
            </View>
          )}

          {/* Thêm nút Hủy đơn chỉ hiển thị khi đơn ở trạng thái pending hoặc confirmed */}
          {booking && (booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button 
              style={{ marginVertical: 8, backgroundColor: '#f44336' }}
              textStyle={{ fontWeight: 'bold' }}
              size="medium"
              variant="primary"
              title="Hủy đơn"
              onPress={handleCancelBooking}
              icon={<Ionicons name="close-circle-outline" size={20} color="white" />}
              iconPosition="left"
            />
          )}
          
          <Button 
            style={{ marginVertical: 8 }}
            textStyle={{ fontWeight: 'bold' }}
            size="medium"
            variant="secondary"
            title="Về trang chủ"
            onPress={() => router.push('/')}
            icon={<Ionicons name="home-outline" size={20} color="white" />}
            iconPosition="left"
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmationTextContainer: {
    marginLeft: 12,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  confirmationText: {
    fontSize: 15,
    color: 'white',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: '500',
  },
  contactInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 15,
    marginLeft: 8,
    width: 100,
    color: '#666',
  },
  contactValue: {
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  specialRequests: {
    marginTop: 12,
  },
  specialRequestsLabel: {
    fontSize: 15,
    marginBottom: 4,
    color: '#666',
  },
  specialRequestsText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  detailSection: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    paddingLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flightInfoContainer: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
  },
  airlineName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  flightNumber: {
    fontSize: 15,
    color: '#666',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  flightDurationContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  flightProgressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  flightProgressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
  },
  planeIcon: {
    position: 'absolute',
    left: '50%',
    top: -10,
    marginLeft: -12,
  },
  directText: {
    fontSize: 14,
    color: '#888',
  },
  passengerSection: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passengerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  passengerItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  passengerTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#e1f5fe',
  },
  passengerTypeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0288d1',
  },
  passengerDetail: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
    lineHeight: 22,
  },
  seatSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionSubtitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seatItem: {
    width: '50%',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  seatLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  seatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  baggageSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  baggageItem: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  baggageLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 6,
  },
  baggageDetails: {
    marginLeft: 12,
  },
  baggageText: {
    fontSize: 14,
  },
  bookingInfoSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookingInfoItem: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingInfoLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  bookingInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  contactSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactItem: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialRequestsSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalPriceContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3ecf7',
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0288d1',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    minWidth: 100,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  paymentButton: {
    backgroundColor: '#4caf50',
  },
  shareButton: {
    backgroundColor: '#ff9800',
  },
  pdfButton: {
    backgroundColor: '#2196f3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  statusConfirmed: {
    backgroundColor: '#4caf50',
  },
  statusCancelled: {
    backgroundColor: '#f44336',
  },
  statusPending: {
    backgroundColor: '#ff9800',
  },
  statusCompleted: {
    backgroundColor: '#2196f3',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // Styles cho thông tin chi tiết booking
  bookingDetailsContent: {
    padding: 16,
  },
}); 