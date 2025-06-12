import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { flightsApi } from '@/lib/api';

// Cập nhật định nghĩa Flight để phù hợp với API mới
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
    icao24?: string; // Thêm trường icao24 là tùy chọn
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
    premium?: number;  // Thêm các loại giá vé khác là tùy chọn
    business?: number;
    first?: number;
  };
  seatsAvailable?: number; // Thêm trường số ghế còn trống
}

// Thêm interface cho mô hình Flight từ server
interface Flight {
  _id: string;
  flightNumber: string;
  airline: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  departureCountry: string;
  arrivalCountry: string;
  duration: number;
  status: string;
  isDomestic: boolean;
  image: string;
  price: {
    economy: number;
    business: number;
    firstClass: number;
  };
  seatsAvailable: {
    economy: number;
    business: number;
    firstClass: number;
  };
  features: {
    wifi: boolean;
    meals: boolean;
    entertainment: boolean;
    powerOutlets: boolean;
    usb: boolean;
  };
}

// Tạo dữ liệu mẫu cho chuyến bay
const sampleFlights: FlightResponse[] = [
  {
    flight_date: new Date().toISOString().split('T')[0],
    flight_status: 'scheduled',
    departure: {
      airport: 'Hanoi Airport',
      timezone: 'Asia/Ho_Chi_Minh',
      iata: 'HAN',
      icao: 'VVNB',
      terminal: 'T1',
      gate: 'G1',
      delay: null,
      scheduled: new Date().toISOString(),
      estimated: new Date().toISOString(),
      actual: null
    },
    arrival: {
      airport: 'Ho Chi Minh Airport',
      timezone: 'Asia/Ho_Chi_Minh',
      iata: 'SGN',
      icao: 'VVTS',
      terminal: 'T1',
      gate: 'G1',
      baggage: 'B1',
      delay: null,
      scheduled: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
      estimated: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
      actual: null
    },
    airline: {
      name: 'Vietnam Airlines',
      iata: 'VN',
      icao: 'HVN'
    },
    flight: {
      number: '123',
      iata: 'VN123',
      icao: 'HVN123',
      codeshared: null
    },
    aircraft: {
      registration: 'VN-ABC',
      iata: '320',
      icao: 'A320',
      icao24: 'ABC123'
    },
    live: null,
    price: {
      economy: 1000000,
      premium: 1500000,
      business: 2500000,
      first: 3500000
    },
    seatsAvailable: 10
  }
];

export default function FlightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const windowWidth = Dimensions.get('window').width;

  const [flights, setFlights] = useState<FlightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [flightType, setFlightType] = useState<'all' | 'international'>('all');

  // Lọc theo thành phố đi/đến
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [flightStatus, setFlightStatus] = useState('');
  
  // Lọc theo ngày
  const [flightDate, setFlightDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);

  // Animation cho bộ lọc
  const filterHeight = new Animated.Value(0);

  useEffect(() => {
    // Debounce API call để tránh gọi quá nhiều
    const timeoutId = setTimeout(() => {
      fetchFlights();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [flightType]); // Chỉ gọi lại khi flightType thay đổi

  const toggleFilterView = () => {
    setFilterVisible(!filterVisible);
    Animated.timing(filterHeight, {
      toValue: filterVisible ? 0 : 250,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const fetchFlights = async (reset = true) => {
    // Tránh gọi API khi đang loading
    if (loading || isLoadingMore) {
      console.log('Đang loading, bỏ qua request');
      return;
    }

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: any = {
        page: reset ? 1 : page + 1,
        limit: 10,
      };
      
      let response;
      
      // Gọi API dựa trên loại chuyến bay được chọn
      if (flightType === 'international') {
        response = await flightsApi.getInternationalFlights(params);
      } else {
        response = await flightsApi.getAll(params);
      }
      
      console.log('API response đầy đủ:', JSON.stringify(response).substring(0, 200) + '...');
      
      if (response.success) {
        // Xác định dữ liệu chuyến bay từ response
        let flightData = [];
        let paginationData = null;
        
        // Trường hợp 1: Dữ liệu nằm trong response.data.data (định dạng chuẩn)
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          flightData = response.data.data;
          paginationData = response.data.pagination;
          console.log('Tìm thấy dữ liệu ở response.data.data:', flightData.length, 'chuyến bay');
        } 
        // Trường hợp 2: Dữ liệu nằm trực tiếp trong response.data là một mảng
        else if (response.data && Array.isArray(response.data)) {
          flightData = response.data;
          console.log('Tìm thấy dữ liệu ở response.data (mảng):', flightData.length, 'chuyến bay');
        }
        // Trường hợp 3: response là một mảng dữ liệu trực tiếp
        else if (Array.isArray(response)) {
          flightData = response;
          console.log('Tìm thấy dữ liệu trực tiếp trong response (mảng):', flightData.length, 'chuyến bay');
        }
        
        // Kiểm tra nếu có dữ liệu
        if (flightData.length > 0) {
          // Chuẩn hóa từng chuyến bay và tạo mảng flights
          const normalizedFlights: FlightResponse[] = [];
          
          for (const item of flightData) {
            const normalizedFlight = normalizeFlightData(item);
            normalizedFlights.push(normalizedFlight);
          }
          
          if (reset) {
            setFlights(normalizedFlights);
          } else {
            setFlights(prev => [...prev, ...normalizedFlights]);
          }
          
          // Cập nhật thông tin phân trang
          if (paginationData) {
            setTotalPages(Math.ceil(paginationData.total / paginationData.limit));
            if (!reset) {
              setPage(prev => prev + 1);
            }
          } else {
            // Nếu không có thông tin phân trang, giả định còn trang tiếp theo nếu có dữ liệu
            if (flightData.length >= 10) {
              setTotalPages(prev => Math.max(prev, (reset ? 1 : page) + 1));
            }
            if (!reset) {
              setPage(prev => prev + 1);
            }
          }
          
          console.log('Đã tải được', flightData.length, 'chuyến bay');
        } else {
          console.log('Không có dữ liệu chuyến bay từ API');
          if (reset) {
            setFlights([]);
          }
        }
      } else {
        console.error('Lỗi khi tải danh sách chuyến bay:', response.message);
        if (reset) {
          setFlights([]);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách chuyến bay:', error);
      if (reset) {
        setFlights([]);
      }
    } finally {
      setLoading(false); // Luôn đặt loading là false khi kết thúc
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const normalizeFlightData = (data: any): FlightResponse => {
    try {
      console.log('Xử lý dữ liệu chuyến bay:', JSON.stringify(data).substring(0, 100) + '...');
      
      // Đã là FlightResponse, trả về luôn
      if (data.departure && data.arrival && data.airline && data.flight && data.flight_date) {
        console.log('Dữ liệu đã là FlightResponse, trả về nguyên bản');
        return data as FlightResponse;
      }
      
      // Kiểm tra xem có phải dữ liệu từ backend API không
      const now = new Date();
      const departureTime = data.departureTime ? new Date(data.departureTime) : new Date(now.getTime() + 3600000);
      const arrivalTime = data.arrivalTime ? new Date(data.arrivalTime) : new Date(now.getTime() + 7200000);
      
      // Kiểm tra xem có phải dữ liệu từ model Flight
      if (data.flightNumber || data.airline || data.price) {
        console.log('Xử lý dữ liệu từ backend API');
        
        // Xử lý thông tin hãng bay
        const airlineName = data.airline || 'Vietnam Airlines';
        const airlineCode = data.flightNumber?.substring(0, 2) || 'VN';
        const airlineIcao = 
          airlineCode === 'VN' ? 'HVN' : 
          airlineCode === 'VJ' ? 'VJC' : 
          airlineCode === 'QH' ? 'BAV' : 'HVN';
        
        // Tạo mã IATA cho sân bay dựa trên tên thành phố
        const departureIata = data.departureCity?.substring(0, 3).toUpperCase() || 'HAN';
        const arrivalIata = data.arrivalCity?.substring(0, 3).toUpperCase() || 'SGN';
        
        // Xử lý giá vé
        let flightPrice = {
          economy: 1000000
        };
        
        if (data.price) {
          if (typeof data.price === 'number') {
            flightPrice.economy = data.price;
          } else if (typeof data.price === 'object') {
            flightPrice.economy = data.price.economy || 1000000;
          }
        }
        
        return {
          flight_date: departureTime.toISOString().split('T')[0],
          flight_status: data.status?.toLowerCase() || 'scheduled',
          departure: {
            airport: data.departureCity ? `${data.departureCity} Airport` : 'Hanoi Airport',
            timezone: 'Asia/Ho_Chi_Minh',
            iata: departureIata,
            icao: `VV${departureIata.substring(0, 2)}`,
            terminal: 'T1',
            gate: `G${Math.floor(Math.random() * 20) + 1}`,
            delay: null,
            scheduled: data.departureTime || departureTime.toISOString(),
            estimated: data.departureTime || departureTime.toISOString(),
            actual: null
          },
          arrival: {
            airport: data.arrivalCity ? `${data.arrivalCity} Airport` : 'Ho Chi Minh Airport',
            timezone: 'Asia/Ho_Chi_Minh',
            iata: arrivalIata,
            icao: `VV${arrivalIata.substring(0, 2)}`,
            terminal: 'T1',
            gate: `G${Math.floor(Math.random() * 20) + 1}`,
            baggage: `B${Math.floor(Math.random() * 10) + 1}`,
            delay: null,
            scheduled: data.arrivalTime || arrivalTime.toISOString(),
            estimated: data.arrivalTime || arrivalTime.toISOString(),
            actual: null
          },
          airline: {
            name: airlineName,
            iata: airlineCode,
            icao: airlineIcao
          },
          flight: {
            number: data.flightNumber?.substring(2) || '123',
            iata: data.flightNumber || `${airlineCode}123`,
            icao: `${airlineIcao}${data.flightNumber?.substring(2) || '123'}`,
            codeshared: null
          },
          aircraft: {
            registration: `VN-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            iata: '320',
            icao: 'A320'
          },
          live: null,
          price: flightPrice,
          seatsAvailable: data.seatsAvailable?.economy || 100
        };
      }
      
      // Nếu không nhận dạng được, thử tạo dữ liệu từ các trường có sẵn
      console.log('Tạo dữ liệu từ thông tin có sẵn');
      
      // Tạo thông tin ngẫu nhiên
      const cities = ['Ha Noi', 'Ho Chi Minh', 'Da Nang', 'Nha Trang', 'Phu Quoc', 'Can Tho', 'Hai Phong'];
      const departureCity = cities[Math.floor(Math.random() * cities.length)];
      let arrivalCity;
      do {
        arrivalCity = cities[Math.floor(Math.random() * cities.length)];
      } while (arrivalCity === departureCity);
      
      // Xử lý giá vé
      let flightPrice = {
        economy: 1000000
      };
      
      if (data.price) {
        if (typeof data.price === 'number') {
          flightPrice.economy = data.price;
        } else if (typeof data.price === 'object') {
          flightPrice.economy = data.price.economy || 1000000;
        }
      }
      
      const randomFlightNumber = `VN${100 + Math.floor(Math.random() * 900)}`;
      
      return {
        flight_date: now.toISOString().split('T')[0],
        flight_status: 'scheduled',
        departure: {
          airport: `${departureCity} Airport`,
          timezone: 'Asia/Ho_Chi_Minh',
          iata: departureCity.substring(0, 3).toUpperCase(),
          icao: `VV${departureCity.substring(0, 2).toUpperCase()}`,
          terminal: 'T1',
          gate: `G${Math.floor(Math.random() * 20) + 1}`,
          delay: null,
          scheduled: departureTime.toISOString(),
          estimated: departureTime.toISOString(),
          actual: null
        },
        arrival: {
          airport: `${arrivalCity} Airport`,
          timezone: 'Asia/Ho_Chi_Minh',
          iata: arrivalCity.substring(0, 3).toUpperCase(),
          icao: `VV${arrivalCity.substring(0, 2).toUpperCase()}`,
          terminal: 'T1',
          gate: `G${Math.floor(Math.random() * 20) + 1}`,
          baggage: `B${Math.floor(Math.random() * 10) + 1}`,
          delay: null,
          scheduled: arrivalTime.toISOString(),
          estimated: arrivalTime.toISOString(),
          actual: null
        },
        airline: {
          name: 'Vietnam Airlines',
          iata: 'VN',
          icao: 'HVN'
        },
        flight: {
          number: randomFlightNumber.substring(2),
          iata: randomFlightNumber,
          icao: `HVN${randomFlightNumber.substring(2)}`,
          codeshared: null
        },
        aircraft: {
          registration: `VN-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
          iata: '320',
          icao: 'A320'
        },
        live: null,
        price: flightPrice,
        seatsAvailable: data.seatsAvailable?.economy || 100
      };
    } catch (error) {
      console.error('Lỗi trong normalizeFlightData:', error);
      
      // Tạo dữ liệu mẫu trong trường hợp lỗi
      return sampleFlights[0];
    }
  };

  const searchFlights = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 10,
      };
      
      if (departureCity) params.departureCity = departureCity;
      if (arrivalCity) params.arrivalCity = arrivalCity;
      if (flightStatus) params.flight_status = flightStatus;
      
      // Thêm tham số ngày nếu người dùng chọn
      if (useCustomDate) {
        params.flight_date = format(flightDate, 'yyyy-MM-dd');
      }
      
      const response = await flightsApi.searchFlights(params);
      
      console.log('Kết quả tìm kiếm:', JSON.stringify(response).substring(0, 200) + '...');
      
      if (response.success) {
        // Xác định dữ liệu chuyến bay từ response
        let flightData = [];
        let paginationData = null;
        
        // Trường hợp 1: Dữ liệu nằm trong response.data.data (định dạng chuẩn)
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          flightData = response.data.data;
          paginationData = response.data.pagination;
          console.log('Tìm thấy dữ liệu ở response.data.data:', flightData.length, 'chuyến bay');
        } 
        // Trường hợp 2: Dữ liệu nằm trực tiếp trong response.data là một mảng
        else if (response.data && Array.isArray(response.data)) {
          flightData = response.data;
          console.log('Tìm thấy dữ liệu ở response.data (mảng):', flightData.length, 'chuyến bay');
        }
        // Trường hợp 3: response là một mảng dữ liệu trực tiếp
        else if (Array.isArray(response)) {
          flightData = response;
          console.log('Tìm thấy dữ liệu trực tiếp trong response (mảng):', flightData.length, 'chuyến bay');
        }
        
        // Chuẩn hóa dữ liệu
        const normalizedFlights = flightData.map((item: any) => normalizeFlightData(item));
        setFlights(normalizedFlights);
        
        // Cập nhật thông tin phân trang
        if (paginationData) {
          setTotalPages(Math.ceil(paginationData.total / paginationData.limit));
          setPage(1);
        } else {
          // Nếu không có thông tin phân trang, giả định chỉ có 1 trang
          setTotalPages(1);
        }
      } else {
        console.error('Lỗi khi tìm kiếm chuyến bay:', response.message);
        setFlights([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm chuyến bay:', error);
      setFlights([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setFilterVisible(false);
      Animated.timing(filterHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const resetFilters = () => {
    setDepartureCity('');
    setArrivalCity('');
    setFlightStatus('');
    setUseCustomDate(false);
    setFlightDate(new Date());
    fetchFlights();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFlightDate(selectedDate);
      setUseCustomDate(true);
    }
  };

  const filteredFlights = searchQuery.length > 0
    ? flights.filter(flight => {
        const query = searchQuery.toLowerCase();
        return (
          flight.departure.airport.toLowerCase().includes(query) ||
          flight.arrival.airport.toLowerCase().includes(query) ||
          flight.airline.name.toLowerCase().includes(query) ||
          flight.flight.number.toLowerCase().includes(query) ||
          flight.flight.iata.toLowerCase().includes(query)
        );
      })
    : flights;

  const handleLoadMore = () => {
    if (!isLoadingMore && !loading && page < totalPages) {
      console.log(`Loading more - Page ${page + 1}/${totalPages}`);
      fetchFlights(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFlights();
  };

  // Function to navigate to the flight detail page
  const navigateToFlightDetail = (flight: FlightResponse) => {
    console.log('Chọn chuyến bay:', flight.flight.iata, flight.flight_date);
    
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

  // Xử lý khi nhấn vào một chuyến bay
  const handleFlightPress = (flight: FlightResponse) => {
    navigateToFlightDetail(flight);
  };

  const getStatusBadge = (status: string) => {
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

  const renderFlightItem = ({ item }: { item: FlightResponse }) => {
    try {
      console.log('Rendering flight item:', JSON.stringify(item).substring(0, 100) + '...');
      
      // Kiểm tra dữ liệu có đủ các trường cần thiết không
      if (!item.departure || !item.arrival || !item.airline || !item.flight) {
        console.error('Thiếu trường dữ liệu trong flight item:', JSON.stringify(item).substring(0, 200));
        return (
          <View style={[styles.flightCard, { backgroundColor: colors.cardBackground, padding: 16 }]}>
            <Text style={{ color: colors.text }}>Dữ liệu chuyến bay không hợp lệ</Text>
          </View>
        );
      }
      
      // Format departure time
      const departureTime = new Date(item.departure.scheduled);
      const formattedDepartureTime = format(departureTime, 'HH:mm');
      
      // Format arrival time
      const arrivalTime = new Date(item.arrival.scheduled);
      const formattedArrivalTime = format(arrivalTime, 'HH:mm');
      
      // Calculate flight duration
      const durationInMs = arrivalTime.getTime() - departureTime.getTime();
      const durationInMinutes = Math.floor(durationInMs / (1000 * 60));
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      const formattedDuration = `${hours}h ${minutes}m`;
      
      // Format date
      const formattedDate = format(departureTime, 'EEEE, dd/MM/yyyy', { locale: vi });
      
      // Lấy thông tin trạng thái
      const {
        backgroundColor,
        textColor,
        statusText
      } = getStatusBadge(item.flight_status);
      
      // Check for delay
      const hasDelay = item.departure.delay || item.arrival.delay;
      
      return (
        <TouchableOpacity 
          style={[styles.flightCard, { backgroundColor: colors.cardBackground }]}
          onPress={() => handleFlightPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.airlineContainer}>
              <Image 
                source={{ uri: `https://pics.avs.io/200/80/${item.airline.iata}.png` }} 
                style={styles.airlineLogo} 
                resizeMode="contain"
              />
              <Text style={[styles.airlineName, { color: colors.text }]}>
                {item.airline.name}
              </Text>
            </View>
            <View>
              <View style={[styles.statusBadge, { backgroundColor }]}>
                <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
                {hasDelay && (
                  <View style={styles.delayBadge}>
                    <Text style={styles.delayText}>
                      Trễ {Math.max(item.departure.delay || 0, item.arrival.delay || 0)} phút
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.flightInfo}>
            <View style={styles.flightRoute}>
              <View style={styles.routePoint}>
                <Text style={[styles.timeText, { color: colors.text }]}>{formattedDepartureTime}</Text>
                <Text style={[styles.cityCode, { color: colors.text }]}>{item.departure.iata}</Text>
                <Text style={[styles.cityName, { color: colors.tabIconDefault }]} numberOfLines={1}>
                  {item.departure.airport}
                </Text>
              </View>
              
              <View style={styles.routeMiddle}>
                <Text style={[styles.durationText, { color: colors.tabIconDefault }]}>{formattedDuration}</Text>
                <View style={styles.routeLine}>
                  <View style={[styles.routeDot, { backgroundColor: colors.tint }]} />
                  <View style={[styles.routePath, { backgroundColor: colors.border }]} />
                  <View style={[styles.routeDot, { backgroundColor: colors.tint }]} />
                </View>
                <Text style={[styles.flightNumber, { color: colors.tint }]}>
                  {item.flight.iata}
                </Text>
              </View>
              
              <View style={styles.routePoint}>
                <Text style={[styles.timeText, { color: colors.text }]}>{formattedArrivalTime}</Text>
                <Text style={[styles.cityCode, { color: colors.text }]}>{item.arrival.iata}</Text>
                <Text style={[styles.cityName, { color: colors.tabIconDefault }]} numberOfLines={1}>
                  {item.arrival.airport}
                </Text>
              </View>
            </View>
            
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <View style={styles.footerLeft}>
                <Text style={[styles.dateText, { color: colors.tabIconDefault }]}>
                  {formattedDate}
                </Text>
                
                {item.price && (
                  <Text style={[styles.priceText, { color: colors.tint }]}>
                    {(() => {
                      let price = 1000000; // giá mặc định
                      if (typeof item.price === 'object' && item.price.economy !== undefined) {
                        price = Number(item.price.economy);
                      } else if (typeof item.price === 'number') {
                        price = item.price;
                      }
                      return price.toLocaleString('vi-VN');
                    })()} ₫
                  </Text>
                )}
                
                {item.flight.codeshared && (
                  <Text style={[styles.codeshareText, { color: colors.tabIconDefault }]}>
                    Codeshare: {typeof item.flight.codeshared === 'object' ? 
                      (item.flight.codeshared.airline_name || '') + ' ' + (item.flight.codeshared.flight_iata || '') 
                      : ''}
                  </Text>
                )}
              </View>
              
              <View style={styles.footerRight}>
                <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Lỗi khi render flight item:', error);
      // Trả về component dự phòng trong trường hợp lỗi
      return (
        <View style={[styles.flightCard, { backgroundColor: colors.cardBackground, padding: 16 }]}>
          <Text style={{ color: colors.text }}>Không thể hiển thị thông tin chuyến bay</Text>
        </View>
      );
    }
  };

  // Thêm hàm handleSearch
  const handleSearch = () => {
    searchFlights();
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="search" size={20} color={colors.tabIconDefault} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm chuyến bay (VN123, Hà Nội, Đà Nẵng...)"
            placeholderTextColor={colors.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterVisible && { borderColor: colors.tint, borderWidth: 1 }
            ]}
            onPress={toggleFilterView}
          >
            <Ionicons
              name="options"
              size={20}
              color={filterVisible ? colors.tint : colors.tabIconDefault}
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: filterVisible ? colors.tint : colors.tabIconDefault }
              ]}
            >
              Bộ lọc
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton,
              flightType === 'all' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
            ]}
            onPress={() => setFlightType('all')}
          >
            <Text style={
              [styles.tabButtonText, 
                { color: flightType === 'all' ? colors.tint : colors.tabIconDefault }
              ]
            }>
              Tất cả
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton,
              flightType === 'international' && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
            ]}
            onPress={() => setFlightType('international')}
          >
            <Text style={
              [styles.tabButtonText, 
                { color: flightType === 'international' ? colors.tint : colors.tabIconDefault }
              ]
            }>
              Quốc tế
            </Text>
          </TouchableOpacity>
        </View>
        
        {renderFilterOptions()}
      </View>
    );
  };

  const renderFilterOptions = () => {
    return (
      <Animated.View
        style={[
          styles.filterOptions,
          {
            height: filterHeight,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.filterInputRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Điểm đi:</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Thành phố đi (Hà Nội, TP HCM...)"
            placeholderTextColor={colors.tabIconDefault}
            value={departureCity}
            onChangeText={setDepartureCity}
          />
        </View>

        <View style={styles.filterInputRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Điểm đến:</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Thành phố đến (Đà Nẵng, Nha Trang...)"
            placeholderTextColor={colors.tabIconDefault}
            value={arrivalCity}
            onChangeText={setArrivalCity}
          />
        </View>

        <View style={styles.filterInputRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Trạng thái:</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Trạng thái (đúng giờ, delay...)"
            placeholderTextColor={colors.tabIconDefault}
            value={flightStatus}
            onChangeText={setFlightStatus}
          />
        </View>

        <View style={styles.filterInputRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Ngày bay:</Text>
          <TouchableOpacity
            style={[
              styles.datePicker,
              {
                backgroundColor: colors.inputBackground,
                borderColor: useCustomDate ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.dateText,
                {
                  color: useCustomDate ? colors.text : colors.tabIconDefault,
                },
              ]}
            >
              {format(flightDate, 'dd/MM/yyyy')}
            </Text>
            <MaterialIcons name="date-range" size={20} color={useCustomDate ? colors.tint : colors.tabIconDefault} />
            
            {useCustomDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setUseCustomDate(false);
                  setFlightDate(new Date());
                }}
              >
                <Ionicons name="close-circle" size={16} color={colors.tabIconDefault} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={flightDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterActionButton, styles.resetButton, { borderColor: colors.border }]}
            onPress={resetFilters}
          >
            <Text style={[styles.filterButtonText, { color: colors.tabIconDefault }]}>Đặt lại</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterActionButton, styles.applyButton, { backgroundColor: colors.tint }]}
            onPress={searchFlights}
          >
            <Text style={[styles.filterButtonText, { color: '#fff' }]}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Chuyến bay',
          headerShown: true,
        }}
      />

      <View style={styles.searchContainer}>
        <View>
          {renderHeader()}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : filteredFlights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane-outline" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Không tìm thấy chuyến bay nào phù hợp
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFlights}
          renderItem={renderFlightItem}
          keyExtractor={(item, index) => `${item.flight.iata}-${item.flight_date}-${index}`}
          contentContainerStyle={styles.flightsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterSection: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  filterOptions: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  filterInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  filterLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  filterInput: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  datePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    justifyContent: 'space-between',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  filterActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  applyButton: {
    marginLeft: 8,
  },
  clearDateButton: {
    padding: 4,
  },
  flightsList: {
    padding: 16,
  },
  flightCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  airlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 60,
    height: 24,
    resizeMode: 'contain',
    marginRight: 8,
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  flightInfo: {
    padding: 16,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: {
    alignItems: 'center',
    width: 80,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cityCode: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  cityName: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  routeMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationText: {
    fontSize: 12,
    marginBottom: 4,
  },
  routeLine: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routePath: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  flightNumber: {
    fontSize: 12,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  codeshareText: {
    fontSize: 10,
    marginTop: 4,
  },
  delayBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  delayText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
}); 