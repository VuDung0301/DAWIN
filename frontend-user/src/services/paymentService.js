import api from './api';

export const paymentService = {
  // Tạo thanh toán mới
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Lấy thông tin thanh toán
  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response;
    } catch (error) {
      console.error(`Error getting payment with id ${id}:`, error);
      throw error;
    }
  },

  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: async (id) => {
    try {
      const response = await api.get(`/payments/${id}/check`);
      return response.data;
    } catch (error) {
      console.error(`Error checking payment status for id ${id}:`, error);
      throw error;
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (id, status) => {
    try {
      const response = await api.patch(`/payments/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating payment status for id ${id}:`, error);
      throw error;
    }
  },

  // Xác nhận thanh toán
  confirmPayment: async (id) => {
    try {
      const response = await api.post(`/payments/${id}/confirm`);
      return response;
    } catch (error) {
      console.error(`Error confirming payment with id ${id}:`, error);
      throw error;
    }
  },

  // Hủy thanh toán
  cancelPayment: async (id, reason) => {
    try {
      const response = await api.post(`/payments/${id}/cancel`, { reason });
      return response;
    } catch (error) {
      console.error(`Error cancelling payment with id ${id}:`, error);
      throw error;
    }
  },

  // Lấy các phương thức thanh toán có sẵn
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payment-methods');
      return response;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  },
  
  // Thanh toán qua cổng thanh toán
  processPaymentGateway: async (paymentId, gatewayType) => {
    try {
      const response = await api.post(`/payments/${paymentId}/process`, { 
        gateway: gatewayType // 'vnpay', 'momo', 'paypal'
      });
      return response;
    } catch (error) {
      console.error(`Error processing payment through ${gatewayType}:`, error);
      throw error;
    }
  },
};

export default paymentService; 