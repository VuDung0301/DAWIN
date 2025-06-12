import api from './api';

export const tourService = {
  // Lấy tất cả tours
  getAllTours: async (params = {}) => {
    try {
      console.log('🚀 tourService.getAllTours called with params:', params);
      const response = await api.get(`/tours`, { params });
      console.log('✅ tourService.getAllTours response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error getting all tours:', error);
      throw error;
    }
  },

  // Lấy chi tiết một tour
  getTourById: async (id) => {
    try {
      const response = await api.get(`/tours/${id}`);
      return response;
    } catch (error) {
      console.error(`Error getting tour with id ${id}:`, error);
      throw error;
    }
  },

  // Lấy top tour giá rẻ
  getTopCheapTours: async () => {
    const response = await api.get(`/tours/top-5-cheap`);
    return response.data;
  },

  // Lấy thống kê tour
  getTourStats: async () => {
    const response = await api.get(`/tours/stats`);
    return response.data;
  },

  // Lấy tất cả danh mục tour
  getCategories: async () => {
    const response = await api.get(`/tours/categories`);
    return response.data;
  },

  // Lấy tour theo danh mục
  getToursByCategory: async (category) => {
    const response = await api.get(`/tours/category/${category}`);
    return response.data;
  },

  // Lấy điểm đến phổ biến
  getPopularDestinations: async () => {
    const response = await api.get(`/tours/popular-destinations`);
    return response.data;
  },

  // Lấy tour theo điểm đến
  getToursByDestination: async (destination) => {
    const response = await api.get(`/tours/destination/${destination}`);
    return response.data;
  },

  // Lấy tour nổi bật
  getFeaturedTours: async () => {
    try {
      const response = await api.get(`/tours/featured`);
      return response;
    } catch (error) {
      console.error('Error getting featured tours:', error);
      throw error;
    }
  },

  // Lấy tour phổ biến
  getPopularTours: async () => {
    try {
      const response = await api.get(`/tours/popular`);
      return response.data;
    } catch (error) {
      console.error('Error getting popular tours:', error);
      throw error;
    }
  },

  // Lấy tour mới nhất
  getNewestTours: async () => {
    const response = await api.get(`/tours/newest`);
    return response.data;
  },

  // Lấy tour giá tốt
  getBudgetTours: async () => {
    const response = await api.get(`/tours/budget`);
    return response.data;
  },

  // Tìm kiếm tours
  searchTours: async (searchParams) => {
    try {
      const response = await api.get(`/tours/search`, { params: searchParams });
      return response;
    } catch (error) {
      console.error('Error searching tours:', error);
      throw error;
    }
  },
};

export default tourService; 