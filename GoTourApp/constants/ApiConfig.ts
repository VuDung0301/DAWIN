// Chuyển từ localhost sang IP thực của máy tính trong cùng mạng LAN
export const API_BASE_URL = "http://10.0.2.2:5001/api";

// Nếu đang chạy trên thiết bị thật, sử dụng biến môi trường để xác định URL API
// Có thể kiểm tra môi trường và tự động chọn URL phù hợp
export const getApiBaseUrl = () => {
  if (__DEV__) {
    // Khi đang phát triển (trên máy ảo hoặc thiết bị thật được kết nối qua USB)
    return "http://10.0.2.2:5001/api"; // Thay bằng IP của máy bạn trong mạng LAN
  } else {
    // Khi đã triển khai ứng dụng
    return "https://api.dawin.com/api"; // URL API production
  }
};

// Định nghĩa các endpoint
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: {
    CHECK: "/health",
  },
  
  // Auth
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
  
  // Tours
  TOURS: {
    BASE: "/tours",
    DETAIL: (id: string) => `/tours/${id}`,
    CATEGORIES: "/tours/categories",
    CATEGORY: (category: string) => `/tours/categories/${category}`,
    POPULAR_DESTINATIONS: "/tours/popular-destinations",
    DESTINATION: (destination: string) => `/tours/destinations/${destination}`,
    FEATURED: "/tours/featured",
    POPULAR: "/tours/popular",
    NEWEST: "/tours/newest",
    BUDGET: "/tours/budget"
  },
  
  // Flights
  FLIGHTS: {
    BASE: "/flights",
    DETAIL: (flightIata: string, date: string) => `/flights/${flightIata}/${date}`,
    SEARCH: "/flights/search",
    AIRLINES: "/flights/airlines",
    DESTINATIONS: "/flights/destinations",
    UPCOMING: "/flights/upcoming",
    DOMESTIC: "/flights/domestic",
    INTERNATIONAL: "/flights/international",
  },
  
  // Hotels
  HOTELS: {
    BASE: "/hotels",
    DETAIL: (id: string) => `/hotels/${id}`,
    FEATURED: "/hotels/featured",
    SEARCH: "/hotels/search",
    CATEGORIES: "/hotels/categories",
    CATEGORY: (category: string) => `/hotels/categories/${category}`,
    POPULAR_CITIES: "/hotels/popular-cities",
    CITY: (city: string) => `/hotels/cities/${city}`,
    CHECK_AVAILABILITY: (id: string) => `/hotels/${id}/check-availability`,
  },
  
  // Bookings
  BOOKINGS: {
    BASE: "/bookings",
    DETAIL: (id: string) => `/bookings/${id}`,
    GET_MY_BOOKINGS: "/bookings/me",
  },
  
  // Tour Bookings
  TOUR_BOOKINGS: {
    BASE: "/tour-bookings",
    DETAIL: (id: string) => `/tour-bookings/${id}`,
    GET_MY_BOOKINGS: "/tour-bookings/me",
    GET_PAYMENT: (id: string) => `/tour-bookings/${id}/payment`,
  },
  
  // Hotel Bookings
  HOTEL_BOOKINGS: {
    BASE: "/hotel-bookings",
    DETAIL: (id: string) => `/hotel-bookings/${id}`,
    GET_MY_BOOKINGS: "/hotel-bookings/me",
    CHECK_AVAILABILITY: "/hotel-bookings/check-availability",
    GET_PAYMENT: (id: string) => `/hotel-bookings/${id}/payment`,
  },
  
  // Reviews
  REVIEWS: {
    BASE: "/reviews",
    DETAIL: (id: string) => `/reviews/${id}`,
    BY_TOUR: (tourId: string) => `/reviews/tour/${tourId}`,
    BY_HOTEL: (hotelId: string) => `/reviews/hotel/${hotelId}`,
    MY_REVIEWS: "/reviews/me",
    GET_TOUR_REVIEWS: (tourId: string) => `/reviews/tour/${tourId}`,
    GET_HOTEL_REVIEWS: (hotelId: string) => `/reviews/hotel/${hotelId}`,
  },
  
  // Uploads
  UPLOADS: {
    BASE: "/uploads",
  },
  
  // Thêm endpoint cho FlightBooking
  FLIGHT_BOOKINGS: {
    BASE: '/flight-bookings',
    DETAIL: (id: string) => `/flight-bookings/${id}`,
    GET_MY_BOOKINGS: '/flight-bookings/me',
    CANCEL: (id: string) => `/flight-bookings/${id}/cancel`,
    CHECK_AVAILABILITY: '/flight-bookings/check-availability',
    GET_PAYMENT: (id: string) => `/flight-bookings/${id}/payment`,
  },
  
  // Thêm endpoint cho Payments
  PAYMENT: {
    BASE: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    CHECK_STATUS: (id: string) => `/payments/${id}/check`,
    MY_PAYMENTS: '/payments/me',
    WEBHOOK_SEPAY: '/payments/webhook/sepay'
  },
}; 