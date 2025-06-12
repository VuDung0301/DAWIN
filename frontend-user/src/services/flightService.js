import api from './api';

export const flightService = {
  // Tìm kiếm chuyến bay
  searchFlights: async (searchParams) => {
    const response = await api.get('/flights', { params: searchParams });
    return response.data;
  },

  // Lấy chi tiết chuyến bay
  getFlightById: async (id) => {
    const response = await api.get(`/flights/${id}`);
    return response.data;
  },

  // Lấy tất cả chuyến bay
  getAllFlights: async (params = {}) => {
    const response = await api.get('/flights', { params });
    return response.data;
  },

  // Lấy chuyến bay theo hãng hàng không
  getFlightsByAirline: async (airline) => {
    const response = await api.get('/flights', { params: { airline } });
    return response.data;
  },

  // Lấy chuyến bay theo tuyến đường
  getFlightsByRoute: async (departureCity, arrivalCity) => {
    const response = await api.get('/flights', {
      params: { departureCity, arrivalCity }
    });
    return response.data;
  },

  // Lấy chuyến bay nội địa
  getDomesticFlights: async () => {
    const response = await api.get('/flights/domestic');
    return response.data;
  },

  // Lấy chuyến bay quốc tế
  getInternationalFlights: async () => {
    const response = await api.get('/flights/international');
    return response.data;
  },

  // Kiểm tra chỗ ngồi có sẵn
  checkAvailability: async (flightId, seatClass, passengers) => {
    const response = await api.get(`/flights/${flightId}/check-availability`, {
      params: { seatClass, passengers }
    });
    return response.data;
  },

  // Lấy danh sách các thành phố phổ biến
  getPopularCities: async () => {
    const response = await api.get('/flights/popular-cities');
    return response.data;
  },

  // Lấy danh sách các hãng hàng không
  getAirlines: async () => {
    const response = await api.get('/flights/airlines');
    return response.data;
  },
};

export default flightService; 