import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, FiShoppingCart, FiCalendar, FiUsers, FiCreditCard, 
  FiCheckCircle, FiAlertCircle, FiMapPin, FiClock, FiDollarSign,
  FiShield, FiLock, FiInfo, FiUser, FiMail, FiPhone, FiClipboard,
  FiHome
} from 'react-icons/fi';
import { tourService } from '../../services/tourService';
import { hotelService } from '../../services/hotelService';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const CheckoutPage = () => {
  const { type: paramType, id: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Lấy dữ liệu từ location.state nếu có
  const stateData = location.state || {};
  const type = stateData.type || paramType;
  const id = stateData.item?.id || paramId;
  const stateItem = stateData.item || null;
  const stateBookingData = stateData.bookingData || null;
  
  // Log dữ liệu state để debug
  useEffect(() => {
    if (stateItem) {
      console.log("State item data:", {
        type: type,
        name: stateItem.name,
        image: stateItem.image,
        hasImage: !!stateItem.image,
        id: stateItem.id,
        _id: stateItem._id,
        flightId: stateItem.flightId,
        flightNumber: stateItem.flightNumber
      });
    }
  }, [stateItem, type]);
  
  // Data từ query params
  const queryParams = new URLSearchParams(location.search);
  const startDate = stateItem?.date || queryParams.get('startDate');
  const endDate = queryParams.get('endDate');
  const guests = stateItem?.participants || parseInt(queryParams.get('guests') || '1');
  const rooms = parseInt(queryParams.get('rooms') || '1');
  
  // State cho dữ liệu
  const [product, setProduct] = useState(stateItem);
  const [loading, setLoading] = useState(!stateItem);
  const [error, setError] = useState(null);
  
  // State cho dữ liệu flight
  const [passengers, setPassengers] = useState(guests || 1);
  const [selectedClass, setSelectedClass] = useState(stateItem?.classType || 'economy');
  const [passengerInfo, setPassengerInfo] = useState([
    {
      title: 'Mr',
      firstName: '',
      lastName: '',
      dob: '',
      nationality: 'Vietnam',
      identification: ''
    }
  ]);
  
  // State cho form thanh toán
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
    paymentMethod: 'sepay', // sepay, card, momo, banking
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVC: '',
    agreeTerms: false
  });
  
  // State cho thanh toán
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Cập nhật form data khi user thay đổi
  useEffect(() => {
    if (currentUser) {
      console.log("Cập nhật form data với thông tin user:", currentUser);
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
      
      // Cũng cập nhật thông tin hành khách đầu tiên
      if (passengerInfo.length > 0 && currentUser.name) {
        const nameParts = currentUser.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setPassengerInfo(prev => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            firstName: firstName,
            lastName: lastName
          };
          return updated;
        });
      }
    }
  }, [currentUser]);
  
  // Load dữ liệu sản phẩm nếu chưa có từ state
  useEffect(() => {
    // Nếu đã có dữ liệu từ state, sử dụng dữ liệu đó
    if (stateItem) {
      console.log("Sử dụng dữ liệu từ state:", {
        type: type,
        id: id,
        name: stateItem.name,
        price: stateItem.price,
        priceDiscount: stateItem.priceDiscount,
        hasRoomTypes: stateItem.roomTypes && stateItem.roomTypes.length > 0
      });
      setProduct(stateItem);
      setLoading(false);
      return;
    }
    
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Kiểm tra ID và loại sản phẩm
        if (!id || !type) {
          setError('Thiếu thông tin cần thiết cho đặt chỗ');
          setLoading(false);
          return;
        }

        console.log(`Đang tải thông tin ${type} với ID: ${id}`);
        let data;
        
        if (type === 'tour') {
          const response = await tourService.getTourById(id);
          if (!response.success) {
            throw new Error(response.message || 'Không thể tải thông tin tour');
          }
          data = response.data;
        } else if (type === 'hotel') {
          const response = await hotelService.getHotelById(id);
          if (!response.success) {
            throw new Error(response.message || 'Không thể tải thông tin khách sạn');
          }
          data = response.data;
          
          // Kiểm tra cấu trúc dữ liệu khách sạn
          console.log("Dữ liệu khách sạn nhận được:", {
            name: data.name,
            hasRoomTypes: data.roomTypes && data.roomTypes.length > 0,
            roomTypesCount: data.roomTypes?.length || 0,
            pricePerNight: data.pricePerNight,
            firstRoomPrice: data.roomTypes && data.roomTypes.length > 0 
              ? data.roomTypes[0].price 
              : 'không có'
          });
          
          // Nếu không có thông tin giá, sử dụng giá mặc định
          if (!data.pricePerNight && (!data.roomTypes || data.roomTypes.length === 0)) {
            console.warn("Khách sạn không có thông tin giá, sử dụng giá mặc định");
            data.pricePerNight = 1000000; // Giá mặc định 1 triệu VNĐ
          }
          
          // Đảm bảo có roomTypes
          if (!data.roomTypes || !Array.isArray(data.roomTypes) || data.roomTypes.length === 0) {
            console.warn("Khách sạn không có roomTypes, tạo mặc định");
            data.roomTypes = [{
              _id: "default-room-type",
              name: "Phòng tiêu chuẩn",
              price: data.pricePerNight || 1000000,
              capacity: 2,
              available: 5,
              description: "Phòng tiêu chuẩn thoải mái"
            }];
          }
        } else if (type === 'flight') {
          // Xử lý đặt vé máy bay
          const response = await tourService.getTourById(id);
          if (!response.success) {
            throw new Error(response.message || 'Không thể tải thông tin vé máy bay');
          }
          data = response.data;
        } else {
          throw new Error('Loại sản phẩm không hợp lệ');
        }
        
        if (!data) {
          throw new Error(`Không tìm thấy ${type} với ID ${id}`);
        }
        
        console.log(`Đã tải thông tin ${type} thành công:`, data.name);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product data:', error);
        // Hiển thị thông báo lỗi chi tiết
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [type, id, stateItem]);
  
  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Xử lý thay đổi thông tin hành khách
  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengerInfo];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
    setPassengerInfo(updatedPassengers);
  };
  
  // Thêm hành khách mới
  const addPassenger = () => {
    if (passengerInfo.length < passengers) {
      setPassengerInfo([...passengerInfo, {
        title: 'Mr',
        firstName: '',
        lastName: '',
        dob: '',
        nationality: 'Vietnam',
        identification: ''
      }]);
    }
  };
  
  // Cập nhật số lượng hành khách
  const updatePassengerCount = (count) => {
    const newCount = parseInt(count);
    if (isNaN(newCount) || newCount < 1) return;
    
    setPassengers(newCount);
    
    // Nếu tăng số lượng hành khách, thêm thông tin hành khách mới
    if (newCount > passengerInfo.length) {
      const additionalPassengers = Array(newCount - passengerInfo.length).fill().map(() => ({
        title: 'Mr',
        firstName: '',
        lastName: '',
        dob: '',
        nationality: 'Vietnam',
        identification: ''
      }));
      setPassengerInfo([...passengerInfo, ...additionalPassengers]);
    } else if (newCount < passengerInfo.length) {
      // Nếu giảm số lượng hành khách, bớt thông tin hành khách
      setPassengerInfo(passengerInfo.slice(0, newCount));
    }
  };
  
  // Xử lý chuyển bước
  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản và điều kiện để tiếp tục.');
      return;
    }
    
    // Kiểm tra thông tin hành khách nếu là đặt vé máy bay
    if (type === 'flight') {
      const missingFields = [];
      
      for (let i = 0; i < passengerInfo.length; i++) {
        const passenger = passengerInfo[i];
        
        if (!passenger.title) missingFields.push(`Danh xưng của hành khách ${i+1}`);
        if (!passenger.firstName) missingFields.push(`Tên của hành khách ${i+1}`);
        if (!passenger.lastName) missingFields.push(`Họ của hành khách ${i+1}`);
        if (!passenger.dob) missingFields.push(`Ngày sinh của hành khách ${i+1}`);
        if (!passenger.nationality) missingFields.push(`Quốc tịch của hành khách ${i+1}`);
        if (!passenger.identification) missingFields.push(`CMND/CCCD/Hộ chiếu của hành khách ${i+1}`);
      }
      
      if (missingFields.length > 0) {
        alert(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
        return;
      }
      
      // Debug dữ liệu sản phẩm
      console.log('Product data:', {
        product,
        _id: product?._id,
        id: product?.id,
        flightId: product?.flightId,
        flightNumber: product?.flightNumber
      });
      console.log('State item data:', stateItem);
      
      // Không kiểm tra product._id nữa mà sử dụng ID từ nhiều nguồn khác nhau
    }
    
    setIsProcessing(true);
    
    try {
      // Chuẩn bị dữ liệu booking
      let bookingData = {};
      let bookingResponse;
      
      if (stateBookingData) {
        // Sử dụng dữ liệu booking từ state nếu có
        bookingData = {
          ...stateBookingData,
          contactInfo: {
            fullName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone
          },
          specialRequests: formData.specialRequests,
          paymentMethod: formData.paymentMethod
        };
        
        // Tạo các trường theo định dạng mà backend yêu cầu
        if (type === 'hotel') {
          bookingData.hotel = bookingData.hotelId;
          bookingData.room = bookingData.roomType;
          bookingData.checkIn = bookingData.checkInDate;
          bookingData.checkOut = bookingData.checkOutDate;
          bookingData.roomCount = bookingData.numOfRooms;

          // Tính số đêm
          const checkIn = new Date(bookingData.checkIn);
          const checkOut = new Date(bookingData.checkOut);
          const timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
          const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
          bookingData.nights = nights || 1;
          
          // Thêm thông tin giá
          bookingData.priceDetails = {
            roomPrice: (bookingData.totalPrice / 1.15).toFixed(0), // Giả định 15% thuế + phí
            tax: (bookingData.totalPrice * 0.1).toFixed(0),
            serviceFee: (bookingData.totalPrice * 0.05).toFixed(0)
          };
          
          // Log dữ liệu để debug
          console.log("Dữ liệu đặt phòng khách sạn:", bookingData);
        }
        
        // Thêm thông tin thẻ nếu thanh toán bằng thẻ
        if (formData.paymentMethod === 'card') {
          bookingData.paymentInfo = {
            cardNumber: formData.cardNumber,
            cardName: formData.cardName,
            cardExpiry: formData.cardExpiry,
            cardCVC: formData.cardCVC
          };
        }
      } else {
        // Tạo mới dữ liệu booking
        if (type === 'tour') {
          bookingData = {
            tourId: id,
            startDate: startDate,
            numOfPeople: guests,
            contactInfo: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone
            },
            specialRequests: formData.specialRequests,
          };
        } else if (type === 'hotel') {
          // Tính số đêm
          const checkIn = new Date(startDate);
          const checkOut = new Date(endDate);
          const timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
          const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Tính giá
          const totalInfo = calculateTotal();
          
          bookingData = {
            hotel: id, // ID khách sạn
            room: product.roomTypes?.[0]?._id || product.roomTypes?.[0]?.id, // ID phòng
            checkIn: startDate,
            checkOut: endDate,
            nights: nights || 1,
            roomCount: rooms,
            guests: {
              adults: guests,
              children: 0
            },
            contactInfo: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone
            },
            specialRequests: formData.specialRequests,
            totalPrice: totalInfo.totalPrice,
            priceDetails: {
              roomPrice: totalInfo.basePrice,
              tax: totalInfo.tax,
              serviceFee: totalInfo.serviceCharge
            },
            paymentMethod: formData.paymentMethod
          };
          
          // Log dữ liệu để debug
          console.log("Dữ liệu đặt phòng khách sạn:", bookingData);
        } else if (type === 'flight') {
          // Xử lý đặt vé máy bay
          const totalInfo = calculateTotal();
          
          bookingData = {
            // Thông tin cơ bản về chuyến bay
            flightId: stateItem?.flightId || stateItem?.flightNumber || '507f1f77bcf86cd799439011',
            flightDate: stateItem?.date || new Date().toISOString().split('T')[0],
            
            // Thông tin về hạng ghế và số hành khách
            seatClass: selectedClass || 'economy',
            numOfPassengers: parseInt(passengers || '1'),
            
            // Thông tin hành khách
            passengers: Array(parseInt(passengers || '1')).fill().map((_, idx) => {
              const passenger = passengerInfo[idx] || passengerInfo[0] || {
                title: 'Mr',
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                dob: '',
                nationality: 'Vietnam'
              };
              
              return {
                title: passenger.title,
                firstName: passenger.firstName,
                lastName: passenger.lastName,
                fullName: `${passenger.firstName} ${passenger.lastName}`,
                identification: passenger.identification || '000000000',
                dob: passenger.dob ? new Date(passenger.dob).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                gender: passenger.title === 'Mr' ? 'Male' : 'Female',
                type: 'adult',
                seatClass: selectedClass || 'economy'
              };
            }),
            
            // Thông tin liên hệ
            contactInfo: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone,
              identification: passengerInfo[0]?.identification || '000000000'
            },
            
            // Yêu cầu đặc biệt
            specialRequests: formData.specialRequests || 'Không có yêu cầu đặc biệt',
            
            // Thông tin giá và thanh toán
            totalPrice: totalInfo.totalPrice,
            status: 'pending',
            paymentMethod: formData.paymentMethod
          };
          
          // Log dữ liệu để debug
          console.log("Dữ liệu đặt vé máy bay mới:", bookingData);
        } else {
          throw new Error('Loại sản phẩm không hợp lệ');
        }
      }
      
      console.log("Đang tạo booking với dữ liệu:", bookingData);
      
      // Kiểm tra kết nối API trước khi gửi yêu cầu chính
      const testResult = await testApiConnection();
      console.log("Test API result:", testResult);
      
      // Gọi API tạo booking tùy theo loại sử dụng API mới
      if (type === 'tour') {
        bookingResponse = await bookingService.tourBookings.create(bookingData);
      } else if (type === 'hotel') {
        bookingResponse = await bookingService.hotelBookings.create(bookingData);
      } else if (type === 'flight') {
        bookingResponse = await bookingService.flightBookings.create(bookingData);
      } else {
        throw new Error('Loại sản phẩm không hợp lệ');
      }
      
      console.log("Kết quả tạo booking:", bookingResponse);
      
      // Kiểm tra kết quả trả về từ API
      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'Không thể tạo đặt chỗ');
      }
      
      // Xử lý kết quả
      if (bookingResponse.data && (bookingResponse.data._id || bookingResponse.data.id)) {
        const bookingResponseId = bookingResponse.data._id || bookingResponse.data.id;
        
        // Tạo thanh toán cho booking
        try {
          const totalAmount = calculateTotal().totalPrice;
          const paymentData = {
            bookingId: bookingResponseId,
            bookingType: type,
            amount: totalAmount,
            paymentMethod: formData.paymentMethod
          };
          
          console.log("Đang tạo thanh toán:", paymentData);
          
          const paymentResponse = await bookingService.payment.create(paymentData);
          console.log("Kết quả tạo thanh toán:", paymentResponse);
          
          if (paymentResponse.success && paymentResponse.data && paymentResponse.data._id) {
            // Xử lý theo phương thức thanh toán
            if (formData.paymentMethod === 'sepay') {
              // Chuyển hướng đến trang thanh toán SePay
              navigate(`/payment/${paymentResponse.data._id}`, {
                state: {
                  bookingId: bookingResponseId,
                  paymentId: paymentResponse.data._id,
                  amount: totalAmount,
                  productName: product.name,
                  type: type
                }
              });
              return; // Dừng lại vì đã chuyển hướng
            } else if (formData.paymentMethod === 'card') {
              // Xử lý thanh toán thẻ
              setTimeout(async () => {
                try {
                  await bookingService.payment.checkStatus(paymentResponse.data._id);
                } catch (confirmError) {
                  console.error("Lỗi khi kiểm tra trạng thái thanh toán:", confirmError);
                }
              }, 1500);
            } else if (['momo', 'vnpay', 'paypal'].includes(formData.paymentMethod)) {
              // Xử lý thanh toán qua cổng thanh toán khác
              try {
                // Redirect đến trang thanh toán nếu có URL
                if (paymentResponse.data.redirectUrl) {
                  window.location.href = paymentResponse.data.redirectUrl;
                  return; // Dừng lại vì đã chuyển hướng
                }
              } catch (gatewayError) {
                console.error("Lỗi khi xử lý thanh toán qua cổng:", gatewayError);
              }
            }
          } else {
            throw new Error(paymentResponse.message || 'Không thể tạo thanh toán');
          }
        } catch (paymentError) {
          console.error("Lỗi khi tạo thanh toán:", paymentError);
          // Vẫn tiếp tục flow đặt chỗ dù có lỗi thanh toán
        }
        
        setBookingSuccess(true);
        setBookingId(bookingResponseId);
        setCurrentStep(3);
      } else {
        throw new Error('Không nhận được ID đặt chỗ từ máy chủ');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Đã xảy ra lỗi khi đặt chỗ: ${error.message || 'Vui lòng thử lại sau.'}`);
      setIsProcessing(false);
    }
  };
  
  // Hàm test API connection - thêm vào cuối file
  const testApiConnection = async () => {
    try {
      const testData = {
        hotel: "test",
        room: "test",
        checkIn: new Date().toISOString(),
        checkOut: new Date().toISOString(),
        nights: 1,
        roomCount: 1,
        guests: {
          adults: 1,
          children: 0
        },
        contactInfo: {
          fullName: "Test User",
          email: "test@example.com",
          phone: "1234567890"
        },
        specialRequests: "Test request",
        totalPrice: 1000,
        priceDetails: {
          roomPrice: 800,
          tax: 100,
          serviceFee: 100
        },
        paymentMethod: "sepay"
      };

      try {
        // Test ping server
        console.log("Testing API connection...");
        const response = await api.get('/auth/check');
        console.log("API ping response:", response.data);
      } catch (pingError) {
        console.error("API ping error:", pingError);
      }

      console.log("Test successful");
      return { success: true };
    } catch (error) {
      console.error("Test API error:", error);
      return { success: false, message: error.message };
    }
  };
  
  // Tính tổng tiền
  const calculateTotal = () => {
    if (!product) return { basePrice: 0, tax: 0, serviceCharge: 0, totalPrice: 0 };
    
    let basePrice = 0;
    
    if (type === 'tour') {
      // Sử dụng giá đã giảm nếu có, không thì sử dụng giá gốc
      let finalPrice = product.price;
      if (product.priceDiscount && product.priceDiscount > 0) {
        finalPrice = product.priceDiscount;
      }
      
      const price = typeof finalPrice === 'number' ? finalPrice : 0;
      basePrice = price * guests;
      console.log(`Tính giá tour: ${price} (${product.priceDiscount ? 'giá đã giảm' : 'giá gốc'}) * ${guests} = ${basePrice}`);
    } else if (type === 'hotel') {
      // Đảm bảo có giá phòng mỗi đêm
      let pricePerNight = 0;
      
      // Nếu có dữ liệu từ selectedRoom (từ stateItem), sử dụng giá đó
      if (stateItem && stateItem.price) {
        pricePerNight = stateItem.price;
        console.log(`Sử dụng giá từ stateItem: ${pricePerNight}`);
      } 
      // Nếu không, kiểm tra dữ liệu từ product
      else if (product.roomTypes && product.roomTypes.length > 0) {
        // Lấy giá từ roomType đầu tiên
        const firstRoom = product.roomTypes[0];
        pricePerNight = firstRoom.price || product.pricePerNight || 0;
        console.log(`Sử dụng giá từ roomType: ${pricePerNight}`);
      } 
      // Nếu không có roomTypes, sử dụng pricePerNight
      else {
        pricePerNight = product.pricePerNight || 0;
        console.log(`Sử dụng giá từ pricePerNight: ${pricePerNight}`);
      }
      
      // Tính số đêm
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000);
      const nights = Math.max(1, Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));
      
      basePrice = pricePerNight * rooms * nights;
      console.log(`Tính giá khách sạn: ${pricePerNight} * ${rooms} phòng * ${nights} đêm = ${basePrice}`);
    } else if (type === 'flight') {
      // Xử lý tính giá vé máy bay
      if (stateItem && stateItem.price) {
        basePrice = stateItem.price;
        console.log(`Sử dụng giá từ stateItem: ${basePrice}`);
      } else if (product.price) {
        // Nếu giá là một đối tượng với các loại ghế khác nhau
        if (typeof product.price === 'object') {
          basePrice = product.price[selectedClass] || 0;
          console.log(`Sử dụng giá từ loại ghế ${selectedClass}: ${basePrice}`);
        } else {
          basePrice = product.price;
          console.log(`Sử dụng giá vé máy bay: ${basePrice}`);
        }
        
        // Nhân với số hành khách
        basePrice = basePrice * passengers;
        console.log(`Tính giá vé máy bay: ${basePrice / passengers} * ${passengers} hành khách = ${basePrice}`);
      }
    }
    
    // Đảm bảo basePrice là số
    basePrice = isNaN(basePrice) ? 0 : basePrice;
    
    const tax = basePrice * 0.1; // 10% thuế
    const serviceCharge = basePrice * 0.05; // 5% phí dịch vụ
    
    const result = {
      basePrice,
      tax,
      serviceCharge,
      totalPrice: basePrice + tax + serviceCharge
    };
    
    console.log("Kết quả tính giá:", result);
    return result;
  };
  
  // Format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Render bước 1: Thông tin đặt chỗ
  const renderBookingInfo = () => {
    return (
      <div className="space-y-8">
        {/* Thông tin hành khách đặc biệt cho vé máy bay */}
        {type === 'flight' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Thông tin hành khách</h2>
              {passengers > 1 && (
                <div className="flex items-center">
                  <label htmlFor="passengerCount" className="mr-2 text-sm">Số hành khách:</label>
                  <select
                    id="passengerCount"
                    value={passengers}
                    onChange={(e) => updatePassengerCount(e.target.value)}
                    className="input w-16"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {passengerInfo.map((passenger, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-3">Hành khách {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Danh xưng <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`title-${index}`}
                      value={passenger.title}
                      onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                      required
                      className="input w-full"
                    >
                      <option value="Mr">Ông (Mr)</option>
                      <option value="Mrs">Bà (Mrs)</option>
                      <option value="Ms">Cô (Ms)</option>
                      <option value="Child">Trẻ em (Child)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`firstName-${index}`}
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Tên"
                    />
                  </div>
                  <div>
                    <label htmlFor={`lastName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Họ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`lastName-${index}`}
                      value={passenger.lastName}
                      onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Họ"
                    />
                  </div>
                  <div>
                    <label htmlFor={`dob-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id={`dob-${index}`}
                      value={passenger.dob}
                      onChange={(e) => handlePassengerChange(index, 'dob', e.target.value)}
                      required
                      className="input w-full"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label htmlFor={`nationality-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Quốc tịch <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`nationality-${index}`}
                      value={passenger.nationality}
                      onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                      required
                      className="input w-full"
                    >
                      <option value="Vietnam">Việt Nam</option>
                      <option value="USA">Mỹ</option>
                      <option value="China">Trung Quốc</option>
                      <option value="Japan">Nhật Bản</option>
                      <option value="Korea">Hàn Quốc</option>
                      <option value="Thailand">Thái Lan</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`identification-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      CMND/CCCD/Hộ chiếu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`identification-${index}`}
                      value={passenger.identification || ''}
                      onChange={(e) => handlePassengerChange(index, 'identification', e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Nhập số CMND/CCCD/Hộ chiếu"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {passengers > passengerInfo.length && (
              <button
                type="button"
                onClick={addPassenger}
                className="btn btn-outline mt-2"
              >
                + Thêm hành khách
              </button>
            )}
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-bold mb-4">Thông tin liên hệ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="input w-full"
                placeholder="Nhập họ của bạn"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Tên
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="input w-full"
                placeholder="Nhập tên của bạn"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input w-full"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="input w-full"
                placeholder="0xxxxxxxxx"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
            Yêu cầu đặc biệt (không bắt buộc)
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            rows="3"
            className="input w-full"
            placeholder="Nhập yêu cầu đặc biệt của bạn"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleNextStep}
            className="btn btn-primary"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    );
  };
  
  // Render bước 2: Thông tin thanh toán
  const renderPaymentInfo = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="payment-sepay"
                name="paymentMethod"
                value="sepay"
                checked={formData.paymentMethod === 'sepay'}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="payment-sepay" className="ml-2 flex items-center">
                <span className="w-5 h-5 bg-teal-500 rounded-full mr-2"></span>
                <span>SePay (Khuyên dùng)</span>
              </label>
            </div>
           
          </div>
        </div>
        
        {formData.paymentMethod === 'sepay' && (
          <div className="bg-teal-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-4">
              SePay là phương thức thanh toán nhanh chóng và bảo mật. Bạn sẽ được chuyển đến trang thanh toán SePay sau khi xác nhận đặt chỗ.
            </p>
            <div className="bg-teal-100 p-3 rounded-lg border border-teal-200 text-teal-800">
              <p className="text-sm flex items-start">
                <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                Đây là phương thức thanh toán được khuyên dùng với nhiều ưu đãi và hoàn tiền.
              </p>
            </div>
          </div>
        )}
        
        {formData.paymentMethod === 'card' && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Số thẻ
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
            </div>
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ thẻ
              </label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="NGUYEN VAN A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày hết hạn (MM/YY)
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              <div>
                <label htmlFor="cardCVC" className="block text-sm font-medium text-gray-700 mb-1">
                  Mã bảo mật (CVC)
                </label>
                <input
                  type="text"
                  id="cardCVC"
                  name="cardCVC"
                  value={formData.cardCVC}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="CVC"
                  maxLength="3"
                />
              </div>
            </div>
          </div>
        )}
        
        {formData.paymentMethod === 'momo' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-4">
              Bạn sẽ được chuyển đến ứng dụng MoMo để hoàn tất thanh toán sau khi xác nhận đặt chỗ.
            </p>
            <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 text-pink-800">
              <p className="text-sm flex items-start">
                <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                Đảm bảo bạn đã cài đặt ứng dụng MoMo trên thiết bị của mình.
              </p>
            </div>
          </div>
        )}
        
        {formData.paymentMethod === 'banking' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-4">
              Vui lòng chuyển khoản đến tài khoản ngân hàng sau đây:
            </p>
            <div className="space-y-2 mb-4">
              <p><span className="font-medium">Ngân hàng:</span> Vietcombank</p>
              <p><span className="font-medium">Số tài khoản:</span> 1234567890</p>
              <p><span className="font-medium">Chủ tài khoản:</span> CÔNG TY DU LỊCH GO TOUR</p>
              <p><span className="font-medium">Nội dung:</span> {currentUser?.lastName || 'TEN'} {bookingId || 'BOOKING_ID'}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-800">
              <p className="text-sm flex items-start">
                <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                Đơn hàng của bạn sẽ được xác nhận sau khi chúng tôi nhận được thanh toán.
              </p>
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600"
            />
            <label htmlFor="agreeTerms" className="ml-2 text-gray-700 text-sm">
              Tôi đồng ý với <a href="#" className="text-primary-600 hover:underline">điều khoản và điều kiện</a> và <a href="#" className="text-primary-600 hover:underline">chính sách bảo mật</a>.
            </label>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              className="btn btn-outline"
            >
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !formData.agreeTerms}
              className="btn btn-primary"
            >
              {isProcessing ? 'Đang xử lý...' : 'Hoàn tất đặt chỗ'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render bước 3: Xác nhận đặt chỗ
  const renderConfirmation = () => {
    return (
      <div className="text-center py-8">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
          <FiCheckCircle className="text-5xl text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Đặt chỗ thành công!</h2>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã đặt chỗ với chúng tôi. Mã đặt chỗ của bạn là: <span className="font-bold">{bookingId}</span>
        </p>
        <p className="text-gray-600 mb-8">
          Chúng tôi đã gửi xác nhận đặt chỗ đến email của bạn. Vui lòng kiểm tra email để biết thêm chi tiết.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to={`/bookings/${bookingId}`} className="btn btn-primary">
            <FiClipboard className="mr-2" />
            Xem chi tiết đặt chỗ
          </Link>
          <Link to="/" className="btn btn-outline">
            <FiArrowLeft className="mr-2" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  };
  
  // Render bước hiện tại
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBookingInfo();
      case 2:
        return renderPaymentInfo();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };
  
  // Render thông tin sản phẩm
  const renderProductSummary = () => {
    if (!product) return null;
    
    const totalInfo = calculateTotal();
    
    // Hiển thị giá ngay cả khi có lỗi tính toán
    const safeFormat = (value) => {
      if (isNaN(value) || value === undefined || value === null) {
        console.warn("Giá trị không hợp lệ để format:", value);
        return formatCurrency(0);
      }
      return formatCurrency(value);
    };
    
    // Kiểm tra và lấy địa chỉ
    const location = type === 'tour' 
      ? (product.startLocation?.description || 'Chưa có thông tin')
      : (product.address || product.city || 'Chưa có thông tin');
    
    return (
      <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
        <h3 className="text-lg font-bold mb-4">Thông tin đặt chỗ</h3>
        
        {/* Hình ảnh sản phẩm */}
        <div className="mb-4 rounded-lg overflow-hidden">
          {/* Ưu tiên sử dụng ảnh từ stateItem nếu có */}
          <img
            src={stateItem?.image || product.coverImage || (product.images && product.images.length > 0 ? product.images[0] : '/images/hero-bg.jpg')}
            alt={product.name}
            className="w-full h-40 object-cover"
            onError={(e) => {
              // Đặt onerror thành null để tránh vòng lặp vô hạn
              e.target.onerror = null;
              console.log("Lỗi tải hình ảnh, sử dụng ảnh mặc định");
              // Sử dụng ảnh có sẵn trong thư mục public/images
              e.target.src = '/images/hero-bg.jpg';
            }}
          />
        </div>
        
        {/* Tên sản phẩm */}
        <h4 className="font-bold text-lg mb-4">{product.name}</h4>
        
        {/* Thông tin chi tiết */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <div className="flex items-center text-gray-600">
              <FiMapPin className="mr-2" />
              <span>{location}</span>
            </div>
            {type === 'tour' && (
              <div className="flex items-center text-gray-600">
                <FiClock className="mr-2" />
                <span>{product.duration || stateItem?.duration || 1} ngày</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center text-gray-600">
              <FiCalendar className="mr-2" />
              <span>{formatDate(startDate)}</span>
            </div>
            {type === 'hotel' && endDate && (
              <div className="flex items-center text-gray-600">
                <FiCalendar className="mr-2" />
                <span>{formatDate(endDate)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center text-gray-600">
              <FiUsers className="mr-2" />
              <span>{guests} khách</span>
            </div>
            {type === 'hotel' && (
              <div className="flex items-center text-gray-600">
                <FiHome className="mr-2" />
                <span>{rooms} phòng</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Chi tiết giá */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Giá gốc</span>
            <span>{safeFormat(totalInfo.basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Thuế (10%)</span>
            <span>{safeFormat(totalInfo.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phí dịch vụ (5%)</span>
            <span>{safeFormat(totalInfo.serviceCharge)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Tổng cộng</span>
            <span className="text-primary-600">{safeFormat(totalInfo.totalPrice)}</span>
          </div>
        </div>
        
        {/* Thông tin hỗ trợ */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-start text-sm text-gray-600 mb-3">
            <FiShield className="mr-2 mt-0.5 flex-shrink-0 text-green-500" />
            <span>Đảm bảo hoàn tiền nếu có vấn đề với đặt chỗ của bạn</span>
          </div>
          <div className="flex items-start text-sm text-gray-600 mb-3">
            <FiLock className="mr-2 mt-0.5 flex-shrink-0 text-green-500" />
            <span>Thanh toán an toàn và bảo mật với SSL</span>
          </div>
          <div className="bg-primary-50 p-3 rounded-lg mt-4">
            <p className="text-sm text-primary-700 flex items-start">
              <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
              Cần hỗ trợ? Gọi <a href="tel:1900123456" className="font-semibold">1900 123 456</a> hoặc gửi email đến <a href="mailto:support@dawin.vn" className="font-semibold">support@dawin.vn</a>
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  if (error) {
    return (
      <div className="container py-16 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/" className="btn btn-primary">
                Về trang chủ
              </Link>
              <button 
                onClick={() => window.history.back()} 
                className="btn btn-outline-secondary"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-16">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <Link to={type === 'tour' ? `/tours/${id}` : `/hotels/${id}`} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-2">
            <FiArrowLeft className="mr-2" />
            <span>Quay lại {type === 'tour' ? 'tour' : 'khách sạn'}</span>
          </Link>
          <h1 className="text-3xl font-bold">Thanh toán</h1>
        </div>
        
        {/* Các bước thanh toán */}
        {!bookingSuccess && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <FiUser />
                </div>
                <span className="text-sm font-medium">Thông tin</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <FiCreditCard />
                </div>
                <span className="text-sm font-medium">Thanh toán</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <FiCheckCircle />
                </div>
                <span className="text-sm font-medium">Xác nhận</span>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form thanh toán */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-soft p-6">
                {renderCurrentStep()}
              </div>
            </div>
            
            {/* Thông tin đặt chỗ */}
            <div className="lg:col-span-1">
              {renderProductSummary()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage; 