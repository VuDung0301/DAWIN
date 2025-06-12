import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { bookingsApi, tourBookingsApi, hotelBookingsApi, flightBookingsApi } from '@/lib/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FontAwesome5 } from '@expo/vector-icons';

// Đảm bảo mã hoạt động ngay cả khi không có hook useToast
const useSimpleToast = () => {
  const showToast = (message: string, type?: string) => {
    Alert.alert(type === 'error' ? 'Lỗi' : 'Thông báo', message);
  };
  return { showToast };
};

export default function BookingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useSimpleToast();

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingType, setBookingType] = useState<'all' | 'tour' | 'flight' | 'hotel'>('all');
  const [flightBookings, setFlightBookings] = useState<any[]>([]);
  const [tourBookings, setTourBookings] = useState<any[]>([]);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'tour' | 'flight' | 'hotel'>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllBookings();
    }
  }, [isAuthenticated]);

  // Thêm useEffect để kiểm tra cấu trúc dữ liệu booking khi nó thay đổi
  useEffect(() => {
    if (tourBookings.length > 0) {
      console.log('===== KIỂM TRA CẤU TRÚC TOUR BOOKING =====');
      console.log('Tour booking đầu tiên:', JSON.stringify(tourBookings[0], null, 2));
    }
  }, [tourBookings]);

  const fetchAllBookings = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Tạo mảng promises để có thể bắt lỗi riêng cho từng request
      const flightPromise = flightBookingsApi.getMyBookings(token).catch(error => {
        console.error('Lỗi lấy danh sách vé máy bay:', error);
        return { success: false, data: [], message: 'Không thể lấy danh sách vé máy bay' };
      });
      
      const tourPromise = tourBookingsApi.getMyBookings(token).catch(error => {
        console.error('Lỗi lấy danh sách tour:', error);
        return { success: false, data: [], message: 'Không thể lấy danh sách tour' };
      });
      
      const hotelPromise = hotelBookingsApi.getMyBookings(token).catch(error => {
        console.error('Lỗi lấy danh sách đặt phòng:', error);
        return { success: false, data: [], message: 'Không thể lấy danh sách đặt phòng khách sạn' };
      });
      
      // Thực hiện đồng thời cả ba request với xử lý lỗi riêng biệt
      const [flightResponse, tourResponse, hotelResponse] = await Promise.all([
        flightPromise, tourPromise, hotelPromise
      ]);

      // Xử lý dữ liệu đặt vé máy bay
      if (flightResponse.success && flightResponse.data) {
        console.log('Flight bookings data:', flightResponse.data);
        setFlightBookings(flightResponse.data);
      } else {
        console.error('Lỗi lấy danh sách vé máy bay:', flightResponse.message);
        setFlightBookings([]);
      }

      // Xử lý dữ liệu đặt tour
      if (tourResponse.success && tourResponse.data) {
        console.log('Tour bookings data RAW:', tourResponse.data);
        
        // Kiểm tra cấu trúc dữ liệu và làm sạch
        const processedTourBookings = tourResponse.data.map(booking => {
          // Đảm bảo _id luôn tồn tại
          if (!booking._id && booking.id) {
            booking._id = booking.id;
          }
          
          // Đảm bảo booking có thông tin cơ bản
          if (!booking.totalPrice && booking.price) {
            booking.totalPrice = booking.price;
          }
          
          // Xác định tour ID nếu chưa có
          if (!booking.tourId && booking.tour && booking.tour._id) {
            booking.tourId = booking.tour._id;
          } else if (!booking.tourId && booking.tour && booking.tour.id) {
            booking.tourId = booking.tour.id;
          }
          
          return booking;
        });
        
        console.log('Tour bookings đã xử lý:', processedTourBookings);
        setTourBookings(processedTourBookings);
      } else {
        console.error('Lỗi lấy danh sách tour:', tourResponse.message);
        setTourBookings([]);
      }

      // Xử lý dữ liệu đặt phòng khách sạn - thử tối đa 2 lần nếu thất bại
      if (hotelResponse.success && hotelResponse.data) {
        console.log('Hotel bookings data:', hotelResponse.data);
        
        // Kiểm tra cấu trúc dữ liệu và làm sạch
        const processedHotelBookings = hotelResponse.data.map(booking => {
          // Đảm bảo _id luôn tồn tại
          if (!booking._id && booking.id) {
            booking._id = booking.id;
          }
          
          // Đảm bảo booking có thông tin cơ bản
          if (!booking.totalPrice && booking.price) {
            booking.totalPrice = booking.price;
          }
          
          return booking;
        });
        
        setHotelBookings(processedHotelBookings);
      } else {
        console.error('Lỗi lấy danh sách đặt phòng khách sạn:', hotelResponse.message);
        
        // Thử lại một lần nữa nếu lỗi
        try {
          console.log('Thử lại lấy danh sách đặt phòng khách sạn...');
          const retryResponse = await hotelBookingsApi.getMyBookings(token);
          
          if (retryResponse.success && retryResponse.data) {
            console.log('Thử lại thành công, hotel bookings data:', retryResponse.data);
            setHotelBookings(retryResponse.data);
          } else {
            console.error('Vẫn lỗi sau khi thử lại:', retryResponse.message);
            setHotelBookings([]);
          }
        } catch (retryError) {
          console.error('Lỗi khi thử lại:', retryError);
          setHotelBookings([]);
        }
      }
    } catch (error) {
      console.error('Lỗi chung khi lấy danh sách đặt chỗ:', error);
      // Đặt tất cả danh sách thành mảng rỗng trong trường hợp lỗi
      setFlightBookings([]);
      setTourBookings([]);
      setHotelBookings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllBookings();
  };

  // Hàm lấy màu dựa trên trạng thái đặt chỗ
  const getStatusColor = (status: string) => {
    status = status?.toLowerCase() || '';
    
    switch (status) {
      case 'confirmed':
      case 'xác nhận':
      case 'đã xác nhận':
        return '#4CAF50'; // Xanh lá
      case 'pending':
      case 'chờ xác nhận':
        return '#FF9800'; // Cam
      case 'cancelled':
      case 'hủy':
      case 'đã hủy':
        return '#F44336'; // Đỏ
      case 'completed':
      case 'hoàn thành':
      case 'đã hoàn thành':
        return '#2196F3'; // Xanh dương
      case 'failed':
      case 'thất bại':
        return '#9E9E9E'; // Xám
      default:
        return '#9E9E9E'; // Xám cho trạng thái không xác định
    }
  };

  // Hàm lấy text hiển thị cho trạng thái
  const getStatusText = (status: string) => {
    status = status?.toLowerCase() || '';
    
    switch (status) {
      case 'confirmed':
      case 'xác nhận':
      case 'đã xác nhận':
        return 'Đã xác nhận';
      case 'pending':
      case 'chờ xác nhận':
        return 'Chờ xác nhận';
      case 'cancelled':
      case 'hủy':
      case 'đã hủy':
        return 'Đã hủy';
      case 'completed':
      case 'hoàn thành':
      case 'đã hoàn thành':
        return 'Đã hoàn thành';
      case 'failed':
      case 'thất bại':
        return 'Thất bại';
      default:
        return 'Không xác định';
    }
  };

  const renderTourBookingItem = ({ item: booking }: { item: any }) => {
    console.log('Đang render tour booking:', booking);
    
    // Xử lý dữ liệu tour
    const tour = booking.tour || {};
    const tourId = tour._id || booking.tourId || '';
    const bookingId = booking._id || '';
    
    // Xử lý tên tour
    const tourName = tour.name || booking.tourName || 'Tour không xác định';
    
    // Xử lý ngày tour
    let startDate = null;
    let endDate = null;
    try {
      startDate = booking.startDate ? new Date(booking.startDate) : null;
      endDate = booking.endDate ? new Date(booking.endDate) : null;
    } catch (e) {
      console.error('Lỗi xử lý ngày tour:', e);
    }
    
    const formattedStartDate = startDate 
      ? format(startDate, 'dd/MM/yyyy', { locale: vi })
      : 'N/A';
    const formattedEndDate = endDate
      ? format(endDate, 'dd/MM/yyyy', { locale: vi })
      : 'N/A';
    
    // Tính số ngày tour
    let duration = 0;
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      duration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    } else if (tour.duration) {
      duration = tour.duration;
    }
    
    // Xử lý số lượng khách và giá tiền
    const adultCount = booking.adults || 0;
    const childrenCount = booking.children || 0;
    const totalPrice = booking.totalPrice || 0;
    const formattedPrice = totalPrice.toLocaleString('vi-VN') + 'đ';
    
    // Xử lý trạng thái
    const status = booking.status || 'pending';
    
    // Lấy ảnh tour
    let tourImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop";
    
    // Tìm ảnh theo thứ tự ưu tiên
    if (tour.images && tour.images.length > 0) {
      tourImage = tour.images[0];
    } else if (tour.coverImage) {
      tourImage = tour.coverImage;
    } else if (booking.tourImage) {
      tourImage = booking.tourImage;
    } else if (tour.image) {
      tourImage = tour.image;
    }
    
    // Lấy trạng thái đặt tour
    const statusText = getStatusText(status);
    const statusColor = getStatusColor(status);
    
    return (
      <View style={styles.bookingItem}>
        <Image
          source={{ uri: tourImage }}
          style={styles.bookingThumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.bookingHeaderWithBadge}>
          <View style={[styles.bookingTypeIndicator, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="map-outline" size={14} color="white" />
            <Text style={styles.bookingTypeText}>Tour</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <Text style={[styles.tourName, { paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }]} numberOfLines={2}>
          {tourName}
        </Text>
        
        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailItem}>
            <Ionicons name="location-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText} numberOfLines={1}>
              {tour.destination || booking.destination || "Địa điểm không xác định"}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="calendar-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {formattedStartDate} {duration > 0 ? `(${duration} ngày)` : ''}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="people-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {adultCount} người lớn {childrenCount > 0 ? ` & ${childrenCount} trẻ em` : ''}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="cash-outline" size={18} color="#777" />
            <Text style={[styles.bookingDetailText, { fontWeight: '700', color: '#FF385C' }]}>
              {formattedPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <TouchableOpacity 
            style={[styles.viewDetailsButton, { borderColor: '#4CAF50', width: '100%' }]}
            onPress={() => {
              if (bookingId) {
                // Chuyển đến trang chi tiết đặt chỗ tour nếu có bookingId
                router.push(`/booking/confirmation?bookingId=${bookingId}&type=tour`);
              } else if (tourId) {
                // Fallback đến trang chi tiết tour nếu không có bookingId nhưng có tourId
                router.push(`/tour/${tourId}`);
              } else {
                showToast('Không tìm thấy thông tin đặt tour', 'error');
              }
            }}
          >
            <Text style={[styles.viewDetailsText, { color: '#4CAF50' }]}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFlightBookingItem = (booking: any) => {
    console.log('Đang render flight booking:', booking);
    const flight = booking.flight || {};
    const flightId = flight._id || booking.flightId || '';
    const bookingId = booking._id || '';
    
    // Xử lý thông tin chi tiết chuyến bay
    const departureCity = flight.departureCity || booking.departureCity || 'N/A';
    const arrivalCity = flight.arrivalCity || booking.arrivalCity || 'N/A';
    const flightTitle = `${departureCity} - ${arrivalCity}`;
    
    // Kiểm tra xem có mã chuyến bay (flightNumber) không
    const flightNumber = flight.flightNumber || booking.flightNumber || '';
    const flightDisplay = flightNumber ? `${departureCity} - ${arrivalCity} (${flightNumber})` : flightTitle;
    
    // Xử lý đúng ngày giờ
    let departureTime = null;
    try {
      departureTime = flight.departureTime || booking.departureTime ? new Date(flight.departureTime || booking.departureTime) : null;
    } catch (e) {
      console.error('Lỗi chuyển đổi ngày bay:', e);
    }
    
    const formattedDepartureTime = departureTime
      ? format(departureTime, 'HH:mm - dd/MM/yyyy', { locale: vi })
      : 'N/A';
      
    // Xử lý số lượng hành khách và giá tiền
    const guestsData = booking.passengers?.length || booking.numOfPassengers || 1;
    let guestCount: string | number = 0;

    // Kiểm tra xem guests có phải là đối tượng có thuộc tính adults và children không
    if (typeof guestsData === 'object' && guestsData !== null && 'adults' in guestsData) {
      const adults = guestsData.adults || 0;
      const children = guestsData.children || 0;
      guestCount = adults + children;
    } else if (typeof guestsData === 'number') {
      guestCount = guestsData;
    }

    const totalPrice = booking.totalPrice || 0;
    const formattedPrice = totalPrice.toLocaleString('vi-VN') + 'đ';
    
    // Xử lý trạng thái
    const status = booking.status || 'pending';
    const statusText = getStatusText(status);
    const statusColor = getStatusColor(status);
    
    // Kiểm tra nếu đã qua ngày bay
    const isPastDate = departureTime ? departureTime.getTime() < new Date().getTime() : false;
    const canCancel = booking.status !== 'cancelled' && !isPastDate;
    
    // Lấy ảnh đại diện cho chuyến bay
    let flightImage = flight.image || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop';
    
    return (
      <View style={[styles.bookingItem, { backgroundColor: colors.cardBackground }]}>
        <Image
          source={{ uri: flightImage }}
          style={styles.bookingThumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.bookingHeaderWithBadge}>
          <View style={[styles.bookingTypeIndicator, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="airplane-outline" size={14} color="white" />
            <Text style={styles.bookingTypeText}>Vé máy bay</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <Text style={[styles.tourName, { paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }]} numberOfLines={2}>
          {flightTitle !== 'N/A - N/A' ? flightDisplay : 'Chuyến bay ' + (bookingId || '(không có mã)')}
        </Text>
        
        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailItem}>
            <Ionicons name="time-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {formattedDepartureTime}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="airplane" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {flight.airline || booking.airline || 'Không xác định'}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="people-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {typeof guestCount === 'number' ? `${guestCount} hành khách` : guestCount}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="cash-outline" size={18} color="#777" />
            <Text style={[styles.bookingDetailText, { fontWeight: '700', color: '#FF385C' }]}>
              {formattedPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <TouchableOpacity 
            style={[styles.viewDetailsButton, { borderColor: '#2196F3', width: '100%' }]}
            onPress={() => {
              if (bookingId) {
                router.push(`/booking/confirmation?bookingId=${bookingId}&type=flight`);
              } else if (flightId) {
                router.push(`/flight/${flightId}`);
              } else {
                showToast('Không tìm thấy thông tin chuyến bay', 'error');
              }
            }}
          >
            <Text style={[styles.viewDetailsText, { color: '#2196F3' }]}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Thêm debug log cho dữ liệu booking
  useEffect(() => {
    if (hotelBookings.length > 0) {
      console.log('===== Hotel Booking Data (First Item) =====');
      console.log('Hotel:', hotelBookings[0].hotel);
      console.log('Room:', hotelBookings[0].room);
      console.log('Dates:', {
        checkIn: hotelBookings[0].checkIn,
        checkOut: hotelBookings[0].checkOut
      });
      console.log('Status:', hotelBookings[0].status);
      console.log('Price:', hotelBookings[0].totalPrice);
    }
    if (tourBookings.length > 0) {
      console.log('===== Tour Booking Data (First Item) =====');
      console.log('Tour:', tourBookings[0].tour);
      console.log('Dates:', {
        startDate: tourBookings[0].startDate,
        endDate: tourBookings[0].endDate
      });
      console.log('Status:', tourBookings[0].status);
      console.log('Price:', tourBookings[0].totalPrice);
    }
    if (flightBookings.length > 0) {
      console.log('===== Flight Booking Data (First Item) =====');
      console.log('Flight:', flightBookings[0].flight);
      console.log('Dates:', {
        departureDate: flightBookings[0].departureDate,
        returnDate: flightBookings[0].returnDate
      });
      console.log('Status:', flightBookings[0].status);
      console.log('Price:', flightBookings[0].totalPrice);
    }
  }, [hotelBookings, tourBookings, flightBookings]);

  const renderHotelBookingItem = (booking: any) => {
    console.log('Đang render hotel booking:', booking);
    
    // Xử lý dữ liệu khách sạn
    const hotel = booking.hotel || {};
    const hotelId = hotel._id || booking.hotelId || '';
    const bookingId = booking._id || '';
    const hotelName = hotel.name || booking.hotelName || 'Khách sạn không xác định';
    
    // Xử lý thông tin đặt phòng
    const roomType = booking.roomType || booking.roomTypeInfo || {};
    const roomName = roomType.name || booking.roomName || 'Phòng tiêu chuẩn';
    
    // Xử lý ngày check-in, check-out
    let checkIn = null;
    let checkOut = null;
    
    try {
      checkIn = booking.checkInDate ? new Date(booking.checkInDate) : null;
      checkOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
    } catch (e) {
      console.error('Lỗi xử lý ngày check-in/out:', e);
    }
    
    const formattedCheckIn = checkIn
      ? format(checkIn, 'dd/MM/yyyy', { locale: vi })
      : 'N/A';
    const formattedCheckOut = checkOut
      ? format(checkOut, 'dd/MM/yyyy', { locale: vi })
      : 'N/A';
    
    // Tính số đêm lưu trú
    let nights = 0;
    if (checkIn && checkOut) {
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    
    // Số lượng khách và giá tiền
    const guestsData = booking.guests || 0;
    let guestCount: string | number = 0;

    // Kiểm tra xem guests có phải là đối tượng có thuộc tính adults và children không
    if (typeof guestsData === 'object' && guestsData !== null && 'adults' in guestsData) {
      const adults = guestsData.adults || 0;
      const children = guestsData.children || 0;
      guestCount = adults + children;
    } else if (typeof guestsData === 'number') {
      guestCount = guestsData;
    }

    const totalPrice = booking.totalPrice || 0;
    const formattedPrice = totalPrice.toLocaleString('vi-VN') + 'đ';
    
    // Trạng thái đặt phòng
    const status = booking.status || 'pending';
    const statusText = getStatusText(status);
    const statusColor = getStatusColor(status);
    
    // Lấy ảnh khách sạn
    let hotelImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop";
    
    if (hotel.images && hotel.images.length > 0) {
      hotelImage = hotel.images[0];
    } else if (hotel.coverImage) {
      hotelImage = hotel.coverImage;
    } else if (booking.hotelImage) {
      hotelImage = booking.hotelImage;
    } else if (hotel.image) {
      hotelImage = hotel.image;
    }
    
    return (
      <View style={styles.bookingItem}>
        <Image
          source={{ uri: hotelImage }}
          style={styles.bookingThumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.bookingHeaderWithBadge}>
          <View style={[styles.bookingTypeIndicator, { backgroundColor: '#E91E63' }]}>
            <Ionicons name="bed-outline" size={14} color="white" />
            <Text style={styles.bookingTypeText}>Khách sạn</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <Text style={[styles.tourName, { paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }]} numberOfLines={2}>
          {hotelName}
        </Text>
        
        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailItem}>
            <Ionicons name="business-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText} numberOfLines={1}>
              {roomName}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="calendar-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {formattedCheckIn} {nights > 0 ? `(${nights} đêm)` : ''}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="people-outline" size={18} color="#777" />
            <Text style={styles.bookingDetailText}>
              {typeof guestCount === 'number' ? `${guestCount} khách` : guestCount}
            </Text>
          </View>
          
          <View style={styles.bookingDetailItem}>
            <Ionicons name="cash-outline" size={18} color="#777" />
            <Text style={[styles.bookingDetailText, { fontWeight: '700', color: '#FF385C' }]}>
              {formattedPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <TouchableOpacity 
            style={[styles.viewDetailsButton, { borderColor: '#E91E63', width: '100%' }]}
            onPress={() => {
              if (bookingId) {
                router.push(`/booking/confirmation?bookingId=${bookingId}&type=hotel`);
              } else if (hotelId) {
                router.push(`/hotel/${hotelId}`);
              } else {
                showToast('Không tìm thấy thông tin đặt phòng', 'error');
              }
            }}
          >
            <Text style={[styles.viewDetailsText, { color: '#E91E63' }]}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Screen
          options={{
            title: "Đặt chỗ của tôi",
            headerShown: true,
          }}
        />
        <View style={styles.notLoggedInContainer}>
          <Text style={[styles.notLoggedInText, { color: colors.text }]}>
            Bạn cần đăng nhập để xem lịch sử đặt chỗ
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Lọc bookings theo loại được chọn
  const filteredBookings = useMemo(() => {
    // Sắp xếp bookings theo thời gian tạo mới nhất
    const sortBookings = (bookings: any[]) => {
      return [...bookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    };

    switch (activeTab) {
      case 'tour':
        return sortBookings(tourBookings.filter(booking => booking && (booking._id || booking.id)));
      case 'flight':
        return sortBookings(flightBookings.filter(booking => booking && (booking._id || booking.id)));
      case 'hotel':
        return sortBookings(hotelBookings.filter(booking => booking && (booking._id || booking.id)));
      default:
        // Kết hợp tất cả loại booking
        const allBookings = [
          ...tourBookings.filter(booking => booking && (booking._id || booking.id)),
          ...flightBookings.filter(booking => booking && (booking._id || booking.id)),
          ...hotelBookings.filter(booking => booking && (booking._id || booking.id))
        ];
        return sortBookings(allBookings);
    }
  }, [activeTab, tourBookings, flightBookings, hotelBookings]);

  // Hàm render booking item dựa vào loại
  const renderBookingItem = ({ item }: { item: any }) => {
    console.log('Đang render item:', item._id || item.id, 'loại:', 
                item.tour ? 'tour' : (item.flight ? 'flight' : 'hotel'));
    
    // Xác định loại booking để render đúng component
    if (item.tour || item.tourId) {
      return renderTourBookingItem({ item });
    } else if (item.flight || item.flightId) {
      return renderFlightBookingItem(item);
    } else {
      return renderHotelBookingItem(item);
    }
  };

  // Đếm số lượng booking theo loại
  const getBookingCount = (type: string): number => {
    switch (type) {
      case 'tour':
        return tourBookings.length;
      case 'flight':
        return flightBookings.length;
      case 'hotel':
        return hotelBookings.length;
      default:
        return tourBookings.length + flightBookings.length + hotelBookings.length;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: "Đặt chỗ của tôi",
          headerShown: true,
        }}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            style={[styles.filterButton, activeTab === 'all' && styles.activeFilterButton]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.filterText, activeTab === 'all' && styles.activeFilterText]}>
              Tất cả ({getBookingCount('all')})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, activeTab === 'tour' && styles.activeFilterButton]}
            onPress={() => setActiveTab('tour')}
          >
            <Text style={[styles.filterText, activeTab === 'tour' && styles.activeFilterText]}>
              Tour ({getBookingCount('tour')})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, activeTab === 'flight' && styles.activeFilterButton]}
            onPress={() => setActiveTab('flight')}
          >
            <Text style={[styles.filterText, activeTab === 'flight' && styles.activeFilterText]}>
              Vé máy bay ({getBookingCount('flight')})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, activeTab === 'hotel' && styles.activeFilterButton]}
            onPress={() => setActiveTab('hotel')}
          >
            <Text style={[styles.filterText, activeTab === 'hotel' && styles.activeFilterText]}>
              Khách sạn ({getBookingCount('hotel')})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={{ marginTop: 12, color: '#777' }}>Đang tải danh sách đặt chỗ...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id || item.id || `booking-${Math.random()}`}
          renderItem={renderBookingItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FF385C"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={70} color="#DDDDDD" />
              <Text style={[styles.emptyText, { fontWeight: 'bold', fontSize: 18, marginTop: 20, marginBottom: 8, color: '#444' }]}>
                Chưa có đặt chỗ nào
              </Text>
              <Text style={styles.emptyText}>
                Hãy đặt tour, khách sạn hoặc vé máy bay để xem thông tin tại đây
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF385C',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 30,
                  marginTop: 20,
                }}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Khám phá ngay</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            filteredBookings.length === 0 && { flexGrow: 1 }
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 10,
  },
  filterScroll: {
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F1F4F9',
  },
  activeFilterButton: {
    backgroundColor: '#FF385C',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  activeFilterText: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  bookingThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E0E0',
  },
  bookingHeaderWithBadge: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  bookingTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  bookingTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tourName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    padding: 16,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingDetailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#555',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  viewDetailsButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF385C',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF385C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  authButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 