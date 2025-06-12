const axios = require('axios');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const TourBooking = require('../models/TourBooking');
const HotelBooking = require('../models/HotelBooking');
const FlightBooking = require('../models/FlightBooking');
const { SEPAY } = require('../config/constants');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @desc    Tạo thanh toán mới
 * @route   POST /api/payments
 * @access  Private
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { bookingId, bookingType, amount } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!bookingId || !bookingType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin thanh toán',
      });
    }
    
    // Kiểm tra booking có tồn tại không
    let booking;
    let bookingModel;
    
    switch (bookingType) {
      case 'tour':
        booking = await TourBooking.findById(bookingId);
        bookingModel = 'TourBooking';
        break;
      case 'hotel':
        booking = await HotelBooking.findById(bookingId);
        bookingModel = 'HotelBooking';
        break;
      case 'flight':
        booking = await FlightBooking.findById(bookingId);
        bookingModel = 'FlightBooking';
        break;
      default:
        booking = await Booking.findById(bookingId);
        bookingModel = 'Booking';
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      });
    }
    
    // Kiểm tra xem đã có thanh toán pending cho booking này chưa
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      bookingModel: bookingModel,
      status: 'pending'
    });
    
    if (existingPayment) {
      console.log(`Đã có thanh toán chờ xử lý cho booking ${bookingId}`);
      return res.status(200).json({
        success: true,
        message: 'Đã có thanh toán chờ xử lý cho booking này',
        data: existingPayment,
      });
    }
    
    // Kiểm tra xem đã có thanh toán completed cho booking này chưa
    const completedPayment = await Payment.findOne({
      booking: bookingId,
      bookingModel: bookingModel,
      status: 'completed'
    });
    
    if (completedPayment) {
      console.log(`Booking ${bookingId} đã được thanh toán trước đó`);
      return res.status(200).json({
        success: true,
        message: 'Booking này đã được thanh toán trước đó',
        data: completedPayment,
      });
    }
    
    // Tạo thanh toán mới với sepay là phương thức mặc định
    const payment = await Payment.create({
      booking: bookingId,
      bookingModel,
      amount,
      paymentMethod: 'sepay',
      createdBy: req.user.id,
      status: 'pending',
      paidBy: req.user.id,
    });
    
    // Cấu hình sepay - thêm timestamp để đảm bảo tính độc nhất
    const pattern = 'SEVQR';
    const orderType = bookingType.toUpperCase().substring(0, 3);
    const cleanedOrderId = bookingId.substring(bookingId.length - 6);
    const timestamp = Date.now().toString().substring(8, 13); // 5 chữ số cuối của timestamp
    
    // Tạo nội dung chuyển khoản theo định dạng SePay với timestamp
    const sePayReference = `${pattern} ${orderType}${cleanedOrderId}${timestamp}`;
    
    // Cấu hình SePay - sử dụng từ constants
    const accountNumber = SEPAY.ACCOUNT_NUMBER;
    const bankCode = SEPAY.BANK_CODE;
    
    // Tạo URL trực tiếp đến QR code của SePay
    const encodedContent = encodeURIComponent(sePayReference);
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${encodedContent}&template=compact`;
    
    const sePayTransactionId = uuidv4();
    
    payment.sePayInfo = {
      transactionId: sePayTransactionId,
      qrCodeUrl,
      reference: sePayReference
    };
    
    await payment.save();
    
    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thanh toán theo ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán',
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả thanh toán của người dùng
 * @route   GET /api/payments/me
 * @access  Private
 */
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ paidBy: req.user.id })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái thanh toán
 * @route   PUT /api/payments/:id/status
 * @access  Private/Admin
 */
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái thanh toán',
      });
    }
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán',
      });
    }
    
    payment.status = status;
    
    if (status === 'completed') {
      payment.paymentDate = Date.now();
      
      // Cập nhật trạng thái booking
      let booking;
      switch (payment.bookingModel) {
        case 'TourBooking':
          booking = await TourBooking.findById(payment.booking);
          break;
        case 'HotelBooking':
          booking = await HotelBooking.findById(payment.booking);
          break;
        case 'FlightBooking':
          booking = await FlightBooking.findById(payment.booking);
          break;
        default:
          booking = await Booking.findById(payment.booking);
      }
      
      if (booking) {
        booking.paymentStatus = 'Đã thanh toán';
        booking.bookingStatus = 'Xác nhận';
        await booking.save();
      }
    }
    
    await payment.save();
    
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kiểm tra trạng thái thanh toán
 * @route   GET /api/payments/:id/check
 * @access  Private
 */
exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán',
      });
    }
    
    // Kiểm tra tham số force để cưỡng chế cập nhật trạng thái
    const forceUpdate = req.query.force === 'true';
    
    // Nếu đã hoàn thành và không có yêu cầu cưỡng chế cập nhật, không cần kiểm tra nữa
    if (payment.status === 'completed' && !forceUpdate) {
      // Kiểm tra và đảm bảo booking cũng đã được cập nhật trạng thái
      await updateBookingStatus(payment);
      
      return res.status(200).json({
        success: true,
        data: payment,
      });
    }
    
    // In ra thông tin payment để debug
    console.log('Thông tin payment:', {
      id: payment._id,
      status: payment.status,
      reference: payment.sePayInfo?.reference,
      webhookReceived: payment.sePayInfo?.webhookReceived,
      amount: payment.amount
    });
    
    // Nếu webhook đã được nhận, cần kiểm tra xử lý
    if (payment.sePayInfo && payment.sePayInfo.webhookReceived) {
      // Xử lý dữ liệu webhook và cập nhật trạng thái nếu cần
      if (payment.status !== 'completed' || forceUpdate) {
        payment.status = 'completed';
        payment.paymentDate = payment.paymentDate || Date.now();
        
        // Cập nhật trạng thái booking
        await updateBookingStatus(payment);
        
        await payment.save();
        console.log('Đã cập nhật payment từ webhook data');
      }
    } else if (payment.sePayInfo && payment.sePayInfo.reference) {
      // Nếu chưa nhận được webhook, thử kiểm tra trạng thái từ SePay API
      try {
        const { checkPaymentStatus } = require('../services/sePayService');
        
        // Lấy reference từ sePayInfo để kiểm tra
        const reference = payment.sePayInfo.reference;
        console.log('Kiểm tra thanh toán với reference:', reference);
        
        const result = await checkPaymentStatus(reference);
        console.log('Kết quả kiểm tra từ SePay API:', result);
        
        // Kiểm tra nếu có lỗi kết nối
        if (result && ['CONNECTION_ERROR', 'TIMEOUT', 'NO_RESPONSE', 'API_ERROR', 'ERROR'].includes(result.status)) {
          console.log('Không thể kết nối đến SePay API:', result.message);
          // Vẫn trả về payment hiện tại mà không báo lỗi
          return res.status(200).json({
            success: true,
            data: payment,
            message: 'Không thể kết nối đến dịch vụ thanh toán để kiểm tra trạng thái'
          });
        }
        
        // Xử lý kết quả từ SePay API
        if (result && (result.status === 'SUCCESS' || result.paid === true)) {
          // Cập nhật thông tin thanh toán
          payment.status = 'completed';
          payment.paymentDate = result.transactionDate ? new Date(result.transactionDate) : Date.now();
          payment.sePayInfo.webhookData = result;
          
          // Cập nhật trạng thái booking
          await updateBookingStatus(payment);
          
          await payment.save();
          console.log('Đã cập nhật payment từ SePay API');
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái SePay:', error);
        // Không ảnh hưởng đến phản hồi API, chỉ ghi log lỗi và tiếp tục
        // Trả về payment hiện tại
        return res.status(200).json({
          success: true,
          data: payment,
          message: 'Không thể kết nối đến dịch vụ thanh toán để kiểm tra trạng thái'
        });
      }
    }
    
    // Cập nhật trạng thái booking nếu payment đã hoàn thành
    if (payment.status === 'completed') {
      await updateBookingStatus(payment);
    }
    
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    next(error);
  }
};

/**
 * Hàm helper để cập nhật trạng thái booking
 */
async function updateBookingStatus(payment) {
  try {
    if (!payment || !payment.booking) {
      console.log('Không có thông tin booking trong payment');
      return;
    }
    
    let booking;
    switch (payment.bookingModel) {
      case 'TourBooking':
        booking = await TourBooking.findById(payment.booking);
        if (booking && booking.paymentStatus !== 'paid') {
          console.log(`Đang cập nhật trạng thái TourBooking ${booking._id}`);
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          await booking.save();
          console.log(`Đã cập nhật trạng thái TourBooking ${booking._id} thành paid/confirmed`);
        }
        break;
      
      case 'HotelBooking':
        booking = await HotelBooking.findById(payment.booking);
        if (booking && booking.paymentStatus !== 'paid') {
          console.log(`Đang cập nhật trạng thái HotelBooking ${booking._id}`);
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          await booking.save();
          console.log(`Đã cập nhật trạng thái HotelBooking ${booking._id} thành paid/confirmed`);
        }
        break;
      
      case 'FlightBooking':
        booking = await FlightBooking.findById(payment.booking);
        if (booking && booking.paymentStatus !== 'paid') {
          console.log(`Đang cập nhật trạng thái FlightBooking ${booking._id}`);
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          await booking.save();
          console.log(`Đã cập nhật trạng thái FlightBooking ${booking._id} thành paid/confirmed`);
        }
        break;
      
      default:
        booking = await Booking.findById(payment.booking);
        if (booking && booking.paymentStatus !== 'Đã thanh toán') {
          console.log(`Đang cập nhật trạng thái Booking ${booking._id}`);
          booking.paymentStatus = 'Đã thanh toán';
          booking.bookingStatus = 'Xác nhận';
          await booking.save();
          console.log(`Đã cập nhật trạng thái Booking ${booking._id} thành Đã thanh toán/Xác nhận`);
        }
        break;
    }
    
    if (!booking) {
      console.log(`Không tìm thấy booking ${payment.booking} với model ${payment.bookingModel}`);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái booking:', error);
  }
}

/**
 * @desc    Xử lý webhook từ SePay
 * @route   POST /api/payments/webhook/sepay
 * @access  Public
 */
exports.handleSePayWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    console.log('Webhook SePay nhận được:', JSON.stringify(webhookData));
    
    // Lấy signature từ header
    const signatureHeader = req.headers['x-signature'] || req.headers['x-sepay-signature'];
    if (signatureHeader) {
      console.log('Signature từ header:', signatureHeader);
    }
    
    // Các tham số cần thiết từ webhookData
    let reference = null;
    let content = webhookData.content || '';
    let transferAmount = Number(webhookData.transferAmount) || 0;
    let referenceCode = webhookData.referenceCode || '';
    
    // Kiểm tra dữ liệu webhook từ SePay
    if (!content && !referenceCode) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu webhook không hợp lệ - không có nội dung hoặc mã tham chiếu',
      });
    }
    
    // Tìm reference theo các cách khác nhau
    if (webhookData.reference) {
      // Nếu có trực tiếp trường reference
      reference = webhookData.reference;
      console.log('Sử dụng reference trực tiếp:', reference);
    } else if (content) {
      // Phân tích nội dung webhook từ SePay
      // Tìm chuỗi reference từ content (thường là SEVQR + một chuỗi ký tự)
      const referenceRegex = /SEVQR\s+[A-Z0-9]+/i;
      const referenceMatch = content.match(referenceRegex);
      
      if (referenceMatch) {
        reference = referenceMatch[0];
        console.log('Mã tham chiếu tìm được từ nội dung:', reference);
      } else {
        console.log('Không tìm thấy mã tham chiếu trong nội dung, kiểm tra theo referenceCode');
      }
    }
    
    // Nếu không tìm thấy reference, trả về lỗi
    if (!reference && !referenceCode) {
      console.log('Không tìm thấy mã tham chiếu hợp lệ trong webhook');
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy mã tham chiếu trong nội dung chuyển khoản',
      });
    }
    
    // Tìm giao dịch tương ứng dựa trên reference hoặc referenceCode
    let payment;
    
    // Tìm theo reference nếu có
    if (reference) {
      payment = await Payment.findOne({
        'sePayInfo.reference': { $regex: new RegExp(reference.trim(), 'i') }
      });
      
      if (payment) {
        console.log(`Đã tìm thấy payment theo reference: ${payment._id}`);
      }
    }
    
    // Nếu không tìm thấy theo reference, thử tìm theo referenceCode
    if (!payment && referenceCode) {
      payment = await Payment.findOne({
        $or: [
          { 'sePayInfo.referenceCode': referenceCode },
          { 'sePayInfo.webhookData.referenceCode': referenceCode }
        ]
      });
      
      if (payment) {
        console.log(`Đã tìm thấy payment theo referenceCode: ${payment._id}`);
      }
    }
    
    // Nếu không tìm thấy payment
    if (!payment) {
      console.log('Không tìm thấy payment tương ứng');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán tương ứng',
      });
    }
    
    // Kiểm tra số tiền chuyển khoản có khớp với số tiền cần thanh toán không
    // Cho phép sai số +/- 1000 đồng để tránh lỗi làm tròn
    if (transferAmount > 0 && Math.abs(transferAmount - payment.amount) > 1000) {
      console.log(`Số tiền chuyển khoản (${transferAmount}) không khớp với số tiền thanh toán (${payment.amount})`);
      // Ghi nhận webhook nhưng không đánh dấu hoàn thành
      payment.sePayInfo.webhookReceived = true;
      payment.sePayInfo.webhookData = webhookData;
      payment.sePayInfo.amountMismatch = true;
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: 'Số tiền chuyển khoản không khớp với số tiền thanh toán',
        paymentId: payment._id
      });
    }
    
    // Cập nhật thông tin webhook
    payment.sePayInfo.webhookReceived = true;
    payment.sePayInfo.webhookData = webhookData;
    payment.sePayInfo.amountMismatch = false;
    
    // Nếu chưa có referenceCode, thêm vào
    if (!payment.sePayInfo.referenceCode && referenceCode) {
      payment.sePayInfo.referenceCode = referenceCode;
    }
    
    // Cập nhật trạng thái thanh toán
    payment.status = 'completed';
    payment.paymentDate = webhookData.transactionDate ? new Date(webhookData.transactionDate) : Date.now();
    
    // Cập nhật trạng thái booking
    await updateBookingStatus(payment);
    
    // Lưu payment
    await payment.save();
    console.log(`Đã cập nhật payment ${payment._id} thành completed từ webhook`);
    
    res.status(200).json({
      success: true,
      message: 'Webhook đã được xử lý thành công',
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Lỗi xử lý webhook SePay:', error);
    next(error);
  }
};

/**
 * @desc    Kiểm tra webhook một cách thủ công
 * @route   POST /api/payments/webhook/sepay/test
 * @access  Private/Admin
 */
exports.testWebhook = async (req, res, next) => {
  try {
    const { content, transferAmount, reference } = req.body;
    
    if (!content && !reference) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung chuyển khoản hoặc mã tham chiếu',
      });
    }
    
    let refToFind;
    
    // Nếu có reference trực tiếp, sử dụng nó
    if (reference) {
      refToFind = reference;
    } 
    // Nếu không, thử trích xuất từ nội dung
    else if (content) {
      const { extractReferenceFromContent } = require('../services/sePayService');
      refToFind = extractReferenceFromContent(content);
      
      if (!refToFind) {
        return res.status(400).json({
          success: false,
          message: 'Không thể trích xuất mã tham chiếu từ nội dung chuyển khoản',
        });
      }
    }
    
    console.log('Tìm thanh toán với reference:', refToFind);
    
    // Tìm payment tương ứng
    const payment = await Payment.findOne({
      'sePayInfo.reference': { $regex: new RegExp(refToFind.trim(), 'i') }
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán tương ứng với mã tham chiếu',
      });
    }
    
    // Mô phỏng dữ liệu webhook
    const mockWebhookData = {
      gateway: "VietinBank",
      transactionDate: new Date().toISOString(),
      accountNumber: SEPAY.ACCOUNT_NUMBER,
      content: content || `CT DEN: ${refToFind}`,
      transferType: "in",
      description: `Test webhook for ${refToFind}`,
      transferAmount: transferAmount || payment.amount,
      referenceCode: crypto.randomBytes(6).toString('hex').toUpperCase(),
      id: Date.now()
    };
    
    // Cập nhật payment
    payment.sePayInfo.webhookReceived = true;
    payment.sePayInfo.webhookData = mockWebhookData;
    payment.status = 'completed';
    payment.paymentDate = Date.now();
    
    // Cập nhật booking
    let booking;
    switch (payment.bookingModel) {
      case 'TourBooking':
        booking = await TourBooking.findById(payment.booking);
        break;
      case 'HotelBooking':
        booking = await HotelBooking.findById(payment.booking);
        break;
      case 'FlightBooking':
        booking = await FlightBooking.findById(payment.booking);
        break;
      default:
        booking = await Booking.findById(payment.booking);
    }
    
    if (booking) {
      booking.paymentStatus = 'Đã thanh toán';
      booking.bookingStatus = 'Xác nhận';
      await booking.save();
    }
    
    await payment.save();
    
    res.status(200).json({
      success: true,
      message: 'Đã xử lý thử nghiệm webhook thành công',
      paymentId: payment._id,
      mockData: mockWebhookData
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra webhook:', error);
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái thanh toán khẩn cấp (khi webhook không hoạt động)
 * @route   PUT /api/payments/:id/force-complete
 * @access  Private/Admin
 */
exports.forceUpdatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán',
      });
    }
    
    // Ghi log thao tác
    console.log(`Admin ${req.user.id} đang cập nhật cưỡng chế trạng thái thanh toán ${payment._id}`);
    
    // Tạo dữ liệu webhook giả
    const mockWebhookData = {
      gateway: req.body.gateway || "VietinBank",
      transactionDate: new Date().toISOString(),
      accountNumber: SEPAY.ACCOUNT_NUMBER,
      content: `FORCE UPDATE BY ADMIN: ${req.user.name || req.user.id}`,
      transferType: "in",
      description: req.body.description || `Cập nhật cưỡng chế bởi admin`,
      transferAmount: payment.amount,
      referenceCode: req.body.referenceCode || payment.sePayInfo?.referenceCode || crypto.randomBytes(6).toString('hex').toUpperCase(),
      id: Date.now()
    };
    
    // Cập nhật thông tin payment
    payment.status = 'completed';
    payment.paymentDate = Date.now();
    payment.sePayInfo.webhookReceived = true;
    payment.sePayInfo.webhookData = mockWebhookData;
    
    // Cập nhật trạng thái booking
    await updateBookingStatus(payment);
    
    // Lưu payment
    await payment.save();
    
    res.status(200).json({
      success: true,
      message: 'Đã cập nhật cưỡng chế trạng thái thanh toán thành công',
      data: payment,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật cưỡng chế thanh toán:', error);
    next(error);
  }
};

/**
 * @desc    Xóa thanh toán
 * @route   DELETE /api/payments/:id
 * @access  Private/Admin
 */
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán',
      });
    }
    
    // Kiểm tra nếu thanh toán đã hoàn thành thì không cho phép xóa
    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thanh toán đã hoàn thành',
      });
    }
    
    await Payment.deleteOne({ _id: payment._id });
    
    res.status(200).json({
      success: true,
      message: 'Thanh toán đã được xóa',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy hoặc tạo payment cho booking dựa trên loại và ID
 * @route   GET /api/payments/booking/:type/:id
 * @access  Private
 */
exports.getOrCreateBookingPayment = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const allowedTypes = ['tour', 'hotel', 'flight'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Loại booking không hợp lệ. Chỉ hỗ trợ: ${allowedTypes.join(', ')}`
    });
  }

  let booking;
  let bookingModel;

  // Lấy booking dựa trên loại
  if (type === 'tour') {
    booking = await TourBooking.findById(id).populate({
      path: 'user',
      strictPopulate: false
    });
    bookingModel = 'TourBooking';
  } else if (type === 'hotel') {
    booking = await HotelBooking.findById(id).populate({
      path: 'user',
      strictPopulate: false
    });
    bookingModel = 'HotelBooking';
  } else if (type === 'flight') {
    booking = await FlightBooking.findById(id).populate({
      path: 'user',
      strictPopulate: false
    });
    bookingModel = 'FlightBooking';
  }

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy thông tin đặt chỗ'
    });
  }

  // Kiểm tra trường hợp booking.userId hoặc booking.user không phải object
  // Vì có thể trường user đã được populate không thành công
  let userId;
  if (booking.user) {
    // Nếu user là ObjectId hoặc string
    if (typeof booking.user === 'string' || booking.user instanceof mongoose.Types.ObjectId) {
      userId = booking.user.toString();
    } 
    // Nếu user đã populate thành công
    else if (booking.user._id) {
      userId = booking.user._id.toString();
    }
  } else if (booking.userId) {
    // Trường hợp dùng userId thay vì user
    userId = booking.userId.toString();
  }

  // Kiểm tra quyền truy cập
  if ((!userId || userId !== req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập thông tin thanh toán này'
    });
  }

  // Kiểm tra xem đã có payment nào cho booking này chưa
  const existingPayment = await Payment.findOne({
    booking: id,
    bookingModel
  }).sort({ createdAt: -1 });

  // Nếu đã có payment và trạng thái là completed hoặc pending, trả về payment đó
  if (existingPayment && (existingPayment.status === 'completed' || existingPayment.status === 'pending')) {
    return res.status(200).json({
      success: true,
      data: existingPayment
    });
  }

  // Tạo reference duy nhất cho SePay
  const pattern = 'SEVQR';
  const orderType = type.toUpperCase().substring(0, 3);
  const cleanedOrderId = id.substring(id.length - 6);
  const timestamp = Date.now().toString().substring(8, 13); // 5 chữ số cuối của timestamp
  const sePayReference = `${pattern} ${orderType}${cleanedOrderId}${timestamp}`;

  // Cấu hình SePay từ constants
  const accountNumber = SEPAY.ACCOUNT_NUMBER;
  const bankCode = SEPAY.BANK_CODE;

  // Tạo URL trực tiếp đến QR code của SePay
  const encodedContent = encodeURIComponent(sePayReference);
  const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${booking.totalPrice}&des=${encodedContent}&template=compact`;

  const sePayTransactionId = uuidv4();

  // Tạo payment record
  const payment = await Payment.create({
    booking: id,
    bookingModel,
    amount: booking.totalPrice,
    paymentMethod: 'sepay',
    status: 'pending',
    paidBy: req.user.id,
    createdBy: req.user.id,
    sePayInfo: {
      transactionId: sePayTransactionId,
      qrCodeUrl,
      reference: sePayReference
    }
  });

  res.status(201).json({
    success: true,
    data: payment
  });
}); 