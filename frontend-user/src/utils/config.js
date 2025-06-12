// API config
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Pagination config
export const ITEMS_PER_PAGE = 9;

// Image placeholders
export const DEFAULT_TOUR_IMAGE = 'https://source.unsplash.com/random/300x200/?travel';
export const DEFAULT_HOTEL_IMAGE = 'https://source.unsplash.com/random/300x200/?hotel';
export const DEFAULT_USER_AVATAR = 'https://source.unsplash.com/random/300x300/?person';

// Dates
export const formatDate = (date) => {
  if (!date) return '';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(date).toLocaleDateString('vi-VN', options);
};

// Currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Get booking status class
export const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'đã xác nhận':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'chờ xác nhận':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'đã hủy':
      return 'bg-red-100 text-red-800';
    case 'completed':
    case 'đã hoàn thành':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Local storage keys
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  TOURS: '/tours',
  TOUR_DETAILS: (id) => `/tours/${id}`,
  HOTELS: '/hotels',
  HOTEL_DETAILS: (id) => `/hotels/${id}`,
  FLIGHTS: '/flights',
  FLIGHT_DETAILS: (id) => `/flights/${id}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAILS: (id) => `/bookings/${id}`,
  CHECKOUT: '/checkout',
  CHECKOUT_DETAILS: (type, id) => `/checkout/${type}/${id}`,
  PAYMENT: (id) => `/payment/${id}`,
  EXPLORE: '/explore',
  SEARCH: '/search'
}; 