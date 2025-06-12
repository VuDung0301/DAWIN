import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaSave, 
  FaArrowLeft, 
  FaUpload, 
  FaTrash,
  FaWifi,
  FaUtensils,
  FaTv,
  FaPlug,
  FaUsb
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { flightsAPI } from '../../services/api';

const FlightFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [flight, setFlight] = useState({
    flightNumber: '',
    airline: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    price: {
      economy: 0,
      business: 0,
      firstClass: 0
    },
    seatsAvailable: {
      economy: 0,
      business: 0,
      firstClass: 0
    },
    duration: 0,
    status: 'Đúng giờ',
    features: {
      wifi: false,
      meals: true,
      entertainment: true,
      powerOutlets: false,
      usb: false
    },
    active: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchFlightData();
    }
  }, [id]);

  const fetchFlightData = async () => {
    setIsLoading(true);
    try {
      console.log('Đang tải dữ liệu chuyến bay với ID:', id);
      const response = await flightsAPI.getById(id);
      
      if (response.success) {
        const flightData = response.data;
        console.log('Dữ liệu chuyến bay nhận được:', flightData);
        
        // Đảm bảo dữ liệu có cấu trúc đúng
        const formattedData = {
          ...flightData,
          // Đảm bảo các đối tượng lồng nhau tồn tại
          price: flightData.price || {
            economy: 0,
            business: 0,
            firstClass: 0
          },
          seatsAvailable: flightData.seatsAvailable || {
            economy: 0,
            business: 0,
            firstClass: 0
          },
          features: flightData.features || {
            wifi: false,
            meals: true,
            entertainment: true,
            powerOutlets: false,
            usb: false
          }
        };
        
        setFlight(formattedData);
        
        // Hiển thị ảnh chuyến bay
        if (flightData.image) {
          setImagePreview(flightData.image);
        }
      } else {
        setError('Không thể tải thông tin chuyến bay: ' + (response.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý các trường lồng nhau
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFlight(prevFlight => ({
        ...prevFlight,
        [parent]: {
          ...prevFlight[parent],
          [child]: value
        }
      }));
    } else {
      setFlight(prevFlight => ({
        ...prevFlight,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFlight(prevFlight => ({
        ...prevFlight,
        [parent]: {
          ...prevFlight[parent],
          [child]: parseFloat(value) || 0
        }
      }));
    } else {
      setFlight(prevFlight => ({
        ...prevFlight,
        [name]: parseFloat(value) || 0
      }));
    }
  };

  const handleFeatureToggle = (feature) => {
    setFlight(prevFlight => ({
      ...prevFlight,
      features: {
        ...prevFlight.features,
        [feature]: !prevFlight.features[feature]
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const calculateDuration = () => {
    if (!flight.departureTime || !flight.arrivalTime) return;
    
    const departure = new Date(flight.departureTime);
    const arrival = new Date(flight.arrivalTime);
    
    if (departure && arrival && arrival > departure) {
      const diff = Math.round((arrival - departure) / (1000 * 60)); // Thời gian bay tính bằng phút
      setFlight(prevFlight => ({
        ...prevFlight,
        duration: diff
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Tạo đối tượng dữ liệu để gửi lên server
      let flightData;
      
      // Nếu có upload file ảnh, sử dụng FormData
      if (imageFile) {
        const formData = new FormData();
        
        // Thêm các trường đơn giản
        formData.append('flightNumber', flight.flightNumber);
        formData.append('airline', flight.airline);
        formData.append('departureCity', flight.departureCity);
        formData.append('arrivalCity', flight.arrivalCity);
        formData.append('departureTime', flight.departureTime);
        formData.append('arrivalTime', flight.arrivalTime);
        formData.append('duration', flight.duration.toString());
        formData.append('status', flight.status);
        formData.append('active', flight.active.toString());
        
        // Thêm các trường object (chuyển sang chuỗi JSON)
        formData.append('price', JSON.stringify(flight.price));
        formData.append('seatsAvailable', JSON.stringify(flight.seatsAvailable));
        formData.append('features', JSON.stringify(flight.features));
        
        // Thêm ảnh
        formData.append('image', imageFile);
        
        flightData = formData;
      } else {
        // Nếu không có file ảnh, gửi dữ liệu JSON thông thường
        flightData = {
          ...flight,
          // Chuyển đổi các giá trị số
          duration: Number(flight.duration),
          price: {
            economy: Number(flight.price.economy),
            business: Number(flight.price.business),
            firstClass: Number(flight.price.firstClass)
          },
          seatsAvailable: {
            economy: Number(flight.seatsAvailable.economy),
            business: Number(flight.seatsAvailable.business),
            firstClass: Number(flight.seatsAvailable.firstClass)
          }
        };
      }
      
      console.log('Gửi dữ liệu chuyến bay:', isEditMode ? 'CẬP NHẬT' : 'TẠO MỚI', flightData);
      
      let response;
      if (isEditMode) {
        response = await flightsAPI.update(id, flightData);
      } else {
        response = await flightsAPI.create(flightData);
      }
      
      if (response.success) {
        alert('Lưu chuyến bay thành công!');
        navigate('/flights');
      } else {
        setError(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error submitting flight:', error);
      setError(error.message || 'Đã xảy ra lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  // Format datetime-local input value
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa chuyến bay' : 'Thêm chuyến bay mới'}
          </h1>
          <button
            onClick={() => navigate('/flights')}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <FaArrowLeft className="mr-2" />
            Quay lại
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu chuyến bay *</label>
                <input
                  type="text"
                  name="flightNumber"
                  value={flight.flightNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="VN123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng hàng không *</label>
                <input
                  type="text"
                  name="airline"
                  value={flight.airline}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Vietnam Airlines"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố khởi hành *</label>
                <input
                  type="text"
                  name="departureCity"
                  value={flight.departureCity}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Hà Nội"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố đến *</label>
                <input
                  type="text"
                  name="arrivalCity"
                  value={flight.arrivalCity}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Hồ Chí Minh"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian khởi hành *</label>
                <input
                  type="datetime-local"
                  name="departureTime"
                  value={formatDateTimeForInput(flight.departureTime)}
                  onChange={(e) => {
                    handleChange(e);
                    setTimeout(calculateDuration, 100);
                  }}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đến *</label>
                <input
                  type="datetime-local"
                  name="arrivalTime"
                  value={formatDateTimeForInput(flight.arrivalTime)}
                  onChange={(e) => {
                    handleChange(e);
                    setTimeout(calculateDuration, 100);
                  }}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bay (phút) *</label>
                <input
                  type="number"
                  name="duration"
                  value={flight.duration}
                  onChange={handleNumberChange}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái *</label>
                <select
                  name="status"
                  value={flight.status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Đúng giờ">Đúng giờ</option>
                  <option value="Trễ">Trễ</option>
                  <option value="Hủy">Hủy</option>
                  <option value="Đã bay">Đã bay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hoạt động</label>
                <select
                  name="active"
                  value={flight.active.toString()}
                  onChange={(e) => {
                    setFlight(prev => ({
                      ...prev,
                      active: e.target.value === 'true'
                    }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Giá vé và số ghế */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Giá vé và số ghế</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Hạng phổ thông (Economy)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    name="price.economy"
                    value={flight.price.economy}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số ghế *</label>
                  <input
                    type="number"
                    name="seatsAvailable.economy"
                    value={flight.seatsAvailable.economy}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Hạng thương gia (Business)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    name="price.business"
                    value={flight.price.business}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số ghế *</label>
                  <input
                    type="number"
                    name="seatsAvailable.business"
                    value={flight.seatsAvailable.business}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Hạng nhất (First Class)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    name="price.firstClass"
                    value={flight.price.firstClass}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số ghế *</label>
                  <input
                    type="number"
                    name="seatsAvailable.firstClass"
                    value={flight.seatsAvailable.firstClass}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tiện ích */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Tiện ích</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div 
                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer 
                  ${flight.features.wifi ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 border border-gray-300'}`}
                onClick={() => handleFeatureToggle('wifi')}
              >
                <FaWifi className={`text-3xl mb-2 ${flight.features.wifi ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${flight.features.wifi ? 'text-indigo-600' : 'text-gray-700'}`}>WiFi</span>
              </div>
              
              <div 
                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer 
                  ${flight.features.meals ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 border border-gray-300'}`}
                onClick={() => handleFeatureToggle('meals')}
              >
                <FaUtensils className={`text-3xl mb-2 ${flight.features.meals ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${flight.features.meals ? 'text-indigo-600' : 'text-gray-700'}`}>Bữa ăn</span>
              </div>
              
              <div 
                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer 
                  ${flight.features.entertainment ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 border border-gray-300'}`}
                onClick={() => handleFeatureToggle('entertainment')}
              >
                <FaTv className={`text-3xl mb-2 ${flight.features.entertainment ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${flight.features.entertainment ? 'text-indigo-600' : 'text-gray-700'}`}>Giải trí</span>
              </div>
              
              <div 
                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer 
                  ${flight.features.powerOutlets ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 border border-gray-300'}`}
                onClick={() => handleFeatureToggle('powerOutlets')}
              >
                <FaPlug className={`text-3xl mb-2 ${flight.features.powerOutlets ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${flight.features.powerOutlets ? 'text-indigo-600' : 'text-gray-700'}`}>Ổ cắm điện</span>
              </div>
              
              <div 
                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer 
                  ${flight.features.usb ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100 border border-gray-300'}`}
                onClick={() => handleFeatureToggle('usb')}
              >
                <FaUsb className={`text-3xl mb-2 ${flight.features.usb ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${flight.features.usb ? 'text-indigo-600' : 'text-gray-700'}`}>Cổng USB</span>
              </div>
            </div>
          </div>
          
          {/* Hình ảnh */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh chuyến bay</label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Flight" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                )}
                
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaUpload className="w-8 h-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Chọn ảnh</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Lưu chuyến bay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default FlightFormPage; 