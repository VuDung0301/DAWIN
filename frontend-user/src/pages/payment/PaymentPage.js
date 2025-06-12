import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiCreditCard, FiClock, FiShield, FiInfo, FiDownload, FiShare2, FiRefreshCw, FiCopy } from 'react-icons/fi';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';

const PaymentPage = () => {
  const { paymentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lấy thông tin từ state hoặc từ API
  const paymentInfo = location.state || {};
  
  const [loading, setLoading] = useState(!location.state);
  const [payment, setPayment] = useState(paymentInfo);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(paymentInfo.status || 'pending'); // pending, paid, failed, refunded
  const [countdown, setCountdown] = useState(300); // 5 phút countdown
  const [qrError, setQrError] = useState(false);

  // Load thông tin thanh toán
  useEffect(() => {
    if (!paymentId) {
      setError('Không tìm thấy mã thanh toán');
      return;
    }

    // Luôn gọi fetchPaymentInfo khi component mount để lấy dữ liệu mới nhất
    fetchPaymentInfo();
    
    // Kích hoạt kiểm tra trạng thái ngay lập tức và sau đó mỗi 10 giây
    const initialCheck = setTimeout(() => {
      checkPaymentStatus();
    }, 1500); // Đợi 1.5 giây sau khi fetch thông tin ban đầu
    
    return () => clearTimeout(initialCheck);
  }, [paymentId]);

  // Đếm ngược thời gian thanh toán
  useEffect(() => {
    if (paymentStatus === 'pending' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && paymentStatus === 'pending') {
      setPaymentStatus('failed');
      setError('Hết thời gian thanh toán. Vui lòng thử lại.');
    }
  }, [countdown, paymentStatus]);

  // Kiểm tra trạng thái thanh toán mỗi 10 giây
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentId) {
      const checkInterval = setInterval(() => {
        checkPaymentStatus();
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }
  }, [paymentStatus, paymentId]);

  // Hàm fetch thông tin thanh toán
  const fetchPaymentInfo = async () => {
    setLoading(true);
    try {
      // Lấy bookingType từ location.state nếu có
      const bookingType = location.state?.bookingType;
      
      const response = await paymentService.getPaymentById(paymentId);
      console.log('Thông tin thanh toán:', response.data);
      
      // Cập nhật dữ liệu thanh toán
      const paymentData = response.data?.data || response.data;
      
      // Lưu bookingType nếu có
      if (bookingType && !paymentData.bookingModel) {
        paymentData.bookingModel = `${bookingType}Booking`;
      }
      
      setPayment(paymentData);
      
      // Cập nhật trạng thái thanh toán dựa vào dữ liệu
      const status = paymentData.status || paymentData.paymentStatus;
      if (status === 'completed' || status === 'paid') {
        setPaymentStatus('paid');
      } else if (status === 'failed') {
        setPaymentStatus('failed');
        setError('Thanh toán đã bị hủy hoặc thất bại.');
      } else if (status === 'refunded') {
        setPaymentStatus('refunded');
        setError('Thanh toán đã được hoàn tiền.');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin thanh toán:', error);
      setError('Không thể tải thông tin thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async () => {
    try {
      console.log('Đang kiểm tra trạng thái thanh toán cho ID:', paymentId);
      const response = await paymentService.checkPaymentStatus(paymentId);
      console.log('Kết quả kiểm tra trạng thái thanh toán:', response);
      
      // Xử lý response dựa vào cấu trúc dữ liệu thực tế
      const paymentData = response.data || response;
      
      // Cập nhật dữ liệu nếu có
      if (paymentData) {
        setPayment(paymentData);
        
        // Cập nhật trạng thái
        const status = paymentData.status || paymentData.paymentStatus;
        
        if (status === 'completed' || status === 'paid') {
          setPaymentStatus('paid');
          
          // Chuyển hướng đến trang xác nhận sau 2 giây
          setTimeout(() => {
            // Xác định loại booking từ bookingModel
            const bookingType = paymentData.bookingModel 
              ? paymentData.bookingModel.toLowerCase().replace('booking', '') 
              : '';
              
            navigate(`/bookings/${paymentData.booking}`, {
              state: {
                paymentSuccess: true,
                paymentId: paymentId,
                bookingType: bookingType // Truyền loại booking
              }
            });
          }, 2000);
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          setError('Thanh toán đã bị hủy hoặc thất bại.');
        } else if (status === 'refunded') {
          setPaymentStatus('refunded');
          setError('Thanh toán đã được hoàn tiền.');
        }
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      // Không hiển thị lỗi cho người dùng khi kiểm tra status, chỉ log lỗi
    }
  };

  // Xử lý khi hình ảnh QR bị lỗi
  const handleQrError = () => {
    console.log('Lỗi tải ảnh QR');
    setQrError(true);
  };

  // Tải lại mã QR
  const refreshQrCode = () => {
    setQrError(false);
    fetchPaymentInfo();
    // Thông báo cho người dùng
    setTimeout(() => {
      if (payment?.sePayInfo?.qrCodeUrl) {
        // Đã tải lại thành công
      } else {
        // Vẫn không có mã QR
        alert('Không thể tải mã QR. Vui lòng thử lại sau hoặc sử dụng mã tham chiếu để thanh toán.');
      }
    }, 2000);
  };

  // Sao chép mã tham chiếu
  const copyReference = () => {
    if (payment?.sePayInfo?.reference) {
      navigator.clipboard.writeText(payment.sePayInfo.reference)
        .then(() => {
          alert('Đã sao chép mã tham chiếu!');
        })
        .catch(err => {
          console.error('Lỗi khi sao chép:', err);
        });
    }
  };

  // Mở ứng dụng SePay (chỉ hoạt động trên thiết bị di động)
  const openSePayApp = () => {
    if (payment?.sePayInfo?.reference) {
      // Tạo URL mở ứng dụng SePay với tham số cần thiết
      const url = `sepay://payment?ref=${payment.sePayInfo.reference}&amount=${payment.amount}&id=${payment.sePayInfo.transactionId || ''}`;
      window.location.href = url;

      // Hiển thị hướng dẫn nếu không mở được ứng dụng
      setTimeout(() => {
        alert('Nếu ứng dụng SePay không mở, vui lòng cài đặt ứng dụng SePay hoặc quét mã QR để thanh toán. Bạn cũng có thể sử dụng mã tham chiếu để thanh toán qua ứng dụng ngân hàng khác.');
      }, 2000);
    } else {
      alert('Không thể mở ứng dụng SePay. Vui lòng thử quét mã QR hoặc sử dụng mã tham chiếu.');
    }
  };

  // Tải mã QR
  const downloadQrCode = () => {
    if (payment?.sePayInfo?.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = payment.sePayInfo.qrCodeUrl;
      link.download = `sepay-qr-${paymentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Chia sẻ mã QR (sử dụng Web Share API nếu có hỗ trợ)
  const shareQrCode = () => {
    if (navigator.share && payment?.sePayInfo?.qrCodeUrl) {
      navigator.share({
        title: 'Mã QR thanh toán SePay',
        text: `Mã thanh toán: ${payment.sePayInfo.reference}`,
        url: payment.sePayInfo.qrCodeUrl
      }).catch(err => {
        console.error('Lỗi khi chia sẻ:', err);
      });
    } else {
      alert('Trình duyệt của bạn không hỗ trợ chức năng chia sẻ.');
    }
  };

  // Format tiền tệ
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Format thời gian đếm ngược
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-soft p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-soft p-8 text-center">
            <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/" className="btn btn-primary">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to={payment?.booking ? `/bookings/${payment.booking}` : '/bookings'} 
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-2"
              state={{ bookingType: payment?.bookingModel?.toLowerCase().replace('booking', '') }}
            >
              <FiArrowLeft className="mr-2" />
              <span>Quay lại</span>
            </Link>
            <h1 className="text-3xl font-bold">Thanh toán qua SePay</h1>
          </div>

          {/* Nội dung thanh toán */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            {/* Trạng thái thanh toán */}
            {paymentStatus === 'paid' ? (
              <div className="bg-green-50 p-8 text-center">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-600 mb-4">Thanh toán thành công!</h2>
                <p className="text-gray-600 mb-6">
                  Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận.
                </p>
                <p className="text-gray-600 mb-6">
                  Bạn sẽ được chuyển hướng đến trang xác nhận trong giây lát...
                </p>
              </div>
            ) : paymentStatus === 'failed' ? (
              <div className="bg-red-50 p-8 text-center">
                <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-600 mb-4">Thanh toán thất bại</h2>
                <p className="text-gray-600 mb-6">{error || 'Đã xảy ra lỗi khi xử lý thanh toán.'}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                  >
                    Thử lại
                  </button>
                  <Link to="/" className="btn btn-outline">
                    Quay lại trang chủ
                  </Link>
                </div>
              </div>
            ) : paymentStatus === 'refunded' ? (
              <div className="payment-status-container error">
                <div className="status-icon">
                  <FiRefreshCw size={40} />
                </div>
                <h2>Thanh toán đã hoàn tiền</h2>
                <p>Thanh toán của bạn đã được hoàn lại. Tiền sẽ được hoàn về tài khoản của bạn trong vòng 7 ngày làm việc.</p>
                <Link to="/bookings" className="btn btn-primary">
                  Xem đặt chỗ của tôi
                </Link>
              </div>
            ) : (
              <>
                {/* Thông tin đơn hàng */}
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold mb-4">Thông tin đơn hàng</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại đơn hàng:</span>
                      <span className="font-semibold">{payment.bookingModel === 'TourBooking' ? 'Tour du lịch' : 'Phòng khách sạn'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-mono">{payment.booking || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền thanh toán:</span>
                      <span className="font-bold text-lg text-primary-600">
                        {formatCurrency(payment.amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mã QR và thông tin thanh toán */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Thanh toán qua SePay</h2>
                    <div className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm font-medium flex items-center">
                      <FiClock className="mr-1" />
                      {formatCountdown(countdown)}
                    </div>
                  </div>

                  {/* Mã QR */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    {payment?.sePayInfo?.qrCodeUrl && !qrError ? (
                      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm mb-4">
                        <img 
                          src={payment.sePayInfo.qrCodeUrl} 
                          alt="Mã QR thanh toán SePay" 
                          className="w-64 h-64 object-contain"
                          onError={handleQrError}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-100 w-64 h-64 flex flex-col items-center justify-center border border-gray-200 rounded-lg mb-4">
                        <FiAlertCircle className="text-gray-500 text-3xl mb-4" />
                        <p className="text-gray-500 text-center px-4">
                          Không thể tải mã QR. Vui lòng làm mới hoặc sử dụng mã tham chiếu.
                        </p>
                        <button 
                          onClick={refreshQrCode} 
                          className="mt-4 flex items-center text-primary-600 px-3 py-1 rounded-md border border-primary-600"
                        >
                          <FiRefreshCw className="mr-1" /> Làm mới
                        </button>
                      </div>
                    )}

                    <p className="text-center text-gray-700 font-medium mb-4">
                      {payment?.sePayInfo?.qrCodeUrl && !qrError 
                        ? "Quét mã QR bằng ứng dụng SePay hoặc ứng dụng ngân hàng" 
                        : "Vui lòng sử dụng mã tham chiếu để thanh toán"}
                    </p>

                    {/* Các nút hành động */}
                    <div className="flex space-x-3 mb-6">
                      <button 
                        onClick={downloadQrCode}
                        className="flex items-center bg-blue-50 text-blue-600 px-3 py-2 rounded-md border border-blue-200"
                        disabled={!payment?.sePayInfo?.qrCodeUrl || qrError}
                      >
                        <FiDownload className="mr-1" /> Lưu QR
                      </button>
                      <button 
                        onClick={shareQrCode}
                        className="flex items-center bg-green-50 text-green-600 px-3 py-2 rounded-md border border-green-200"
                        disabled={!payment?.sePayInfo?.qrCodeUrl || qrError || !navigator.share}
                      >
                        <FiShare2 className="mr-1" /> Chia sẻ
                      </button>
                      <button 
                        onClick={openSePayApp}
                        className="flex items-center bg-teal-50 text-teal-600 px-3 py-2 rounded-md border border-teal-200"
                        disabled={!payment?.sePayInfo?.reference}
                      >
                        <FiCreditCard className="mr-1" /> Mở SePay
                      </button>
                    </div>
                    
                    {/* Mã tham chiếu */}
                    {payment?.sePayInfo && payment.sePayInfo.reference && (
                      <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                          Mã tham chiếu thanh toán:
                        </p>
                        <div className="flex items-center">
                          <span className="flex-1 font-mono text-lg text-primary-600 font-semibold mr-2">
                            {payment.sePayInfo.reference}
                          </span>
                          <button 
                            onClick={copyReference}
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="Sao chép mã"
                          >
                            <FiCopy />
                          </button>
                        </div>
                        {payment.sePayInfo.webhookReceived && (
                          <div className="mt-2 flex items-center text-green-600 text-sm">
                            <FiCheckCircle className="mr-1" /> 
                            Đã nhận xác nhận thanh toán từ SePay
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hướng dẫn thanh toán */}
                  <div className="space-y-6">
                    <div className="bg-teal-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <FiInfo className="text-teal-500 mr-2" />
                        Hướng dẫn thanh toán
                      </h3>
                      <ol className="text-gray-700 list-decimal pl-5 space-y-2">
                        <li>Mở ứng dụng ngân hàng trên điện thoại của bạn</li>
                        <li>Chọn chức năng "Quét QR" và quét mã QR trên màn hình</li>
                        <li>Hoặc chuyển khoản đến thông tin tài khoản trong mã QR</li>
                        <li>Nhập đúng nội dung chuyển khoản: <span className="font-semibold">{payment.sePayInfo?.reference || ''}</span></li>
                        <li>Sau khi thanh toán thành công, trang này sẽ tự động cập nhật</li>
                      </ol>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <FiShield className="text-primary-500 mr-2" />
                        Bảo mật thanh toán
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Thông tin thanh toán của bạn được bảo vệ bằng công nghệ mã hóa SSL 256-bit. Chúng tôi không lưu trữ thông tin thẻ của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Thông tin liên hệ */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ: <a href="mailto:support@dawin.vn" className="text-primary-600">support@dawin.vn</a> hoặc gọi <a href="tel:1900123456" className="text-primary-600">1900 123 456</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 