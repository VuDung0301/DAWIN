import { API_BASE_URL, getApiBaseUrl } from '@/constants/ApiConfig';

// Định nghĩa API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_DETAILS: '/auth/updatedetails',
    UPDATE_PASSWORD: '/auth/updatepassword',
    FORGOT_PASSWORD: '/auth/forgotpassword',
    RESET_PASSWORD: '/auth/resetpassword',
  },
  TOURS: {
    BASE: '/tours',
    DETAIL: (id: string) => `/tours/${id}`,
    CATEGORIES: '/tours/categories',
    CATEGORY: (category: string) => `/tours/category/${category}`,
    POPULAR_DESTINATIONS: '/tours/popular-destinations',
    DESTINATION: (destination: string) => `/tours/destination/${destination}`,
    FEATURED: '/tours/featured',
    POPULAR: '/tours/popular',
    NEWEST: '/tours/newest',
    BUDGET: '/tours/budget',
  },
  HOTELS: {
    BASE: '/hotels',
    DETAIL: (id: string) => `/hotels/${id}`,
    ROOMS: (id: string) => `/hotels/${id}/rooms`,
    AVAILABILITY: (id: string) => `/hotels/${id}/availability`,
    CATEGORIES: '/hotels/categories',
    CATEGORY: (category: string) => `/hotels/category/${category}`,
    POPULAR_CITIES: '/hotels/popular-cities',
    CITY: (city: string) => `/hotels/city/${city}`,
    FEATURED: '/hotels/featured',
    SEARCH: '/hotels/search',
  },
  FLIGHTS: {
    BASE: '/flights',
    DETAIL: (flightIata: string, date: string) => `/flights/${flightIata}/${date}`,
    SEARCH: '/flights/search',
    AIRLINES: '/flights/airlines',
    DESTINATIONS: '/flights/destinations',
    UPCOMING: '/flights/upcoming',
    DOMESTIC: '/flights/domestic',
    INTERNATIONAL: '/flights/international',
  },
  BOOKINGS: {
    BASE: '/bookings',
    DETAIL: (id: string) => `/bookings/${id}`,
    GET_MY_BOOKINGS: '/bookings/me',
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    TEST: '/bookings/test',
  },
  TOUR_BOOKINGS: {
    BASE: '/tour-bookings',
    DETAIL: (id: string) => `/tour-bookings/${id}`,
    DETAILS: (id: string) => `/tour-bookings/${id}/details`,
    GET_MY_BOOKINGS: '/tour-bookings/me',
    CANCEL: (id: string) => `/tour-bookings/${id}/cancel`,
    CHECK_AVAILABILITY: '/tour-bookings/check-availability',
    GET_PAYMENT: (id: string) => `/tour-bookings/${id}/payment`,
  },
  HOTEL_BOOKINGS: {
    BASE: '/hotel-bookings', 
    DETAIL: (id: string) => `/hotel-bookings/${id}`,
    DETAILS: (id: string) => `/hotel-bookings/${id}/details`,
    GET_MY_BOOKINGS: '/hotel-bookings/me',
    CANCEL: (id: string) => `/hotel-bookings/${id}/cancel`,
    CHECK_AVAILABILITY: '/hotel-bookings/check-availability',
    GET_PAYMENT: (id: string) => `/hotel-bookings/${id}/payment`,
  },
  REVIEWS: {
    BASE: '/reviews',
    DETAIL: (id: string) => `/reviews/${id}`,
    BY_TOUR: (tourId: string) => `/reviews/tour/${tourId}`,
    BY_HOTEL: (hotelId: string) => `/reviews/hotel/${hotelId}`,
    MY_REVIEWS: '/reviews/my-reviews',
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    UPDATE_PROFILE: '/users/update-profile',
  },
  HEALTH: {
    CHECK: '/test',
  },
  FLIGHT_BOOKINGS: {
    BASE: '/flight-bookings',
    DETAIL: (id: string) => `/flight-bookings/${id}`,
    DETAILS: (id: string) => `/flight-bookings/${id}/details`,
    GET_MY_BOOKINGS: '/flight-bookings/me',
    CANCEL: (id: string) => `/flight-bookings/${id}/cancel`,
    CHECK_AVAILABILITY: '/flight-bookings/check-availability',
    GET_PAYMENT: (id: string) => `/flight-bookings/${id}/payment`,
  },
};

/**
 * Thêm tham số roomType vào interface CheckAvailabilityParams
 */
export interface CheckAvailabilityParams {
  checkIn: string;
  checkOut: string;
  guests: number;
}

/**
 * Interface định nghĩa cấu trúc phản hồi cho bookings
 */
export interface BookingsResponse {
  success: boolean;
  message?: string;
  data: any[] | null;
}

/**
 * Hàm xử lý lỗi từ API
 */
const handleError = (error: any) => {
  console.error('API Error:', JSON.stringify(error));
  if (error.response) {
    // Lỗi từ response của server
    console.log('Lỗi response:', error.response.status, error.response.data?.message);
    return {
      success: false,
      message: error.response.data?.message || 'Đã xảy ra lỗi từ server',
      statusCode: error.response.status,
    };
  } 
  if (error.request) {
    // Không nhận được response
    console.log('Lỗi request:', error.request);
    return {
      success: false,
      message: 'Không thể kết nối đến server',
      statusCode: 0,
    };
  }
  // Lỗi khi setup request
  console.log('Lỗi khác:', error.message);
  return {
    success: false,
    message: error.message || 'Đã xảy ra lỗi',
    statusCode: 0,
  };
};

/**
 * Hàm thực hiện các request API
 */
export const fetchApi = async (
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  token?: string
) => {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`Gọi API: ${method} ${url}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    // Xử lý các trường hợp phản hồi không thành công
    if (!response.ok) {
      // Thử lấy dữ liệu phản hồi nếu có
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { message: `Lỗi HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Xử lý mã lỗi HTTP cụ thể
      switch (response.status) {
        case 404:
          console.error(`Không tìm thấy tài nguyên: ${endpoint}`);
          return {
            success: false,
            statusCode: 404,
            message: responseData.message || 'Không tìm thấy tài nguyên',
            data: []
          };
        case 403:
          console.error(`Không có quyền truy cập: ${endpoint}`);
          return {
            success: false,
            statusCode: 403,
            message: responseData.message || 'Không có quyền truy cập',
            data: []
          };
        case 401:
          console.error(`Yêu cầu xác thực: ${endpoint}`);
          return {
            success: false,
            statusCode: 401,
            message: responseData.message || 'Vui lòng đăng nhập để tiếp tục',
            data: []
          };
        case 500:
          console.error(`Lỗi server: ${endpoint}`);
          return {
            success: false,
            statusCode: 500,
            message: responseData.message || 'Lỗi server, vui lòng thử lại sau',
            data: []
          };
        default:
          console.error(`Lỗi HTTP ${response.status}: ${endpoint}`);
          return {
            success: false,
            statusCode: response.status,
            message: responseData.message || `Lỗi không xác định (${response.status})`,
            data: []
          };
      }
    }
    
    // Xử lý phản hồi thành công
    const responseData = await response.json();
    
    // Đảm bảo dữ liệu phản hồi có đúng format
    if (!responseData.hasOwnProperty('success')) {
      responseData.success = true;
    }
    
    return responseData;
  } catch (error: any) {
    console.error('Lỗi khi gọi API:', error.message);
    
    // Xử lý lỗi mạng hoặc lỗi parsing JSON
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        statusCode: 0,
        data: []
      };
    }
    
    // Các lỗi khác
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi không xác định',
      statusCode: 0,
      data: []
    };
  }
};

/**
 * Kiểm tra kết nối đến server API
 * @returns Promise<boolean> true nếu server hoạt động, false nếu không
 */
export const checkApiServer = async (): Promise<boolean> => {
  try {
    const baseUrl = getApiBaseUrl();
    
    // Sử dụng AbortController để tạo timeout cho fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout
    
    const response = await fetch(`${baseUrl}${API_ENDPOINTS.HEALTH.CHECK}`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Nếu server trả về status 200, có nghĩa là server hoạt động
    return response.ok;
  } catch (error) {
    console.error('Lỗi khi kiểm tra server API:', error);
    return false;
  }
};

/**
 * API Functions cho Tours
 */
export const toursApi = {
  getAll: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.BASE}${queryString}`);
  },
  
  getById: (id: string) => {
    return fetchApi(API_ENDPOINTS.TOURS.DETAIL(id));
  },
  
  searchTours: (searchTerm: string, params?: Record<string, any>) => {
    const queryParams = { 
      keyword: searchTerm,
      ...params
    };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return fetchApi(`${API_ENDPOINTS.TOURS.BASE}${queryString}`);
  },

  getCategories: () => {
    return fetchApi(API_ENDPOINTS.TOURS.CATEGORIES);
  },

  getToursByCategory: (category: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.CATEGORY(category)}${queryString}`);
  },

  getPopularDestinations: () => {
    return fetchApi(API_ENDPOINTS.TOURS.POPULAR_DESTINATIONS);
  },

  getToursByDestination: (destination: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.DESTINATION(destination)}${queryString}`);
  },
  
  // Thêm các hàm mới cho trang khám phá
  getFeaturedTours: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.FEATURED}${queryString}`);
  },
  
  getPopularTours: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.POPULAR}${queryString}`);
  },
  
  getNewestTours: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.NEWEST}${queryString}`);
  },
  
  getBudgetTours: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOURS.BUDGET}${queryString}`);
  }
};

/**
 * API Functions cho Flights
 */
export const flightsApi = {
  getAll: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.FLIGHTS.BASE}${queryString}`);
  },
  
  getDomesticFlights: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.FLIGHTS.DOMESTIC}${queryString}`);
  },
  
  getInternationalFlights: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.FLIGHTS.INTERNATIONAL}${queryString}`);
  },
  
  getFlightDetail: (flightIata: string, date: string) => {
    return fetchApi(API_ENDPOINTS.FLIGHTS.DETAIL(flightIata, date));
  },
  
  // Thêm alias cho getById để tương thích với code cũ
  getById: (flightIata: string, date: string) => {
    return fetchApi(API_ENDPOINTS.FLIGHTS.DETAIL(flightIata, date));
  },
  
  searchFlights: (params: { 
    departureCity?: string; 
    arrivalCity?: string; 
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    flight_status?: string;
    flight_date?: string;
    domestic_only?: boolean;
    airline?: string;
  }) => {
    const queryString = `?${new URLSearchParams(params as any).toString()}`;
    return fetchApi(`${API_ENDPOINTS.FLIGHTS.SEARCH}${queryString}`);
  },

  // Kiểm tra tính khả dụng của chuyến bay trước khi đặt vé
  checkFlightAvailability: async (flightIata: string, flightDate: string, passengers: number, seatClass: string) => {
    console.log(`Kiểm tra khả dụng của chuyến bay ${flightIata} ngày ${flightDate} với ${passengers} hành khách, hạng ${seatClass}`);
    
    try {
      // Đầu tiên lấy thông tin chi tiết của chuyến bay
      const flightResponse = await fetchApi(API_ENDPOINTS.FLIGHTS.DETAIL(flightIata, flightDate), 'GET');
      const flight = flightResponse.data;
      
      // Kiểm tra xem chuyến bay có thông tin về số ghế không
      if (!flight.seatsAvailable) {
        return {
          success: false,
          message: 'Không có thông tin về số ghế trống cho chuyến bay này'
        };
      }
      
      // Kiểm tra số lượng ghế còn trống cho hạng ghế đã chọn
      let availableSeats = 0;
      
      switch(seatClass) {
        case 'economy':
          availableSeats = flight.seatsAvailable.economy;
          break;
        case 'business':
          availableSeats = flight.seatsAvailable.business;
          break;
        case 'firstClass':
          availableSeats = flight.seatsAvailable.firstClass;
          break;
        default:
          throw new Error('Hạng ghế không hợp lệ');
      }
      
      console.log(`Số ghế còn trống cho hạng ${seatClass}: ${availableSeats}`);
      
      // Kiểm tra xem có đủ ghế trống không
      if (availableSeats < passengers) {
        return {
          success: false,
          message: `Không đủ ghế trống. Chỉ còn ${availableSeats} ghế cho hạng ${seatClass}.`
        };
      }
      
      return {
        success: true,
        message: 'Chuyến bay khả dụng',
        flight
      };
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra khả dụng chuyến bay:', error);
      return {
        success: false,
        message: error.message || 'Không thể kiểm tra tính khả dụng của chuyến bay'
      };
    }
  },

  // Đặt vé máy bay
  bookFlight: (bookingData: FlightBookingData, token?: string) => {
    console.log('Booking flight với dữ liệu:', JSON.stringify(bookingData));
    
    // Đảm bảo flightId là chuỗi và được chuẩn hóa
    const flightId = String(bookingData.flightId).trim();
    
    // Tạo mảng hành khách đúng cách với các trường yêu cầu của backend
    let passengersArray = [];
    
    if (Array.isArray(bookingData.passengers)) {
      // Nếu passengers là mảng, sử dụng trực tiếp
      passengersArray = bookingData.passengers;
    } else if (typeof bookingData.passengers === 'number') {
      // Nếu passengers là số, tạo mảng hành khách mặc định
      for (let i = 0; i < bookingData.passengers; i++) {
        passengersArray.push({
          seatClass: bookingData.seatClass,
          name: bookingData.contactName,
          idNumber: '000000000000', // ID mặc định
          gender: 'Nam', // Thêm trường giới tính bắt buộc
          dob: '1990-01-01', // Thêm trường ngày sinh bắt buộc (định dạng YYYY-MM-DD)
        });
      }
    }
    
    // Chuyển đổi dữ liệu từ app sang định dạng backend
    const apiBookingData = {
      flightId,
      passengers: passengersArray,
      contactInfo: {
        fullName: bookingData.contactName,
        email: bookingData.contactEmail,
        phone: bookingData.contactPhone,
      },
      paymentMethod: 'Cash', // Thay 'PayAtOffice' thành 'Cash' để phù hợp với enum trong model
      additionalServices: bookingData.specialRequests ? {
        specialRequests: {
          selected: true,
          details: bookingData.specialRequests,
          price: 0
        }
      } : undefined
    };

    console.log('Gọi API:', `${API_ENDPOINTS.BOOKINGS.BASE}`);
    console.log('Dữ liệu gửi đi:', JSON.stringify(apiBookingData));
    
    return fetchApi(API_ENDPOINTS.BOOKINGS.BASE, 'POST', apiBookingData, token);
  },

  // Hàm kiểm tra khả năng đặt chuyến bay
  testFlightBooking: async (flightId: string) => {
    try {
      console.log('Kiểm tra chuyến bay với ID:', flightId);
      
      if (!flightId) {
        return {
          success: false,
          message: 'Thiếu ID chuyến bay'
        };
      }
      
      // Bước 1: Kiểm tra xem chuyến bay có tồn tại không
      const flightResponse = await fetchApi(API_ENDPOINTS.FLIGHTS.DETAIL(flightId, ''), 'GET');
      
      if (!flightResponse.success) {
        return {
          success: false,
          message: 'Không tìm thấy chuyến bay với ID đã cung cấp'
        };
      }
      
      const flight = flightResponse.data;
      console.log('Tìm thấy chuyến bay:', flight.flightNumber);
      
      // Bước 2: Gửi request thử nghiệm
      const testBookingData = {
        flightId: String(flightId),
        seatClass: 'economy' as 'economy' | 'business' | 'firstClass',
        passengers: [
          {
            seatClass: 'economy',
            name: 'Người dùng test',
            idNumber: '000000000000',
            gender: 'Nam',
            dob: '1990-01-01'
          }
        ],
        contactName: 'Người dùng test',
        contactEmail: 'test@example.com',
        contactPhone: '0987654321',
        isTestBooking: true
      };
      
      console.log('Dữ liệu kiểm tra:', JSON.stringify(testBookingData));
      
      // Gọi API booking với cờ test để kiểm tra mà không tạo booking thật
      const response = await fetchApi(`${API_ENDPOINTS.BOOKINGS.BASE}/test`, 'POST', testBookingData);
      
      if (response.success) {
        return {
          success: true,
          message: 'Chuyến bay khả dụng và có thể đặt vé',
          flightInfo: {
            _id: flight._id,
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            departureCity: flight.departureCity,
            arrivalCity: flight.arrivalCity,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            price: flight.price,
            availableSeats: flight.seatsAvailable
          },
          testData: response.testData
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể đặt vé cho chuyến bay này'
        };
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra booking:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra chuyến bay'
      };
    }
  }
};

/**
 * API Functions cho Auth
 */
export const authApi = {
  login: (email: string, password: string) => {
    return fetchApi(API_ENDPOINTS.AUTH.LOGIN, 'POST', { email, password });
  },
  
  register: (userData: { name: string, email: string, password: string, phone?: string }) => {
    return fetchApi(API_ENDPOINTS.AUTH.REGISTER, 'POST', userData);
  },
  
  logout: (token: string) => {
    return fetchApi(API_ENDPOINTS.AUTH.LOGOUT, 'GET', undefined, token);
  },
  
  getMe: (token: string) => {
    return fetchApi(API_ENDPOINTS.AUTH.ME, 'GET', undefined, token);
  },
  
  updateDetails: (token: string, userData: { name?: string, email?: string, phone?: string }) => {
    return fetchApi(API_ENDPOINTS.AUTH.UPDATE_DETAILS, 'PUT', userData, token);
  },
  
  updatePassword: (token: string, passwordData: { currentPassword: string, newPassword: string }) => {
    return fetchApi(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, 'PUT', passwordData, token);
  },
  
  forgotPassword: (email: string) => {
    return fetchApi(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, 'POST', { email });
  },
  
  resetPassword: (token: string, passwordData: { newPassword: string }) => {
    return fetchApi(API_ENDPOINTS.AUTH.RESET_PASSWORD, 'POST', passwordData, token);
  }
};

/**
 * Định nghĩa kiểu dữ liệu cho đặt tour
 */
export interface TourBookingData {
  tourId: string;
  startDate: string;
  numOfPeople: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'momo' | 'zalopay' | 'vnpay' | 'sepay';
}

// Khai báo kiểu dữ liệu cho đặt khách sạn
export interface HotelBookingData {
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
  paymentStatus?: string;
}

// Khai báo kiểu dữ liệu cho đặt vé máy bay
export interface FlightBookingData {
  flightId: string;
  seatClass: 'economy' | 'business' | 'firstClass';
  passengers: {
    fullName: string;
    identification: string;
    dob: string;
    gender: string;
    type?: 'adult' | 'child' | 'infant';
    seatClass?: 'economy' | 'business' | 'firstClass';
  }[] | number;
  numOfPassengers?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
    identification?: string;
  };
  specialRequests?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
  paymentStatus?: string;
}

/**
 * API Functions cho Reviews
 */
export const reviewsApi = {
  getAll: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.REVIEWS.BASE}${queryString}`);
  },
  
  getById: (id: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.DETAIL(id));
  },
  
  getByTour: (tourId: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BY_TOUR(tourId));
  },
  
  getByHotel: (hotelId: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BY_HOTEL(hotelId));
  },
  
  getMyReviews: (token: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.MY_REVIEWS, 'GET', undefined, token);
  },
  
  create: (reviewData: any, token: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BASE, 'POST', reviewData, token);
  },
  
  createReview: (reviewData: any, token: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BASE, 'POST', reviewData, token);
  },
  
  updateReview: (id: string, reviewData: any, token: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.DETAIL(id), 'PUT', reviewData, token);
  },
  
  deleteReview: (id: string, token: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.DETAIL(id), 'DELETE', undefined, token);
  },
  
  // Kiểm tra xem người dùng đã đánh giá tour chưa
  checkUserReviewForTour: (tourId: string, token: string) => {
    return fetchApi(`${API_ENDPOINTS.REVIEWS.BY_TOUR(tourId)}/check-user`, 'GET', undefined, token);
  },
  
  // Lấy đánh giá của tour
  getTourReviews: (tourId: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BY_TOUR(tourId));
  },
  
  // Kiểm tra xem người dùng đã đánh giá khách sạn chưa
  checkUserReviewForHotel: (hotelId: string, token: string) => {
    return fetchApi(`${API_ENDPOINTS.REVIEWS.BY_HOTEL(hotelId)}/check-user`, 'GET', undefined, token);
  },
  
  // Lấy đánh giá của khách sạn
  getHotelReviews: (hotelId: string) => {
    return fetchApi(API_ENDPOINTS.REVIEWS.BY_HOTEL(hotelId));
  }
};

/**
 * Định nghĩa BookingType để sử dụng chung
 */
export type BookingType = 'tour' | 'hotel' | 'flight';

/**
 * API Functions cho Bookings
 */
export const bookingsApi = {
  getAll: (token: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.BOOKINGS.BASE}${queryString}`, 'GET', undefined, token);
  },
  
  getById: (id: string, token: string) => {
    return fetchApi(API_ENDPOINTS.BOOKINGS.DETAIL(id), 'GET', undefined, token);
  },
  
  // Lấy thông tin booking theo ID
  getBookingById: async (bookingId: string, type: BookingType, token?: string) => {
    try {
      let endpoint;
      
      switch (type) {
        case 'tour':
          // Sử dụng API chi tiết để lấy đầy đủ thông tin booking tour kèm payment
          endpoint = API_ENDPOINTS.TOUR_BOOKINGS.DETAILS(bookingId);
          break;
        case 'hotel':
          // Sử dụng API chi tiết để lấy đầy đủ thông tin booking hotel kèm payment
          endpoint = API_ENDPOINTS.HOTEL_BOOKINGS.DETAILS(bookingId);
          break;
        case 'flight':
          endpoint = API_ENDPOINTS.FLIGHT_BOOKINGS.DETAILS(bookingId);
          break;
        default:
          throw new Error('Loại đặt chỗ không hợp lệ');
      }
      
      console.log(`Gọi API lấy thông tin booking ${type}:`, endpoint);
      const response = await fetchApi(endpoint, 'GET', undefined, token);
      
      if (!response.success) {
        console.log(`API chi tiết thất bại, thử dùng API cơ bản cho ${type}`);
        // Nếu API chi tiết thất bại, thử dùng API cơ bản
        const fallbackEndpoint = type === 'tour' 
          ? API_ENDPOINTS.TOUR_BOOKINGS.DETAIL(bookingId) 
          : endpoint;
        
        const fallbackResponse = await fetchApi(fallbackEndpoint, 'GET', undefined, token);
        if (fallbackResponse.success) {
          return fallbackResponse.data;
        }
      }
      
      if (response && response.data) {
        // Đảm bảo totalPrice là số
        if (response.data.totalPrice) {
          response.data.totalPrice = Number(response.data.totalPrice);
        } else if (type === 'tour' && response.data.tour) {
          // Nếu không có totalPrice, tính toán dựa trên giá tour và số người
          const price = response.data.tour.priceDiscount || response.data.tour.price || 0;
          const numPeople = response.data.numOfPeople || response.data.participants || 1;
          response.data.totalPrice = price * numPeople;
        } else if (type === 'hotel' && response.data.hotel) {
          // Tính toán dựa trên giá phòng, số đêm
          const roomPrice = response.data.roomType?.price || 0;
          // Tính số đêm từ ngày check-in và check-out
          const checkIn = new Date(response.data.checkInDate);
          const checkOut = new Date(response.data.checkOutDate);
          const timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
          const nights = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
          
          response.data.totalPrice = roomPrice * nights;
        } else if (type === 'flight' && response.data.flight) {
          // Tính toán dựa trên giá vé và số hành khách
          const ticketPrice = response.data.flight.price || 0;
          const passengers = Array.isArray(response.data.passengers) ? 
                            response.data.passengers.length : 
                            response.data.numOfPassengers || 1;
          response.data.totalPrice = ticketPrice * passengers;
        }
        
        console.log(`Thông tin booking ${type} với ID ${bookingId}:`, 
                   JSON.stringify({
                     bookingId: response.data._id,
                     bookingNumber: response.data.bookingNumber || response.data.bookingReference,
                     totalPrice: response.data.totalPrice,
                     status: response.data.status
                   }));
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Lỗi khi lấy booking ${type} (${bookingId}):`, error.message);
      } else {
        console.error(`Lỗi không xác định khi lấy booking ${type} (${bookingId})`);
      }
      return null;
    }
  },
  
  // Lấy tất cả bookings của người dùng hiện tại
  getMyBookings: async (token: string, type?: BookingType) => {
    try {
      const endpoint = type 
        ? API_ENDPOINTS[`${type.toUpperCase()}_BOOKINGS`].GET_MY_BOOKINGS
        : API_ENDPOINTS.BOOKINGS.GET_MY_BOOKINGS;
      return await fetchApi(endpoint, 'GET', undefined, token);
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Hủy booking
  cancelBooking: async (id: string, type: BookingType, token: string) => {
    try {
      const endpoint = API_ENDPOINTS[`${type.toUpperCase()}_BOOKINGS`].CANCEL(id);
      return await fetchApi(endpoint, 'PUT', undefined, token);
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Kiểm tra khả dụng của khách sạn
  checkHotelAvailability: async (hotelId: string, roomId: string, checkInDate: Date, checkOutDate: Date, guests: number) => {
    try {
      const data = {
        hotelId,
        roomId,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests,
      };
      
      console.log('Kiểm tra tính khả dụng khách sạn với dữ liệu:', JSON.stringify(data));
      
      return await fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.CHECK_AVAILABILITY, 'POST', data);
    } catch (error) {
      console.error('Lỗi kiểm tra phòng khả dụng:', error);
      return {
        success: false,
        message: 'Không thể kiểm tra tính khả dụng của phòng. Vui lòng thử lại sau.',
      };
    }
  },
  
  // Đặt tour (hàm gốc)
  bookTour: async (bookingData: TourBookingData, token: string) => {
    try {
      const response = await fetchApi(
        API_ENDPOINTS.TOUR_BOOKINGS.BASE, 
        'POST', 
        bookingData, 
        token
      );
      
      return response;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Lấy payment ID từ booking
  getPaymentIdFromBooking: async (bookingId: string, bookingType: 'tour' | 'hotel' | 'flight', token?: string) => {
    try {
      if (!bookingId || !bookingType || !token) {
        console.log('Thiếu thông tin để lấy payment ID');
        return {
          success: false, 
          message: 'Thiếu thông tin để lấy payment ID',
          data: null
        };
      }
      
      console.log(`Gọi API lấy payment ID từ booking ${bookingType}:`, `/payments/booking/${bookingType}/${bookingId}`);
      return await fetchApi(`/payments/booking/${bookingType}/${bookingId}`, 'GET', undefined, token);
    } catch (error) {
      console.error('Lỗi khi lấy payment ID từ booking:', error);
      return {
        success: false,
        message: 'Không thể lấy thông tin thanh toán. Vui lòng thử lại sau.',
        data: null
      };
    }
  },
  
  // Hàm tạo đặt tour (alias cho bookTour, sử dụng trong app/booking/tour.tsx)
  create: async (bookingData: TourBookingData, token: string) => {
    try {
      console.log('Gọi API tạo đặt tour với dữ liệu:', JSON.stringify(bookingData));
      return await fetchApi(
        API_ENDPOINTS.TOUR_BOOKINGS.BASE, 
        'POST', 
        bookingData, 
        token
      );
    } catch (error: unknown) {
      console.error('Lỗi kiểm tra phòng khả dụng:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorWithResponse = error as { response: { data: { message: string } } };
        return {
          success: false,
          message: errorWithResponse.response?.data?.message || 'Lỗi khi kiểm tra phòng khả dụng',
          error: errorWithResponse.response?.data
        };
      }
      
      return {
        success: false,
        message: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
        error
      };
    }
  },

  // Thêm alias cho testTourBooking để sửa lỗi _api.bookingsApi.testTourBooking
  testTourBooking: async (tourId: string, startDate: string, numOfPeople: number) => {
    // Gọi lại hàm đã thêm vào tourBookingsApi
    return tourBookingsApi.testTourBooking(tourId, startDate, numOfPeople);
  }
};

/**
 * API Functions cho Hotel Bookings
 */
export const hotelBookingsApi = {
  getAll: (token: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.HOTEL_BOOKINGS.BASE}${queryString}`, 'GET', undefined, token);
  },
  
  getById: (id: string, token?: string) => {
    try {
      // Sử dụng API chi tiết để lấy đầy đủ thông tin booking kèm payment
      const response = fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.DETAILS(id), 'GET', undefined, token);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy thông tin chi tiết đặt phòng với id ${id}:`, error);
      
      // Nếu API chi tiết lỗi, thử dùng API cơ bản
      try {
        console.log('Thử gọi API đặt phòng cơ bản');
        const basicResponse = fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.DETAIL(id), 'GET', undefined, token);
        return basicResponse;
      } catch (fallbackError) {
        console.error('Fallback API cũng lỗi:', fallbackError);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Không thể tải thông tin đặt phòng',
          data: null
        };
      }
    }
  },
  
  create: (bookingData: any, token: string) => {
    console.log('Gọi API đặt phòng khách sạn:', JSON.stringify(bookingData));
    
    // Đảm bảo dữ liệu đúng với cấu trúc backend
    const formattedData = {
      hotel: bookingData.hotel || bookingData.hotelId, // Đảm bảo dùng đúng trường
      room: bookingData.roomId || bookingData.room, // Chuẩn hóa trường roomId
      checkIn: bookingData.checkIn || bookingData.checkInDate,
      checkOut: bookingData.checkOut || bookingData.checkOutDate,
      guests: bookingData.guests || { 
        adults: typeof bookingData.guests === 'number' ? bookingData.guests : 2,
        children: 0
      },
      nights: bookingData.nights || 1,
      roomCount: bookingData.roomCount || 1,
      totalPrice: bookingData.totalPrice,
      contactInfo: bookingData.contactInfo || {
        fullName: bookingData.contactName,
        email: bookingData.contactEmail,
        phone: bookingData.contactPhone
      },
      specialRequests: bookingData.specialRequests || '',
      paymentMethod: convertPaymentMethod(bookingData.paymentMethod || 'cash'),
      status: bookingData.status || 'pending'
    };

    console.log('Dữ liệu đặt phòng đã xử lý:', JSON.stringify(formattedData));
    
    // Kiểm tra dữ liệu trước khi gửi
    if (!formattedData.hotel) {
      console.error('Thiếu thông tin khách sạn trong dữ liệu đặt phòng');
      return {
        success: false,
        message: 'Thiếu thông tin khách sạn'
      };
    }
    
    return fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.BASE, 'POST', formattedData, token);
  },
  
  createHotelBooking: (bookingData: any, token: string) => {
    // Đảm bảo API gọi đúng method khác
    return hotelBookingsApi.create(bookingData, token);
  },
  
  getMyBookings: (token: string) => {
    try {
      console.log('Gọi API lấy danh sách đặt phòng khách sạn của tôi:', API_ENDPOINTS.HOTEL_BOOKINGS.GET_MY_BOOKINGS);
      return fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.GET_MY_BOOKINGS, 'GET', undefined, token);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đặt phòng khách sạn:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách đặt phòng khách sạn',
        data: []
      };
    }
  },
  
  cancelBooking: (id: string, token: string) => {
    return fetchApi(`${API_ENDPOINTS.HOTEL_BOOKINGS.DETAIL(id)}/cancel`, 'PUT', undefined, token);
  },

  checkAvailability: (params: any) => {
    return fetchApi(API_ENDPOINTS.HOTEL_BOOKINGS.CHECK_AVAILABILITY, 'POST', params);
  }
};

// Cập nhật Flight Bookings API
export const flightBookingsApi = {
  // Lấy danh sách đặt vé máy bay của người dùng hiện tại
  getMyBookings: async (token: string) => {
    try {
      console.log('Gọi API lấy danh sách đặt vé máy bay của tôi:', API_ENDPOINTS.FLIGHT_BOOKINGS.GET_MY_BOOKINGS);
      return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.GET_MY_BOOKINGS, 'GET', undefined, token);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đặt vé máy bay:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách đặt vé máy bay',
        data: []
      };
    }
  },
  
  // Lấy chi tiết đặt vé theo ID
  getById: async (id: string, token: string) => {
    try {
      // Sử dụng API chi tiết để lấy đầy đủ thông tin booking kèm payment
      const response = await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.DETAILS(id), 'GET', undefined, token);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy thông tin chi tiết đặt vé với id ${id}:`, error);
      
      // Nếu API chi tiết lỗi, thử dùng API cơ bản
      try {
        console.log('Thử gọi API đặt vé cơ bản');
        const basicResponse = await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.DETAIL(id), 'GET', undefined, token);
        return basicResponse;
      } catch (fallbackError) {
        console.error('Fallback API cũng lỗi:', fallbackError);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Không thể tải thông tin đặt vé',
          data: null
        };
      }
    }
  },
  
  // Tạo đặt vé mới với model mới
  createBooking: async (bookingData: any, token: string) => {
    return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.BASE, 'POST', bookingData, token);
  },
  
  // Hủy đặt vé
  cancelBooking: async (id: string, reason: string, token: string) => {
    return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.CANCEL(id), 'PUT', { reason }, token);
  },
  
  // Cập nhật thông tin đặt vé
  update: async (id: string, bookingData: any, token: string) => {
    return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.DETAIL(id), 'PUT', bookingData, token);
  },
  
  // Kiểm tra khả dụng chuyến bay
  checkAvailability: async (flightId: string, seatClass: string, passengers: number) => {
    return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.CHECK_AVAILABILITY, 'POST', {
      flightId,
      seatClass,
      passengers
    });
  },
  
  // Lấy thông tin thanh toán
  getPaymentInfo: async (id: string, token: string) => {
    return await fetchApi(API_ENDPOINTS.FLIGHT_BOOKINGS.GET_PAYMENT(id), 'GET', undefined, token);
  }
};

// Hàm tính số đêm giữa hai ngày
function calculateNights(checkInDateStr: string, checkOutDateStr: string): number {
  const checkIn = new Date(checkInDateStr);
  const checkOut = new Date(checkOutDateStr);
  const timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
}

// Hàm chuyển đổi giá trị payment method sang định dạng backend chấp nhận
function convertPaymentMethod(method: string): string {
  // Các giá trị hợp lệ trong backend: 'credit_card', 'bank_transfer', 'cash', 'paypal', 'momo', 'zalopay', 'vnpay', 'sepay'
  const methodMap: Record<string, string> = {
    'cash': 'cash',
    'credit_card': 'credit_card',
    'bank_transfer': 'bank_transfer',
    'momo': 'momo',
    'zalopay': 'zalopay',
    'vnpay': 'vnpay',
    'sepay': 'sepay',
    'SePay': 'sepay', // Hỗ trợ cả SePay nếu đã nhập sai
    'paypal': 'paypal'
  };
  
  return methodMap[method.toLowerCase()] || 'sepay';
}

// Thêm API cho Tour Bookings
export const tourBookingsApi = {
  getAll: (token: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.TOUR_BOOKINGS.BASE}${queryString}`, 'GET', undefined, token);
  },
  
  getById: (id: string, token?: string) => {
    try {
      // Sử dụng API chi tiết để lấy đầy đủ thông tin booking kèm payment
      const response = fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.DETAILS(id), 'GET', undefined, token);
      return response;
    } catch (error: unknown) {
      console.error(`Lỗi khi lấy thông tin chi tiết đặt tour với id ${id}:`, error);
      
      // Nếu API chi tiết lỗi, thử dùng API cơ bản
      try {
        console.log('Thử gọi API đặt tour cơ bản');
        const basicResponse = fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.DETAIL(id), 'GET', undefined, token);
        return basicResponse;
      } catch (fallbackError) {
        console.error('Fallback API cũng lỗi:', fallbackError);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Không thể tải thông tin đặt tour',
          data: null
        };
      }
    }
  },
  
  create: (bookingData: any, token: string) => {
    return fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.BASE, 'POST', bookingData, token);
  },
  
  getMyBookings: (token: string) => {
    try {
      console.log('Gọi API lấy danh sách đặt tour của tôi:', API_ENDPOINTS.TOUR_BOOKINGS.GET_MY_BOOKINGS);
      return fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.GET_MY_BOOKINGS, 'GET', undefined, token);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đặt tour:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách đặt tour',
        data: []
      };
    }
  },
  
  cancelBooking: (id: string, token: string) => {
    return fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.CANCEL(id), 'PUT', undefined, token);
  },

  checkAvailability: (params: any) => {
    return fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.CHECK_AVAILABILITY, 'POST', params);
  },
  
  // Thêm hàm kiểm tra khả năng đặt tour
  testTourBooking: async (tourId: string, startDate: string, numOfPeople: number) => {
    try {
      console.log('Kiểm tra đặt tour với ID:', tourId, 'ngày bắt đầu:', startDate, 'số người:', numOfPeople);
      
      if (!tourId) {
        return {
          success: false,
          message: 'Thiếu ID tour'
        };
      }
      
      // Bước 1: Kiểm tra xem tour có tồn tại không
      const tourResponse = await fetchApi(API_ENDPOINTS.TOURS.DETAIL(tourId), 'GET');
      
      if (!tourResponse.success) {
        return {
          success: false,
          message: 'Không tìm thấy tour với ID đã cung cấp'
        };
      }
      
      const tour = tourResponse.data;
      console.log('Tìm thấy tour:', tour.name);
      
      // Bước 2: Kiểm tra tính khả dụng của tour vào ngày đã chọn
      const availabilityParams = {
        tourId: tourId,
        startDate: startDate,
        numOfPeople: numOfPeople
      };
      
      const availabilityResponse = await fetchApi(API_ENDPOINTS.TOUR_BOOKINGS.CHECK_AVAILABILITY, 'POST', availabilityParams);
      
      if (!availabilityResponse.success) {
        return {
          success: false,
          message: availabilityResponse.message || 'Tour không khả dụng vào ngày đã chọn'
        };
      }
      
      return {
        success: true,
        message: 'Tour khả dụng và có thể đặt',
        tourInfo: {
          _id: tour._id,
          name: tour.name,
          price: tour.price,
          duration: tour.duration,
          startDate: startDate,
          numOfPeople: numOfPeople,
          totalPrice: tour.price * numOfPeople
        }
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra đặt tour:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra tour'
      };
    }
  }
};

/**
 * API Functions cho Hotels
 */
export const hotelsApi = {
  getAll: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.HOTELS.BASE}${queryString}`);
  },
  
  getById: (id: string) => {
    return fetchApi(API_ENDPOINTS.HOTELS.DETAIL(id));
  },
  
  getCategories: () => {
    return fetchApi(API_ENDPOINTS.HOTELS.CATEGORIES);
  },
  
  getByCategory: (category: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.HOTELS.CATEGORY(category)}${queryString}`);
  },
  
  getPopularCities: () => {
    return fetchApi(API_ENDPOINTS.HOTELS.POPULAR_CITIES);
  },
  
  getByCity: (city: string, params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.HOTELS.CITY(city)}${queryString}`);
  },
  
  getFeaturedHotels: (params?: Record<string, any>) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return fetchApi(`${API_ENDPOINTS.HOTELS.FEATURED}${queryString}`);
  },
  
  getRooms: (hotelId: string) => {
    return fetchApi(API_ENDPOINTS.HOTELS.ROOMS(hotelId));
  },
  
  searchHotels: (params: { 
    city?: string; 
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
  }) => {
    const queryString = `?${new URLSearchParams(params as any).toString()}`;
    return fetchApi(`${API_ENDPOINTS.HOTELS.SEARCH}${queryString}`);
  },
  
  checkAvailability: (hotelId: string, params: CheckAvailabilityParams) => {
    return fetchApi(API_ENDPOINTS.HOTELS.AVAILABILITY(hotelId), 'POST', params);
  }
};

// Thêm alias để đảm bảo tương thích ngược với mã cũ
// Điều này giúp nếu có bất kỳ mã nào vẫn đang sử dụng flightBookingsAPI thay vì flightBookingsApi
export const flightBookingsAPI = flightBookingsApi; 