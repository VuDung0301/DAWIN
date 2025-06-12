import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaSave, 
  FaArrowLeft, 
  FaUpload, 
  FaTrash, 
  FaPlus, 
  FaMinus,
  FaImage
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { hotelsAPI } from '../../services/api';

const HotelFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [hotel, setHotel] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    stars: 3,
    pricePerNight: 0,
    priceDiscount: 0,
    category: 'thành phố',
    amenities: [],
    roomTypes: [],
    location: {
      type: 'Point',
      coordinates: [0, 0],
      description: ''
    },
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Miễn phí hủy trước 24 giờ. Sau đó, phí hủy là 100% giá trị đặt phòng.',
      additionalRules: []
    },
    nearbyAttractions: []
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [policyInput, setPolicyInput] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchHotelData();
    }
  }, [id]);

  const fetchHotelData = async () => {
    setIsLoading(true);
    try {
      const response = await hotelsAPI.getById(id);
      console.log('Dữ liệu khách sạn nhận từ API:', response);
      
      if (response.success) {
        const hotelData = response.data;
        setHotel(hotelData);
        
        // Lưu gallery hiện có
        if (hotelData.images && Array.isArray(hotelData.images)) {
          console.log(`Nhận được ${hotelData.images.length} ảnh trong gallery:`, hotelData.images);
          setExistingGallery(hotelData.images);
        } else {
          console.log('Không tìm thấy hoặc images không phải array:', hotelData.images);
          setExistingGallery([]);
        }
        
        // Hiển thị ảnh đại diện
        if (hotelData.coverImage) {
          setCoverImagePreview(hotelData.coverImage);
          console.log('Ảnh đại diện:', hotelData.coverImage);
        } else {
          console.log('Không tìm thấy ảnh đại diện');
        }
      } else {
        setError('Không thể tải thông tin khách sạn');
      }
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý các trường lồng nhau
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setHotel(prevHotel => ({
        ...prevHotel,
        [parent]: {
          ...prevHotel[parent],
          [child]: value
        }
      }));
    } else {
      setHotel(prevHotel => ({
        ...prevHotel,
        [name]: value
      }));
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.includes('image/')) {
        setError('Vui lòng chọn tệp hình ảnh hợp lệ');
        return;
      }
      
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      console.log('Đã chọn ảnh đại diện:', file.name, 'kích thước:', file.size, 'bytes');
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Kiểm tra từng file
      const validFiles = files.filter(file => {
        // Kiểm tra loại file
        if (!file.type.includes('image/')) {
          console.warn('Bỏ qua file không phải ảnh:', file.name);
          return false;
        }
        
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.warn('Bỏ qua file quá lớn:', file.name, file.size);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length === 0) {
        setError('Không có ảnh hợp lệ được chọn');
        return;
      }
      
      console.log(`Đã chọn ${validFiles.length} ảnh cho gallery`);
      setGalleryFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeGalleryPreview = (index) => {
    setGalleryPreviews(prevPreviews => 
      prevPreviews.filter((_, i) => i !== index)
    );
    setGalleryFiles(prevFiles => 
      prevFiles.filter((_, i) => i !== index)
    );
  };

  const removeExistingGalleryImage = (index) => {
    setExistingGallery(prevGallery => 
      prevGallery.filter((_, i) => i !== index)
    );
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setHotel(prevHotel => ({
        ...prevHotel,
        amenities: [...prevHotel.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index) => {
    setHotel(prevHotel => ({
      ...prevHotel,
      amenities: prevHotel.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleAddPolicy = () => {
    if (policyInput.trim()) {
      setHotel(prevHotel => ({
        ...prevHotel,
        policies: {
          ...prevHotel.policies,
          additionalRules: [...prevHotel.policies.additionalRules, policyInput.trim()]
        }
      }));
      setPolicyInput('');
    }
  };

  const handleRemovePolicy = (index) => {
    setHotel(prevHotel => ({
      ...prevHotel,
      policies: {
        ...prevHotel.policies,
        additionalRules: prevHotel.policies.additionalRules.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddRoomType = () => {
    setHotel(prevHotel => ({
      ...prevHotel,
      roomTypes: [
        ...prevHotel.roomTypes,
        {
          name: 'Phòng mới',
          description: '',
          price: 0,
          priceDiscount: 0,
          capacity: 2,
          amenities: [],
          images: [],
          available: 10
        }
      ]
    }));
  };

  const handleRemoveRoomType = (index) => {
    setHotel(prevHotel => ({
      ...prevHotel,
      roomTypes: prevHotel.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const handleRoomTypeChange = (index, field, value) => {
    setHotel(prevHotel => {
      const updatedRoomTypes = [...prevHotel.roomTypes];
      updatedRoomTypes[index] = {
        ...updatedRoomTypes[index],
        [field]: value
      };
      return {
        ...prevHotel,
        roomTypes: updatedRoomTypes
      };
    });
  };

  const handleAddNearbyAttraction = () => {
    setHotel(prevHotel => ({
      ...prevHotel,
      nearbyAttractions: [
        ...prevHotel.nearbyAttractions,
        {
          name: '',
          description: '',
          distance: '',
          image: ''
        }
      ]
    }));
  };

  const handleRemoveNearbyAttraction = (index) => {
    setHotel(prevHotel => ({
      ...prevHotel,
      nearbyAttractions: prevHotel.nearbyAttractions.filter((_, i) => i !== index)
    }));
  };

  const handleAttractionChange = (index, field, value) => {
    setHotel(prevHotel => {
      const updatedAttractions = [...prevHotel.nearbyAttractions];
      updatedAttractions[index] = {
        ...updatedAttractions[index],
        [field]: value
      };
      return {
        ...prevHotel,
        nearbyAttractions: updatedAttractions
      };
    });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'lat' || name === 'lng') {
      const index = name === 'lat' ? 1 : 0;
      setHotel(prevHotel => {
        const updatedCoordinates = [...prevHotel.location.coordinates];
        updatedCoordinates[index] = parseFloat(value) || 0;
        return {
          ...prevHotel,
          location: {
            ...prevHotel.location,
            coordinates: updatedCoordinates
          }
        };
      });
    } else if (name === 'locationDescription') {
      setHotel(prevHotel => ({
        ...prevHotel,
        location: {
          ...prevHotel.location,
          description: value
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Thêm thông tin cơ bản
      formData.append('name', hotel.name);
      formData.append('description', hotel.description);
      formData.append('address', hotel.address);
      formData.append('city', hotel.city);
      formData.append('stars', hotel.stars);
      formData.append('pricePerNight', hotel.pricePerNight);
      formData.append('category', hotel.category);
      
      if (hotel.priceDiscount) {
        formData.append('priceDiscount', hotel.priceDiscount);
      }
      
      // Xử lý thông tin location
      if (hotel.location) {
        formData.append('location', JSON.stringify({
          type: 'Point',
          coordinates: hotel.location.coordinates || [0, 0]
        }));
      }
      
      // Xử lý amenities
      if (hotel.amenities && hotel.amenities.length > 0) {
        formData.append('amenities', JSON.stringify(hotel.amenities));
      } else {
        formData.append('amenities', JSON.stringify(['Wifi', 'Máy lạnh', 'TV']));
      }
      
      // Xử lý policies
      if (hotel.policies) {
        formData.append('policies', JSON.stringify(hotel.policies));
      } else {
        formData.append('policies', JSON.stringify({
          checkIn: '14:00',
          checkOut: '12:00',
          cancellation: 'Miễn phí hủy trước 24 giờ. Sau đó, phí hủy là 100% giá trị đặt phòng.',
          additionalRules: []
        }));
      }
      
      // Xử lý roomTypes - QUAN TRỌNG: Đảm bảo có ít nhất một phòng
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        // Đảm bảo mỗi phòng có thông tin đầy đủ
        const roomTypesWithDefaults = hotel.roomTypes.map(room => ({
          name: room.name || 'Phòng tiêu chuẩn',
          price: Number(room.price) || Number(hotel.pricePerNight) || 1000000,
          priceDiscount: room.priceDiscount ? Number(room.priceDiscount) : 0,
          capacity: Number(room.capacity) || 2,
          available: Number(room.available) || 10,
          amenities: Array.isArray(room.amenities) ? room.amenities : ['Wifi', 'Máy lạnh', 'TV'],
          description: room.description || ''
        }));
        formData.append('roomTypes', JSON.stringify(roomTypesWithDefaults));
      } else {
        // Tạo phòng mặc định
        const defaultRoom = [{
          name: 'Phòng tiêu chuẩn',
          price: Number(hotel.pricePerNight) || 1000000,
          priceDiscount: 0,
          capacity: 2,
          available: 10,
          amenities: ['Wifi', 'Máy lạnh', 'TV'],
          description: 'Phòng tiêu chuẩn thoải mái'
        }];
        formData.append('roomTypes', JSON.stringify(defaultRoom));
      }
      
      // Xử lý nearbyAttractions
      if (hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0) {
        formData.append('nearbyAttractions', JSON.stringify(hotel.nearbyAttractions));
      } else {
        formData.append('nearbyAttractions', JSON.stringify([]));
      }
      
      // Thêm gallery hiện có
      if (existingGallery.length > 0) {
        formData.append('gallery', JSON.stringify(existingGallery));
      }
      
      // Thêm ảnh đại diện - QUAN TRỌNG
      if (coverImageFile) {
        formData.append('coverImageFile', coverImageFile);
      } else if (!isEditMode && !coverImagePreview) {
        setError('Vui lòng chọn ảnh đại diện cho khách sạn');
        setIsSubmitting(false);
        return;
      }
      
      // Thêm các ảnh gallery mới
      if (galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          formData.append('galleryFiles', galleryFiles[i]);
        }
      }
      
      // Kiểm tra dữ liệu trước khi gửi
      console.log('Dữ liệu gửi đi:', {
        fields: Array.from(formData.entries()).map(([key, value]) => {
          if (value instanceof File) {
            return `${key}: File - ${value.name}`;
          } else {
            return `${key}: ${value.substring ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : value}`;
          }
        })
      });
      
      let response;
      if (isEditMode) {
        response = await hotelsAPI.update(id, formData);
      } else {
        response = await hotelsAPI.create(formData);
      }
      
      if (response.success) {
        navigate('/hotels');
      } else {
        setError(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error submitting hotel:', error);
      setError(error.response?.data?.message || 'Đã xảy ra lỗi khi lưu dữ liệu');
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa khách sạn' : 'Thêm khách sạn mới'}
          </h1>
          <button
            onClick={() => navigate('/hotels')}
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
        
        <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
          {/* Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách sạn *</label>
                <input
                  type="text"
                  name="name"
                  value={hotel.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố *</label>
                <input
                  type="text"
                  name="city"
                  value={hotel.city}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                <input
                  type="text"
                  name="address"
                  value={hotel.address}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select
                  name="category"
                  value={hotel.category}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="nghỉ dưỡng">Nghỉ dưỡng</option>
                  <option value="thành phố">Thành phố</option>
                  <option value="ven biển">Ven biển</option>
                  <option value="núi">Núi</option>
                  <option value="gia đình">Gia đình</option>
                  <option value="doanh nhân">Doanh nhân</option>
                  <option value="cặp đôi">Cặp đôi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số sao *</label>
                <select
                  name="stars"
                  value={hotel.stars}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá theo đêm (VNĐ) *</label>
                <input
                  type="number"
                  name="pricePerNight"
                  value={hotel.pricePerNight}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi (VNĐ)</label>
                <input
                  type="number"
                  name="priceDiscount"
                  value={hotel.priceDiscount}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
              <textarea
                name="description"
                value={hotel.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>
          </div>
          
          {/* Hình ảnh */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện *</label>
              <div className="flex items-center space-x-4">
                {coverImagePreview && (
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                    <img src={coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImagePreview('');
                        setCoverImageFile(null);
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
                    <p className="mt-2 text-sm text-gray-500">Chọn ảnh đại diện</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bộ sưu tập ảnh</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Gallery ảnh hiện có */}
                {existingGallery.map((image, index) => (
                  <div key={`existing-${index}`} className="relative w-full h-32 border rounded-md overflow-hidden">
                    <img src={image} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Gallery ảnh mới */}
                {galleryPreviews.map((preview, index) => (
                  <div key={`preview-${index}`} className="relative w-full h-32 border rounded-md overflow-hidden">
                    <img src={preview} alt={`New Gallery ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryPreview(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Nút thêm ảnh */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaImage className="w-8 h-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Thêm ảnh</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          
          {/* Tiện nghi khách sạn */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Tiện nghi khách sạn</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="Nhập tiện nghi mới (VD: Wifi miễn phí, Hồ bơi, Gym...)"
                className="flex-1 p-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FaPlus className="mr-1" />
                Thêm
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {hotel.amenities && hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaMinus size={12} />
                  </button>
                </div>
              ))}
              
              {(!hotel.amenities || hotel.amenities.length === 0) && (
                <p className="text-gray-500">Chưa có tiện nghi nào. Hãy thêm một số tiện nghi cho khách sạn.</p>
              )}
            </div>
          </div>
          
          {/* Loại phòng */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Các loại phòng</h2>
              <button
                type="button"
                onClick={handleAddRoomType}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FaPlus className="mr-2" />
                Thêm loại phòng
              </button>
            </div>
            
            {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
              <div className="space-y-6">
                {hotel.roomTypes.map((roomType, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Loại phòng #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoomType(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên loại phòng *</label>
                        <input
                          type="text"
                          value={roomType.name || ''}
                          onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                          placeholder="VD: Phòng Deluxe, Phòng VIP..."
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
                        <input
                          type="number"
                          value={roomType.capacity || 2}
                          onChange={(e) => handleRoomTypeChange(index, 'capacity', parseInt(e.target.value))}
                          min="1"
                          max="20"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá/đêm (VNĐ) *</label>
                        <input
                          type="number"
                          value={roomType.price || 0}
                          onChange={(e) => handleRoomTypeChange(index, 'price', parseInt(e.target.value))}
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi (VNĐ)</label>
                        <input
                          type="number"
                          value={roomType.priceDiscount || ''}
                          onChange={(e) => handleRoomTypeChange(index, 'priceDiscount', parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng có sẵn</label>
                        <input
                          type="number"
                          value={roomType.available || 10}
                          onChange={(e) => handleRoomTypeChange(index, 'available', parseInt(e.target.value))}
                          min="0"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả loại phòng</label>
                      <textarea
                        value={roomType.description || ''}
                        onChange={(e) => handleRoomTypeChange(index, 'description', e.target.value)}
                        placeholder="Mô tả chi tiết về loại phòng này..."
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                    
                    {/* Tiện nghi riêng của phòng */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tiện nghi riêng của phòng</label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          placeholder="Nhập tiện nghi phòng (VD: Ban công, Bồn tắm, View biển...)"
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.target.value.trim();
                              if (value) {
                                const currentAmenities = roomType.amenities || [];
                                handleRoomTypeChange(index, 'amenities', [...currentAmenities, value]);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.parentElement.querySelector('input');
                            const value = input.value.trim();
                            if (value) {
                              const currentAmenities = roomType.amenities || [];
                              handleRoomTypeChange(index, 'amenities', [...currentAmenities, value]);
                              input.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {roomType.amenities && roomType.amenities.map((amenity, amenityIndex) => (
                          <div key={amenityIndex} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            <span>{amenity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentAmenities = roomType.amenities || [];
                                const newAmenities = currentAmenities.filter((_, i) => i !== amenityIndex);
                                handleRoomTypeChange(index, 'amenities', newAmenities);
                              }}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              <FaMinus size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Chưa có loại phòng nào được thêm.</p>
                <button
                  type="button"
                  onClick={handleAddRoomType}
                  className="flex items-center mx-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaPlus className="mr-2" />
                  Thêm loại phòng đầu tiên
                </button>
              </div>
            )}
          </div>
          
          {/* Chính sách khách sạn */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Chính sách khách sạn</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ nhận phòng</label>
                <input
                  type="time"
                  name="policies.checkIn"
                  value={hotel.policies?.checkIn || '14:00'}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ trả phòng</label>
                <input
                  type="time"
                  name="policies.checkOut"
                  value={hotel.policies?.checkOut || '12:00'}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách hủy phòng</label>
              <textarea
                name="policies.cancellation"
                value={hotel.policies?.cancellation || ''}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Mô tả chính sách hủy phòng..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quy định khác</label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={policyInput}
                  onChange={(e) => setPolicyInput(e.target.value)}
                  placeholder="Nhập quy định (VD: Không hút thuốc, Không thú cưng...)"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPolicy())}
                />
                <button
                  type="button"
                  onClick={handleAddPolicy}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaPlus className="mr-1" />
                  Thêm
                </button>
              </div>
              
              <div className="space-y-2">
                {hotel.policies?.additionalRules && hotel.policies.additionalRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePolicy(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
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
                  Lưu khách sạn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default HotelFormPage; 