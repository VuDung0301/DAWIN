import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/constants/ApiConfig';
import * as SecureStore from 'expo-secure-store';
import { fetchApi } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/ApiConfig';

// Định nghĩa kiểu dữ liệu
export interface PaymentRequest {
  bookingId: string;
  bookingType: 'tour' | 'hotel' | 'flight';
  amount: number;
  paymentMethod: string;
}

export interface PaymentResponse {
  _id: string;
  booking: string;
  bookingModel: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  bankTransferInfo?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch?: string;
    transferContent: string;
    qrCodeUrl?: string;
  };
  sePayInfo?: {
    transactionId: string;
    qrCodeUrl: string;
    reference: string;
    webhookReceived?: boolean;
  };
  transactionId?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Cấu hình API endpoints cho payment
if (!API_ENDPOINTS.PAYMENT) {
  API_ENDPOINTS.PAYMENT = {
    BASE: '/payments',
    DETAIL: (id: string) => `/payments/${id}`,
    CHECK_STATUS: (id: string) => `/payments/${id}/check`,
    MY_PAYMENTS: '/payments/me',
    WEBHOOK_SEPAY: '/payments/webhook/sepay'
  };
}

// Lấy token từ SecureStore
const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

// Tạo instance axios với authorization header
const createAxiosInstance = async () => {
  const token = await getToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    timeout: 10000, // Mặc định timeout 10s
  });
};

// API Functions cho Payment
export const paymentService = {
  // Tạo thanh toán mới
  createPayment: async (payment: PaymentRequest): Promise<PaymentResponse> => {
    try {
      console.log('Gọi API tạo thanh toán với dữ liệu:', JSON.stringify(payment));
      const response = await fetchApi(API_ENDPOINTS.PAYMENT.BASE, 'POST', payment);
      
      if (!response.success) {
        throw new Error(response.message || 'Không thể tạo thanh toán');
      }
      
      // Xử lý trường hợp backend trả về thanh toán đã tồn tại
      if (response.message && (
        response.message.includes('Đã có thanh toán chờ xử lý') || 
        response.message.includes('Booking này đã được thanh toán')
      )) {
        console.log('Sử dụng thanh toán đã tồn tại:', response.data);
      } else {
        console.log('Kết quả tạo thanh toán mới:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo thanh toán:', error);
      throw error;
    }
  },
  
  // Lấy thông tin thanh toán
  getPayment: async (paymentId: string): Promise<PaymentResponse> => {
    try {
      const response = await fetchApi(API_ENDPOINTS.PAYMENT.DETAIL(paymentId), 'GET');
      
      if (!response.success) {
        throw new Error(response.message || 'Không thể lấy thông tin thanh toán');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin thanh toán:', error);
      throw error;
    }
  },
  
  /**
   * Kiểm tra trạng thái thanh toán
   * @param paymentId ID của thanh toán
   * @returns Promise với thông tin thanh toán đã cập nhật
   */
  checkPaymentStatus: async (paymentId: string): Promise<PaymentResponse> => {
    try {
      const api = await createAxiosInstance();
      
      // Thêm timeout và cấu hình xử lý lỗi
      const response = await api.get(`/payments/${paymentId}/check`, {
        timeout: 8000, // 8 seconds timeout
        validateStatus: function (status: number) {
          // Chấp nhận mọi status code để xử lý bên trong
          return true;
        }
      });
      
      // Nếu request thành công và có dữ liệu
      if (response.status === 200 && response.data.success) {
        return response.data.data;
      }
      
      // Xử lý các status code khác
      console.log('Kết quả kiểm tra thanh toán không như mong đợi:', response.status, response.data);
      return response.data.data || null;
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      
      // Kiểm tra loại lỗi
      if (error.code === 'ECONNABORTED') {
        console.log('Timeout khi kiểm tra trạng thái thanh toán');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('Lỗi kết nối mạng khi kiểm tra trạng thái thanh toán');
      }
      
      // Trả về lỗi để component xử lý
      throw {
        error: true,
        message: 'Không thể kết nối đến dịch vụ thanh toán',
        originalError: error
      };
    }
  },
  
  // Lấy tất cả thanh toán của người dùng
  getMyPayments: async (): Promise<PaymentResponse[]> => {
    try {
      const response = await fetchApi(API_ENDPOINTS.PAYMENT.MY_PAYMENTS, 'GET');
      
      if (!response.success) {
        throw new Error(response.message || 'Không thể lấy danh sách thanh toán');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thanh toán:', error);
      throw error;
    }
  },
  
  // Thanh toán bằng SePay
  payWithSePay: async (paymentId: string): Promise<PaymentResponse> => {
    try {
      return await paymentService.getPayment(paymentId);
    } catch (error) {
      console.error('Lỗi khi thanh toán với SePay:', error);
      throw error;
    }
  }
}; 