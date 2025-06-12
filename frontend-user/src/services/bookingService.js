import api from './api';

export const bookingService = {
  // Lấy tất cả booking của user
  getAllBookings: async () => {
    try {
      const response = await api.get(`/bookings/me`);
      return response.data;
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw error;
    }
  },
  
  // Lấy chi tiết một booking
  getBookingById: async (id, type) => {
    try {
      const endpoint = type 
        ? `/${type}-bookings/${id}` 
        : `/bookings/${id}`;
      
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error getting booking with id ${id}:`, error);
      throw error;
    }
  },
  
  // API cho tour bookings
  tourBookings: {
    getAll: async () => {
      try {
        const response = await api.get('/tour-bookings/me');
        return response.data;
      } catch (error) {
        console.error('Error getting tour bookings:', error);
        return { success: false, message: error.message, data: [] };
      }
    },
    
    getById: async (id) => {
      try {
        const response = await api.get(`/tour-bookings/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error getting tour booking with id ${id}:`, error);
        return { success: false, message: error.message };
      }
    },
    
    create: async (bookingData) => {
      try {
        const response = await api.post('/tour-bookings', bookingData);
        return response.data;
      } catch (error) {
        console.error('Error creating tour booking:', error);
        return { success: false, message: error.message };
      }
    },
    
    cancel: async (id, reason) => {
      try {
        const response = await api.put(`/tour-bookings/${id}/cancel`, { reason });
        return response.data;
      } catch (error) {
        console.error('Error cancelling tour booking:', error);
        return { success: false, message: error.message };
      }
    },
    
    getPayment: async (id) => {
      try {
        const response = await api.get(`/tour-bookings/${id}/payment`);
        return response.data;
      } catch (error) {
        console.error(`Error getting payment for tour booking ${id}:`, error);
        return { success: false, message: error.message };
      }
    }
  },
  
  // API cho hotel bookings
  hotelBookings: {
    getAll: async () => {
      try {
        const response = await api.get('/hotel-bookings/me');
        return response.data;
      } catch (error) {
        console.error('Error getting hotel bookings:', error);
        return { success: false, message: error.message, data: [] };
      }
    },
    
    getById: async (id) => {
      try {
        const response = await api.get(`/hotel-bookings/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error getting hotel booking with id ${id}:`, error);
        return { success: false, message: error.message };
      }
    },
    
    create: async (bookingData) => {
      try {
        const response = await api.post('/hotel-bookings', bookingData);
        return response.data;
      } catch (error) {
        console.error('Error creating hotel booking:', error);
        return { success: false, message: error.message };
      }
    },
    
    cancel: async (id, reason) => {
      try {
        const response = await api.put(`/hotel-bookings/${id}/cancel`, { reason });
        return response.data;
      } catch (error) {
        console.error('Error cancelling hotel booking:', error);
        return { success: false, message: error.message };
      }
    },
    
    checkAvailability: async (params) => {
      try {
        const response = await api.post('/hotel-bookings/check-availability', params);
        return response.data;
      } catch (error) {
        console.error('Error checking hotel availability:', error);
        return { success: false, message: error.message };
      }
    }
  },
  
  // API cho flight bookings
  flightBookings: {
    getAll: async () => {
      try {
        const response = await api.get('/flight-bookings/me');
        return response.data;
      } catch (error) {
        console.error('Error getting flight bookings:', error);
        return { success: false, message: error.message, data: [] };
      }
    },
    
    getById: async (id) => {
      try {
        const response = await api.get(`/flight-bookings/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error getting flight booking with id ${id}:`, error);
        return { success: false, message: error.message };
      }
    },
    
    create: async (bookingData) => {
      try {
        const response = await api.post('/flight-bookings', bookingData);
        return response.data;
      } catch (error) {
        console.error('Error creating flight booking:', error);
        return { success: false, message: error.message };
      }
    },
    
    cancel: async (id, reason) => {
      try {
        const response = await api.put(`/flight-bookings/${id}/cancel`, { reason });
        return response.data;
      } catch (error) {
        console.error('Error cancelling flight booking:', error);
        return { success: false, message: error.message };
      }
    }
  },

  // Lấy tất cả bookings của người dùng
  getUserBookings: async () => {
    try {
      // Gọi cả 3 API booking riêng biệt
      const [tourResponse, hotelResponse, flightResponse] = await Promise.all([
        bookingService.tourBookings.getAll(),
        bookingService.hotelBookings.getAll(),
        bookingService.flightBookings.getAll()
      ]);
      
      // Kết hợp dữ liệu từ 3 API
      const tourBookings = (tourResponse.success && tourResponse.data) || [];
      const hotelBookings = (hotelResponse.success && hotelResponse.data) || [];
      const flightBookings = (flightResponse.success && flightResponse.data) || [];
      
      return {
        success: true,
        data: [...tourBookings, ...hotelBookings, ...flightBookings]
      };
    } catch (error) {
      console.error('Error getting all user bookings:', error);
      return { success: false, message: error.message, data: [] };
    }
  },

  // Thanh toán booking
  payment: {
    create: async (paymentData) => {
      try {
        const response = await api.post('/payments', paymentData);
        return response.data;
      } catch (error) {
        console.error('Error creating payment:', error);
        return { success: false, message: error.message };
      }
    },
    
    getById: async (paymentId) => {
      try {
        const response = await api.get(`/payments/${paymentId}`);
        return response.data;
      } catch (error) {
        console.error('Error getting payment details:', error);
        return { success: false, message: error.message };
      }
    },
    
    checkStatus: async (paymentId) => {
      try {
        const response = await api.get(`/payments/${paymentId}/check`);
        return response.data;
      } catch (error) {
        console.error('Error checking payment status:', error);
        return { success: false, message: error.message };
      }
    }
  }
};

export default bookingService; 