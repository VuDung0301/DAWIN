// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// App Configuration
export const APP_CONFIG = {
  name: 'GoTour',
  version: '1.0.0',
  description: 'Ứng dụng du lịch toàn diện',
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 50,
  
  // File upload
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Timeouts
  apiTimeout: 30000, // 30 seconds
  
  // Cache
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  RECENT_SEARCHES: 'recentSearches',
  FAVORITES: 'favorites',
  SETTINGS: 'appSettings',
};

// Routes
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
  },
  
  // Tours
  TOURS: {
    BASE: '/api/tours',
    SEARCH: '/api/tours/search',
    POPULAR: '/api/tours/popular',
    CATEGORIES: '/api/tours/categories',
  },
  
  // Hotels
  HOTELS: {
    BASE: '/api/hotels',
    SEARCH: '/api/hotels/search',
  },
  
  // Flights
  FLIGHTS: {
    BASE: '/api/flights',
    SEARCH: '/api/flights/search',
  },
  
  // Bookings
  BOOKINGS: {
    BASE: '/api/bookings',
    TOURS: '/api/tour-bookings',
    HOTELS: '/api/hotel-bookings',
    FLIGHTS: '/api/flight-bookings',
  },
  
  // Reviews
  REVIEWS: {
    BASE: '/api/reviews',
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/api/payments',
    SEPAY: '/api/payments/sepay',
  },
};

export default {
  API_BASE_URL,
  APP_CONFIG,
  STORAGE_KEYS,
  API_ROUTES,
}; 