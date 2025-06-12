import axios from 'axios';
import { API_BASE_URL } from '@/constants/ApiConfig';
import * as SecureStore from 'expo-secure-store';

// Định nghĩa các interface cho payment
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
  });
};

/**
 * Tạo thanh toán mới
 * @param payment Thông tin thanh toán
 * @returns Promise với kết quả thanh toán
 */
export const createPayment = async (payment: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const api = await createAxiosInstance();
    const response = await api.post('/payments', payment);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi tạo thanh toán:', error);
    throw error;
  }
};

/**
 * Lấy thông tin thanh toán theo ID
 * @param paymentId ID của thanh toán
 * @returns Promise với thông tin thanh toán
 */
export const getPayment = async (paymentId: string): Promise<PaymentResponse> => {
  try {
    const api = await createAxiosInstance();
    const response = await api.get(`/payments/${paymentId}`);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin thanh toán:', error);
    throw error;
  }
};

/**
 * Lấy danh sách thanh toán của người dùng
 * @returns Promise với danh sách thanh toán
 */
export const getMyPayments = async (): Promise<PaymentResponse[]> => {
  try {
    const api = await createAxiosInstance();
    const response = await api.get('/payments/me');
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thanh toán:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 * @param paymentId ID của thanh toán
 * @returns Promise với thông tin thanh toán đã cập nhật
 */
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentResponse> => {
  try {
    const api = await createAxiosInstance();
    const response = await api.get(`/payments/${paymentId}/check`);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    throw error;
  }
};

/**
 * Lấy hoặc tạo thanh toán cho một booking
 * @param bookingType Loại booking (tour, hotel, flight)
 * @param bookingId ID của booking
 * @returns Promise với thông tin thanh toán
 */
export const getOrCreateBookingPayment = async (bookingType: string, bookingId: string): Promise<PaymentResponse> => {
  try {
    const api = await createAxiosInstance();
    const response = await api.get(`/payments/booking/${bookingType}/${bookingId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Lỗi khi lấy/tạo thanh toán cho booking ${bookingType}/${bookingId}:`, error);
    throw error;
  }
};

export default {
  createPayment,
  getPayment,
  getMyPayments,
  checkPaymentStatus,
  getOrCreateBookingPayment
}; 