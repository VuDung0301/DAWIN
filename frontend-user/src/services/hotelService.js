import axios from 'axios';
import { API_URL } from '../utils/config';

export const hotelService = {
  // Lấy tất cả khách sạn
  getHotels: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/hotels`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching hotels:', error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (id) => {
    try {
      // Kiểm tra ID
      if (!id || id === 'undefined') {
        console.error('Invalid hotel ID:', id);
        return { 
          success: false, 
          message: 'ID khách sạn không hợp lệ' 
        };
      }

      console.log(`Gọi API lấy thông tin khách sạn ID: ${id}`);
      const response = await axios.get(`${API_URL}/hotels/${id}`);
      
      // Kiểm tra dữ liệu trả về
      if (response.data && response.data.success && response.data.data) {
        const hotelData = response.data.data;
        
        // Kiểm tra và điền thông tin thiếu
        if (!hotelData.roomTypes || !Array.isArray(hotelData.roomTypes) || hotelData.roomTypes.length === 0) {
          console.warn(`Khách sạn ${id} không có thông tin phòng, thêm dữ liệu mặc định`);
          hotelData.roomTypes = [{
            _id: `default-room-${id}`,
            name: "Phòng tiêu chuẩn",
            price: hotelData.pricePerNight || 1000000,
            capacity: 2,
            available: 5,
            description: "Phòng tiêu chuẩn thoải mái"
          }];
        }
        
        // Đảm bảo có giá mặc định nếu không có thông tin giá
        if (!hotelData.pricePerNight) {
          hotelData.pricePerNight = hotelData.roomTypes[0]?.price || 1000000;
        }
        
        // Đảm bảo có mảng hình ảnh
        if (!hotelData.images) {
          hotelData.images = [];
        }
        
        // Ghi log thông tin
        console.log(`Đã nhận thông tin khách sạn ${hotelData.name}, có ${hotelData.roomTypes.length} loại phòng`);
        
        return response.data;
      } else {
        console.error('Dữ liệu khách sạn không đúng định dạng:', response.data);
        return {
          success: false,
          message: 'Dữ liệu khách sạn không đúng định dạng',
          data: null
        };
      }
    } catch (error) {
      console.error(`Error fetching hotel with id ${id}:`, error);
      
      // Trả về thông tin lỗi chi tiết từ API nếu có
      if (error.response && error.response.data) {
        return error.response.data;
      }
      
      // Nếu không có thông tin lỗi từ API, tạo thông báo lỗi chung
      return { 
        success: false, 
        message: error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' 
      };
    }
  },

  // Lấy các khách sạn phổ biến
  getPopularHotels: async () => {
    try {
      const response = await axios.get(`${API_URL}/hotels/popular`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular hotels:', error);
      throw error;
    }
  },

  // Tìm kiếm khách sạn
  searchHotels: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/hotels/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  },

  // Đặt phòng khách sạn
  bookHotel: async (hotelId, roomTypeId, bookingData) => {
    try {
      const response = await axios.post(`${API_URL}/bookings/hotel/${hotelId}/room/${roomTypeId}`, bookingData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error booking hotel:', error);
      throw error;
    }
  },

  // Lấy đánh giá của khách sạn
  getHotelReviews: async (hotelId) => {
    try {
      const response = await axios.get(`${API_URL}/hotels/${hotelId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching hotel reviews:', error);
      throw error;
    }
  },

  // Thêm đánh giá cho khách sạn
  addHotelReview: async (hotelId, reviewData) => {
    try {
      const response = await axios.post(`${API_URL}/hotels/${hotelId}/reviews`, reviewData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding hotel review:', error);
      throw error;
    }
  },

  // Kiểm tra tình trạng phòng trống
  checkRoomAvailability: async (hotelId, checkInDate, checkOutDate, guests) => {
    try {
      const response = await axios.get(`${API_URL}/hotels/${hotelId}/availability`, {
        params: { checkInDate, checkOutDate, guests }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  // Lấy khách sạn theo thành phố
  getHotelsByCity: async (city) => {
    try {
      const response = await axios.get(`${API_URL}/hotels/city/${city}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching hotels in ${city}:`, error);
      throw error;
    }
  },

  // Lấy danh sách các thành phố có khách sạn
  getCities: async () => {
    try {
      const response = await axios.get(`${API_URL}/hotels/cities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching hotel cities:', error);
      throw error;
    }
  },

  // Lấy khách sạn được đặt nhiều nhất
  getMostBookedHotels: async () => {
    try {
      const response = await axios.get(`${API_URL}/hotels/most-booked`);
      return response.data;
    } catch (error) {
      console.error('Error fetching most booked hotels:', error);
      throw error;
    }
  },

  // Lấy khách sạn theo danh mục
  getHotelsByCategory: async (category) => {
    const response = await axios.get(`${API_URL}/hotels`, { params: { category } });
    return response.data;
  },

  // Lấy khách sạn nổi bật
  getFeaturedHotels: async () => {
    try {
      const response = await axios.get(`${API_URL}/hotels/featured`);
      return response.data;
    } catch (error) {
      console.error('Error getting featured hotels:', error);
      throw error;
    }
  },

  // Lấy các thành phố phổ biến
  getPopularCities: async () => {
    const response = await axios.get(`${API_URL}/hotels/popular-cities`);
    return response.data;
  },
};

export default hotelService; 