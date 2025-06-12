import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  SafeAreaView,
  Alert,
  Share
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';
import { flightsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, addMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
  
  // Thêm thông tin giá và số lượng ghế (được thêm vào từ backend)
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

export default function FlightDetailScreen() {
  const { id, date, status } = useLocalSearchParams<{ id: string, date: string, status: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [flight, setFlight] = useState<FlightResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<'economy' | 'business' | 'firstClass'>('economy');

  useEffect(() => {
    fetchFlightData();
  }, [id, date]);

  const fetchFlightData = async () => {
    if (!id || !date) {
      Alert.alert('Lỗi', 'Thiếu thông tin chuyến bay');
      return;
    }

    setIsLoading(true);
    try {
      const response = await flightsApi.getFlightDetail(id, date);
      
      if (response.success && response.data) {
        // API trả về thông tin chuyến bay
        setFlight(response.data);
        console.log('Đã lấy thông tin chuyến bay:', response.data.flight.iata);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin chuyến bay');
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Chưa đăng nhập',
        'Bạn cần đăng nhập để đặt vé',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    if (!flight) {
      Alert.alert('Lỗi', 'Không thể tải thông tin chuyến bay');
      return;
    }

    // Kiểm tra số lượng ghế trống
    if (!flight.seatsAvailable) {
      Alert.alert('Thông báo', 'Không có thông tin về số ghế trống');
      return;
    }
    
    const availableSeats = flight.seatsAvailable[selectedClass];
    if (!availableSeats || availableSeats <= 0) {
      Alert.alert('Thông báo', `Không còn ghế trống cho hạng ${selectedClass}`);
      return;
    }

    // Chuyển hướng đến trang đặt vé với đầy đủ thông tin
    router.push({
      pathname: '/booking/flight',
      params: { 
        flightIata: flight.flight.iata,
        flightDate: flight.flight_date,
        departureAirport: flight.departure.airport,
        departureIata: flight.departure.iata,
        arrivalAirport: flight.arrival.airport,
        arrivalIata: flight.arrival.iata,
        airline: flight.airline.name,
        class: selectedClass,
        price: flight.price ? flight.price[selectedClass].toString() : '0'
      }
    });
  };

  const shareFlightDetails = async () => {
    if (!flight) return;

    try {
      const departureTime = formatDateTime(flight.departure.scheduled);
      const arrivalTime = formatDateTime(flight.arrival.scheduled);
      
      const message = `
Chuyến bay: ${flight.flight.iata}
Hãng: ${flight.airline.name}
Ngày bay: ${formatDate(flight.flight_date)}
${flight.departure.airport} (${flight.departure.iata}) → ${flight.arrival.airport} (${flight.arrival.iata})
Giờ bay: ${departureTime} - ${arrivalTime}
Trạng thái: ${getStatusText(flight.flight_status)}
      `;
      
      await Share.share({
        message,
        title: `Thông tin chuyến bay ${flight.flight.iata}`,
      });
    } catch (error) {
      console.error('Không thể chia sẻ thông tin:', error);
    }
  };

  // Format ngày giờ
  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm', { locale: vi });
    } catch (error) {
      return 'Không xác định';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Tính thời gian bay
  const calculateDuration = (departureTime: string, arrivalTime: string) => {
    try {
      const departure = parseISO(departureTime);
      const arrival = parseISO(arrivalTime);
      
      // Tính số phút giữa hai thời điểm
      const diffInMinutes = Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60));
      
      // Chuyển đổi sang giờ và phút
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Lấy màu và text theo trạng thái chuyến bay
  const getStatusInfo = (status: string) => {
    let backgroundColor, textColor, statusText;
    
    switch (status) {
      case 'scheduled':
        backgroundColor = 'rgba(59, 130, 246, 0.1)'; // blue-50
        textColor = '#3b82f6'; // blue-500
        statusText = 'Lịch trình';
        break;
      case 'active':
        backgroundColor = 'rgba(5, 150, 105, 0.1)'; // green-50
        textColor = '#059669'; // green-600
        statusText = 'Đang bay';
        break;
      case 'landed':
        backgroundColor = 'rgba(75, 85, 99, 0.1)'; // gray-50
        textColor = '#4b5563'; // gray-600
        statusText = 'Đã hạ cánh';
        break;
      case 'cancelled':
        backgroundColor = 'rgba(239, 68, 68, 0.1)'; // red-50
        textColor = '#ef4444'; // red-500
        statusText = 'Đã hủy';
        break;
      case 'diverted':
        backgroundColor = 'rgba(124, 58, 237, 0.1)'; // purple-50
        textColor = '#7c3aed'; // purple-600
        statusText = 'Chuyển hướng';
        break;
      case 'incident':
        backgroundColor = 'rgba(234, 179, 8, 0.1)'; // yellow-50
        textColor = '#eab308'; // yellow-500
        statusText = 'Sự cố';
        break;
      case 'delayed':
        backgroundColor = 'rgba(249, 115, 22, 0.1)'; // orange-50
        textColor = '#f97316'; // orange-500
        statusText = 'Trễ';
        break;
      default:
        backgroundColor = 'rgba(107, 114, 128, 0.1)'; // gray-50
        textColor = '#6b7280'; // gray-500
        statusText = 'Không xác định';
    }
    
    return { backgroundColor, textColor, statusText };
  };
  
  const getStatusText = (status: string) => {
    return getStatusInfo(status).statusText;
  };

  // Thêm function để điều hướng đến trang đặt vé bay
  const navigateToBooking = () => {
    console.log('Chuyển đến trang đặt vé:', flight?.flight.iata, flight?.flight_date);
    
    if (!flight) return;
    
    // Lấy giá từ thuộc tính price nếu có, hoặc giá mặc định nếu không
    const price = flight.price?.economy || 1000000;
    
    router.push({
      pathname: '/booking/flight',
      params: {
        flightIata: flight.flight.iata,
        flightDate: flight.flight_date,
        departureAirport: flight.departure.airport || '',
        arrivalAirport: flight.arrival.airport || '',
        airline: flight.airline.name || '',
        price: price.toString()
      }
    });
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

  // Thông tin trạng thái
  const { backgroundColor, textColor, statusText } = getStatusInfo(flight.flight_status);
  
  // Tính thời gian bay
  const flightDuration = calculateDuration(flight.departure.scheduled, flight.arrival.scheduled);
  
  // Xử lý delay
  const departureDelay = flight.departure.delay || 0;
  const arrivalDelay = flight.arrival.delay || 0;
  const hasDelay = departureDelay > 0 || arrivalDelay > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: `${flight.departure.iata} - ${flight.arrival.iata}`,
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity style={styles.shareButton} onPress={shareFlightDetails}>
              <Ionicons name="share-outline" size={22} color={colors.tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with airline info */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.airlineInfo}>
            <Image 
              source={{ uri: `https://pics.avs.io/200/80/${flight.airline.iata}.png` }} 
              style={styles.airlineLogo} 
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.airlineName, { color: colors.text }]}>{flight.airline.name}</Text>
              <Text style={[styles.flightNumber, { color: colors.tabIconDefault }]}>
                Chuyến bay: {flight.flight.iata}
              </Text>
              {flight.flight.codeshared && (
                <Text style={[styles.codeshareText, { color: colors.tabIconDefault }]}>
                  Codeshare: {flight.flight.codeshared.airline_name} {flight.flight.codeshared.flight_iata}
                </Text>
              )}
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor }]}>
            <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
            {hasDelay && (
              <Text style={[styles.delayText, { color: textColor }]}>
                Trễ {Math.max(departureDelay, arrivalDelay)} phút
              </Text>
            )}
          </View>
        </View>

        {/* Flight Route Information */}
        <View style={[styles.routeCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.routeHeader}>
            <Text style={[styles.routeTitle, { color: colors.text }]}>Thông tin chuyến bay</Text>
            <Text style={[styles.flightDate, { color: colors.tabIconDefault }]}>
              {formatDate(flight.flight_date)}
            </Text>
          </View>
          
          <View style={styles.routeContent}>
            <View style={styles.locationContainer}>
              <Text style={[styles.time, { color: colors.text }]}>
                {formatDateTime(flight.departure.scheduled)}
              </Text>
              <Text style={[styles.iataCode, { color: colors.tint }]}>{flight.departure.iata}</Text>
              <Text style={[styles.city, { color: colors.text }]} numberOfLines={2}>
                {flight.departure.airport}
              </Text>
              {flight.departure.terminal && (
                <View style={styles.terminalContainer}>
                  <Text style={[styles.terminalLabel, { color: colors.tabIconDefault }]}>
                    Terminal: <Text style={{ fontWeight: 'bold' }}>{flight.departure.terminal}</Text>
                  </Text>
                </View>
              )}
              {flight.departure.gate && (
                <View style={styles.gateContainer}>
                  <Text style={[styles.gateLabel, { color: colors.tabIconDefault }]}>
                    Gate: <Text style={{ fontWeight: 'bold' }}>{flight.departure.gate}</Text>
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.durationContainer}>
              <Text style={[styles.duration, { color: colors.tabIconDefault }]}>
                {flightDuration}
              </Text>
              <View style={styles.flightPathContainer}>
                <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                <View style={[styles.line, { backgroundColor: colors.tabIconDefault }]} />
                <View style={[styles.dot, { backgroundColor: colors.tint }]} />
              </View>
              <View style={[styles.airplaneContainer, { transform: [{ rotate: '90deg' }] }]}>
                <Ionicons name="airplane" size={16} color={colors.tint} />
              </View>
            </View>

            <View style={styles.locationContainer}>
              <Text style={[styles.time, { color: colors.text }]}>
                {formatDateTime(flight.arrival.scheduled)}
              </Text>
              <Text style={[styles.iataCode, { color: colors.tint }]}>{flight.arrival.iata}</Text>
              <Text style={[styles.city, { color: colors.text }]} numberOfLines={2}>
                {flight.arrival.airport}
              </Text>
              {flight.arrival.terminal && (
                <View style={styles.terminalContainer}>
                  <Text style={[styles.terminalLabel, { color: colors.tabIconDefault }]}>
                    Terminal: <Text style={{ fontWeight: 'bold' }}>{flight.arrival.terminal}</Text>
                  </Text>
                </View>
              )}
              {flight.arrival.gate && (
                <View style={styles.gateContainer}>
                  <Text style={[styles.gateLabel, { color: colors.tabIconDefault }]}>
                    Gate: <Text style={{ fontWeight: 'bold' }}>{flight.arrival.gate}</Text>
                  </Text>
                </View>
              )}
              {flight.arrival.baggage && (
                <View style={styles.baggageContainer}>
                  <Text style={[styles.baggageLabel, { color: colors.tabIconDefault }]}>
                    Baggage: <Text style={{ fontWeight: 'bold' }}>{flight.arrival.baggage}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Flight Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>Chi tiết chuyến bay</Text>
          
          <View style={styles.detailsGrid}>
            {flight.aircraft && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Máy bay</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {flight.aircraft.iata || 'Không có thông tin'}
                </Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Số hiệu</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {flight.flight.number}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>IATA</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {flight.flight.iata}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>ICAO</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {flight.flight.icao}
              </Text>
            </View>
            
            {flight.live && (
              <>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Tốc độ</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {flight.live.speed_horizontal} km/h
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Độ cao</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {flight.live.altitude} m
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Flight Features nếu có thông tin */}
        {flight.features && (
          <View style={[styles.featureCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Tiện ích trên chuyến bay</Text>
            
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <IconSymbol 
                  name="wifi" 
                  size={24} 
                  color={flight.features.wifi ? colors.tint : colors.tabIconDefault + '50'} 
                />
                <Text style={{ 
                  color: flight.features.wifi ? colors.text : colors.tabIconDefault + '50',
                  marginTop: 4 
                }}>
                  WiFi
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <IconSymbol 
                  name="fork.knife" 
                  size={24} 
                  color={flight.features.meals ? colors.tint : colors.tabIconDefault + '50'} 
                />
                <Text style={{ 
                  color: flight.features.meals ? colors.text : colors.tabIconDefault + '50',
                  marginTop: 4 
                }}>
                  Bữa ăn
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <IconSymbol 
                  name="tv" 
                  size={24} 
                  color={flight.features.entertainment ? colors.tint : colors.tabIconDefault + '50'} 
                />
                <Text style={{ 
                  color: flight.features.entertainment ? colors.text : colors.tabIconDefault + '50',
                  marginTop: 4 
                }}>
                  Giải trí
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <IconSymbol 
                  name="powerplug" 
                  size={24} 
                  color={flight.features.powerOutlets ? colors.tint : colors.tabIconDefault + '50'} 
                />
                <Text style={{ 
                  color: flight.features.powerOutlets ? colors.text : colors.tabIconDefault + '50',
                  marginTop: 4
                }}>
                  Ổ điện
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <IconSymbol 
                  name="usb.port.c" 
                  size={24} 
                  color={flight.features.usb ? colors.tint : colors.tabIconDefault + '50'} 
                />
                <Text style={{ 
                  color: flight.features.usb ? colors.text : colors.tabIconDefault + '50',
                  marginTop: 4
                }}>
                  Cổng USB
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Seat Class Selection nếu có thông tin */}
        {flight.seatsAvailable && flight.price && (
          <View style={[styles.seatCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.seatTitle, { color: colors.text }]}>Hạng ghế</Text>
            
            <View style={styles.seatOptions}>
              {flight.seatsAvailable.economy > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.seatOption, 
                    selectedClass === 'economy' && [styles.selectedSeat, { borderColor: colors.tint }]
                  ]}
                  onPress={() => setSelectedClass('economy')}
                >
                  <Text style={[
                    styles.seatClass, 
                    { color: selectedClass === 'economy' ? colors.tint : colors.text }
                  ]}>
                    Phổ thông
                  </Text>
                  <Text style={[
                    styles.seatPrice, 
                    { color: selectedClass === 'economy' ? colors.tint : colors.text }
                  ]}>
                    {flight.price.economy.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={[styles.seatsLeft, { color: colors.tabIconDefault }]}>
                    Còn {flight.seatsAvailable.economy} chỗ
                  </Text>
                </TouchableOpacity>
              )}
              
              {flight.seatsAvailable.business > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.seatOption, 
                    selectedClass === 'business' && [styles.selectedSeat, { borderColor: colors.tint }]
                  ]}
                  onPress={() => setSelectedClass('business')}
                >
                  <Text style={[
                    styles.seatClass, 
                    { color: selectedClass === 'business' ? colors.tint : colors.text }
                  ]}>
                    Thương gia
                  </Text>
                  <Text style={[
                    styles.seatPrice, 
                    { color: selectedClass === 'business' ? colors.tint : colors.text }
                  ]}>
                    {flight.price.business.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={[styles.seatsLeft, { color: colors.tabIconDefault }]}>
                    Còn {flight.seatsAvailable.business} chỗ
                  </Text>
                </TouchableOpacity>
              )}
              
              {flight.seatsAvailable.firstClass > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.seatOption, 
                    selectedClass === 'firstClass' && [styles.selectedSeat, { borderColor: colors.tint }]
                  ]}
                  onPress={() => setSelectedClass('firstClass')}
                >
                  <Text style={[
                    styles.seatClass, 
                    { color: selectedClass === 'firstClass' ? colors.tint : colors.text }
                  ]}>
                    Hạng nhất
                  </Text>
                  <Text style={[
                    styles.seatPrice, 
                    { color: selectedClass === 'firstClass' ? colors.tint : colors.text }
                  ]}>
                    {flight.price.firstClass.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={[styles.seatsLeft, { color: colors.tabIconDefault }]}>
                    Còn {flight.seatsAvailable.firstClass} chỗ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar with Price and Book Button - hiển thị nếu có giá và ghế trống */}
      {flight.price && flight.seatsAvailable && (
        <View style={[styles.bottomBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Tổng giá</Text>
            <Text style={[styles.price, { color: colors.tint }]}>
              {flight.price[selectedClass].toLocaleString('vi-VN')}đ
            </Text>
            <Text style={[styles.personText, { color: colors.tabIconDefault }]}>/ người</Text>
          </View>
          
          <Button
            title="Đặt vé"
            onPress={navigateToBooking}
            size="medium"
            style={styles.bookButton}
            disabled={flight.flight_status === 'cancelled' || flight.flight_status === 'landed'}
          />
        </View>
      )}
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
  shareButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  airlineLogo: {
    width: 60,
    height: 24,
    marginRight: 12,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flightNumber: {
    fontSize: 14,
  },
  codeshareText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  delayText: {
    fontSize: 10,
    marginTop: 4,
  },
  routeCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  routeHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  flightDate: {
    fontSize: 14,
    marginTop: 4,
  },
  routeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  locationContainer: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  iataCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  terminalContainer: {
    marginTop: 2,
  },
  terminalLabel: {
    fontSize: 12,
  },
  gateContainer: {
    marginTop: 2,
  },
  gateLabel: {
    fontSize: 12,
  },
  baggageContainer: {
    marginTop: 2,
  },
  baggageLabel: {
    fontSize: 12,
  },
  durationContainer: {
    alignItems: 'center',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    marginBottom: 8,
  },
  flightPathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  airplaneContainer: {
    marginBottom: 4,
  },
  detailsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  featureCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  seatCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  seatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  seatOptions: {
    flexDirection: 'column',
  },
  seatOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedSeat: {
    borderWidth: 2,
  },
  seatClass: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seatPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seatsLeft: {
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  personText: {
    fontSize: 12,
  },
  bookButton: {
    width: 120,
  },
  bookingButtonContainer: {
    padding: 16,
    marginBottom: 16,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 