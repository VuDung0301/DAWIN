/**
 * Các hằng số và cấu hình cho ứng dụng
 */

module.exports = {
  // Cấu hình SePay
  SEPAY: {
    API_URL: process.env.SEPAY_API_URL || 'https://api.sepay.vn',
    API_KEY: process.env.SEPAY_API_KEY || 'U3HXIBD6ETWHW7T4MCERSM1WGIUAHSXQO09EIGOKBS9N2ZJ7YZN8C3GPVZQULAC1',
    SECRET_KEY: process.env.SEPAY_SECRET_KEY || 'YOUR_SECRET_KEY',
    WEBHOOK_SECRET: process.env.SEPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET',
    PREFIX: process.env.SEPAY_PREFIX || 'SEVQR',
    ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER || '5730109917297',
    BANK_CODE: process.env.SEPAY_BANK_CODE || 'MBBank',
    BANK_NAME: process.env.SEPAY_BANK_NAME || 'Ngân hàng TMCP MBBank',
    ACCOUNT_NAME: process.env.SEPAY_ACCOUNT_NAME || 'CÔNG TY TNHH DU LỊCH DAWIN'
  },
  
  // Thông tin cấu hình thanh toán
  PAYMENT: {
    CURRENCY: 'VND',
    PAYMENT_METHODS: [
      { id: 'sepay', name: 'SePay', enabled: true }
    ],
    TRANSFER_PREFIX: process.env.TRANSFER_PREFIX || 'GT'
  }
}; 