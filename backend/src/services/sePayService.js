/**
 * Service xử lý tương tác với SePay API
 */
const axios = require('axios');
const crypto = require('crypto');
const { SEPAY } = require('../config/constants');

/**
 * Tạo signature cho API SePay
 * @param {Object} data - Dữ liệu cần ký
 * @return {String} Chữ ký
 */
const createSignature = (data) => {
  // Sắp xếp keys theo thứ tự chữ cái
  const sortedKeys = Object.keys(data).sort();
  
  // Tạo chuỗi dữ liệu
  const signatureString = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  // Tạo HMAC và trả về base64
  const hmac = crypto.createHmac('sha256', SEPAY.SECRET_KEY);
  hmac.update(signatureString);
  return hmac.digest('base64');
};

/**
 * Xác thực webhook từ SePay
 * @param {Object} payload - Dữ liệu webhook
 * @param {String} signatureHeader - Chữ ký từ header
 * @return {Boolean} Kết quả xác thực
 */
const verifyWebhookSignature = (payload, signatureHeader) => {
  if (!signatureHeader) return false;
  
  try {
    // Sử dụng WEBHOOK_SECRET để xác thực webhook
    const hmac = crypto.createHmac('sha256', SEPAY.WEBHOOK_SECRET);
    
    // SePay thường gửi payload dưới dạng JSON string và ký toàn bộ string
    let dataToVerify;
    
    // Kiểm tra xem payload đã là string hay chưa
    if (typeof payload === 'string') {
      dataToVerify = payload;
    } else {
      // Đối với SePay, cách phổ biến là ký trực tiếp các trường quan trọng
      if (payload.transactionDate && payload.accountNumber && payload.transferAmount) {
        // Phương pháp 1: Ký các trường riêng lẻ
        dataToVerify = `${payload.transactionDate}|${payload.accountNumber}|${payload.transferAmount}`;
      } else {
        // Phương pháp 2: Ký toàn bộ payload
        dataToVerify = JSON.stringify(payload);
      }
    }
    
    // Tính toán signature
    hmac.update(dataToVerify);
    const signature = hmac.digest('base64');
    
    console.log('Tính toán signature cho webhook:', {
      input: dataToVerify,
      calculatedSignature: signature,
      receivedSignature: signatureHeader
    });
    
    // So sánh signature
    // Với các chuỗi ngắn, timingSafeEqual có thể gây lỗi nếu độ dài chuỗi khác nhau
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(signatureHeader)
      );
    } catch (err) {
      // Fallback nếu timingSafeEqual gặp lỗi
      return signature === signatureHeader;
    }
  } catch (error) {
    console.error('Lỗi xác thực webhook:', error);
    return false;
  }
};

/**
 * Tạo thanh toán QR code từ SePay
 * @param {Object} data - Dữ liệu thanh toán
 * @return {Promise<Object>} Kết quả từ SePay API
 */
const createSePayQRCode = async (data) => {
  try {
    const { amount, reference, description } = data;
    
    const requestData = {
      amount,
      reference,
      description: description || `Thanh toán ${reference}`,
      timestamp: Date.now(),
    };
    
    // Tạo signature
    const signature = createSignature(requestData);
    
    // Gọi API SePay
    const response = await axios.post(
      `${SEPAY.API_URL}/v1/qr/create`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': SEPAY.API_KEY,
          'X-Signature': signature,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo SePay QR code:', error);
    throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo QR code');
  }
};

/**
 * Kiểm tra trạng thái thanh toán trên SePay
 * @param {String} reference - Mã tham chiếu
 * @return {Promise<Object>} Kết quả từ SePay API
 */
const checkPaymentStatus = async (reference) => {
  try {
    const requestData = {
      reference,
      timestamp: Date.now(),
    };
    
    // Tạo signature
    const signature = createSignature(requestData);
    
    // Thêm timeout cho request
    const timeout = 5000; // 5 seconds
    
    console.log(`Đang kiểm tra trạng thái thanh toán với reference: ${reference}`);
    
    // Gọi API SePay với timeout
    const response = await axios.get(
      `${SEPAY.API_URL}/v1/payment/status`,
      {
        params: requestData,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': SEPAY.API_KEY,
          'X-Signature': signature,
        },
        timeout: timeout
      }
    );
    
    console.log(`Nhận kết quả từ SePay API: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    // Phân loại lỗi chi tiết
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout khi kết nối đến SePay API');
      return { status: 'TIMEOUT', message: 'Không thể kết nối đến SePay sau thời gian chờ' };
    } else if (error.code === 'ENOTFOUND') {
      console.error('Không thể kết nối đến SePay API:', error.message);
      return { status: 'CONNECTION_ERROR', message: 'Không thể kết nối đến máy chủ SePay' };
    } else if (error.response) {
      // Lỗi từ API (có response)
      console.error('SePay API trả về lỗi:', error.response.status, error.response.data);
      return { 
        status: 'API_ERROR', 
        httpStatus: error.response.status,
        message: error.response.data?.message || 'Lỗi từ SePay API'
      };
    } else if (error.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi
      console.error('Không nhận được phản hồi từ SePay API');
      return { status: 'NO_RESPONSE', message: 'Không nhận được phản hồi từ SePay' };
    } else {
      // Lỗi khác
      console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error.message);
      return { status: 'ERROR', message: 'Có lỗi xảy ra khi kiểm tra trạng thái thanh toán' };
    }
  }
};

/**
 * Phân tích mã tham chiếu từ nội dung chuyển khoản
 * @param {String} content - Nội dung chuyển khoản từ ngân hàng
 * @return {String|null} Mã tham chiếu hoặc null nếu không tìm thấy
 */
const extractReferenceFromContent = (content) => {
  if (!content) return null;
  
  // Tìm kiếm mẫu SEVQR + chuỗi ký tự/số
  const referenceRegex = /SEVQR\s+[A-Z0-9]+/i;
  const match = content.match(referenceRegex);
  
  return match ? match[0] : null;
};

module.exports = {
  createSignature,
  verifyWebhookSignature,
  createSePayQRCode,
  checkPaymentStatus,
  extractReferenceFromContent,
}; 