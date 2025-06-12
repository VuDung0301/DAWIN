import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaSave, 
  FaArrowLeft, 
  FaUpload, 
  FaTrash, 
  FaPlus, 
  FaMinus,
  FaImage,
  FaMapMarkerAlt
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { toursAPI } from '../../services/api';

const TourFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [tour, setTour] = useState({
    name: '',
    description: '',
    duration: 1,
    maxGroupSize: 10,
    difficulty: 'trung bình',
    price: 0,
    priceDiscount: 0,
    startDates: [],
    locations: [],
    itinerary: [],
    startLocation: {
      type: 'Point',
      coordinates: [0, 0],
      address: '',
      description: ''
    },
    includes: [],
    excludes: []
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // State cho các trường nhập liệu
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [activityInputs, setActivityInputs] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      fetchTourData();
    }
  }, [id]);

  const fetchTourData = async () => {
    setIsLoading(true);
    try {
      const response = await toursAPI.getById(id);
      if (response.success) {
        const tourData = response.data;
        setTour(tourData);
        
        // Lưu gallery hiện có
        if (tourData.images && Array.isArray(tourData.images)) {
          setExistingGallery(tourData.images);
        }
        
        // Hiển thị ảnh đại diện
        if (tourData.coverImage) {
          setCoverImagePreview(tourData.coverImage);
        }
      } else {
        setError('Không thể tải thông tin tour');
      }
    } catch (error) {
      console.error('Error fetching tour data:', error);
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
      setTour(prevTour => ({
        ...prevTour,
        [parent]: {
          ...prevTour[parent],
          [child]: value
        }
      }));
    } else {
      setTour(prevTour => ({
        ...prevTour,
        [name]: value
      }));
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setGalleryFiles(prevFiles => [...prevFiles, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
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

  // Xử lý thêm/xóa từ các danh sách
  const handleAddInclude = () => {
    if (includeInput.trim()) {
      setTour(prevTour => ({
        ...prevTour,
        includes: [...prevTour.includes, includeInput.trim()]
      }));
      setIncludeInput('');
    }
  };

  const handleRemoveInclude = (index) => {
    setTour(prevTour => ({
      ...prevTour,
      includes: prevTour.includes.filter((_, i) => i !== index)
    }));
  };

  const handleAddExclude = () => {
    if (excludeInput.trim()) {
      setTour(prevTour => ({
        ...prevTour,
        excludes: [...prevTour.excludes, excludeInput.trim()]
      }));
      setExcludeInput('');
    }
  };

  const handleRemoveExclude = (index) => {
    setTour(prevTour => ({
      ...prevTour,
      excludes: prevTour.excludes.filter((_, i) => i !== index)
    }));
  };

  const handleAddStartDate = () => {
    if (startDateInput) {
      setTour(prevTour => ({
        ...prevTour,
        startDates: [...prevTour.startDates, new Date(startDateInput)]
      }));
      setStartDateInput('');
    }
  };

  const handleRemoveStartDate = (index) => {
    setTour(prevTour => ({
      ...prevTour,
      startDates: prevTour.startDates.filter((_, i) => i !== index)
    }));
  };

  // Xử lý các điểm tham quan trong hành trình
  const handleAddLocation = () => {
    setTour(prevTour => ({
      ...prevTour,
      locations: [
        ...prevTour.locations,
        {
          type: 'Point',
          coordinates: [0, 0],
          address: '',
          description: '',
          day: prevTour.locations.length + 1
        }
      ]
    }));
  };

  const handleRemoveLocation = (index) => {
    setTour(prevTour => ({
      ...prevTour,
      locations: prevTour.locations.filter((_, i) => i !== index)
    }));
  };

  const handleLocationChange = (index, field, value) => {
    setTour(prevTour => {
      const updatedLocations = [...prevTour.locations];
      if (field === 'lat' || field === 'lng') {
        const coordIndex = field === 'lat' ? 1 : 0;
        updatedLocations[index].coordinates[coordIndex] = parseFloat(value) || 0;
      } else {
        updatedLocations[index][field] = value;
      }
      return {
        ...prevTour,
        locations: updatedLocations
      };
    });
  };

  // Xử lý lịch trình theo ngày
  const handleAddItinerary = () => {
    setTour(prevTour => ({
      ...prevTour,
      itinerary: [
        ...prevTour.itinerary,
        {
          day: prevTour.itinerary.length + 1,
          title: `Ngày ${prevTour.itinerary.length + 1}`,
          description: '',
          activities: [],
          accommodation: '',
          meals: {
            breakfast: false,
            lunch: false,
            dinner: false
          },
          image: ''
        }
      ]
    }));
  };

  const handleRemoveItinerary = (index) => {
    setTour(prevTour => ({
      ...prevTour,
      itinerary: prevTour.itinerary.filter((_, i) => i !== index)
    }));
  };

  const handleItineraryChange = (index, field, value) => {
    setTour(prevTour => {
      const updatedItinerary = [...prevTour.itinerary];
      
      if (field.includes('meals.')) {
        const mealType = field.split('.')[1];
        updatedItinerary[index].meals[mealType] = value;
      } else {
        updatedItinerary[index][field] = value;
      }
      
      return {
        ...prevTour,
        itinerary: updatedItinerary
      };
    });
  };

  const handleItineraryImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Tạo URL tạm thời để hiển thị preview
    const imageUrl = URL.createObjectURL(file);
    
    // Cập nhật ảnh cho ngày cụ thể trong itinerary
    setTour(prevTour => {
      const updatedItinerary = [...prevTour.itinerary];
      updatedItinerary[index] = {
        ...updatedItinerary[index],
        image: imageUrl,
        imageFile: file // Lưu file để gửi lên server sau
      };
      return {
        ...prevTour,
        itinerary: updatedItinerary
      };
    });
  };

  const handleAddActivity = (itineraryIndex, activity) => {
    if (activity && activity.trim()) {
      setTour(prevTour => {
        const updatedItinerary = [...prevTour.itinerary];
        updatedItinerary[itineraryIndex].activities.push(activity.trim());
        return {
          ...prevTour,
          itinerary: updatedItinerary
        };
      });
    }
  };

  const handleRemoveActivity = (itineraryIndex, activityIndex) => {
    setTour(prevTour => {
      const updatedItinerary = [...prevTour.itinerary];
      updatedItinerary[itineraryIndex].activities = 
        updatedItinerary[itineraryIndex].activities.filter((_, i) => i !== activityIndex);
      return {
        ...prevTour,
        itinerary: updatedItinerary
      };
    });
  };

  const handleStartLocationChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'startLocation.lat' || name === 'startLocation.lng') {
      const index = name === 'startLocation.lat' ? 1 : 0;
      setTour(prevTour => {
        const updatedCoordinates = [...prevTour.startLocation.coordinates];
        updatedCoordinates[index] = parseFloat(value) || 0;
        return {
          ...prevTour,
          startLocation: {
            ...prevTour.startLocation,
            coordinates: updatedCoordinates
          }
        };
      });
    } else if (name.startsWith('startLocation.')) {
      const field = name.split('.')[1];
      setTour(prevTour => ({
        ...prevTour,
        startLocation: {
          ...prevTour.startLocation,
          [field]: value
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Kiểm tra giá và giá giảm trước khi gửi
      const price = parseFloat(tour.price);
      const priceDiscount = parseFloat(tour.priceDiscount || 0);
      
      if (priceDiscount && priceDiscount >= price) {
        setError('Giá khuyến mãi phải nhỏ hơn giá gốc');
        setIsSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      
      // Thêm thông tin cơ bản
      // Xử lý từng trường riêng biệt để đảm bảo đúng định dạng
      formData.append('name', tour.name);
      formData.append('description', tour.description);
      formData.append('duration', tour.duration);
      formData.append('maxGroupSize', tour.maxGroupSize);
      formData.append('difficulty', tour.difficulty);
      formData.append('price', price.toString());
      
      // Chỉ thêm giá giảm nếu có và hợp lệ
      if (priceDiscount && priceDiscount > 0 && priceDiscount < price) {
        formData.append('priceDiscount', priceDiscount.toString());
      }
      
      // Xử lý các trường là object
      if (tour.startLocation) {
        formData.append('startLocation', JSON.stringify(tour.startLocation));
      }
      
      if (tour.locations && tour.locations.length > 0) {
        formData.append('locations', JSON.stringify(tour.locations));
      }
      
      // Chuẩn bị itinerary để gửi lên server
      if (tour.itinerary && tour.itinerary.length > 0) {
        // Tạo bản sao của itinerary để loại bỏ các trường không cần thiết
        const itineraryToSend = tour.itinerary.map(day => {
          // Loại bỏ trường imageFile khỏi dữ liệu JSON
          const { imageFile, ...rest } = day;
          return rest;
        });
        
        formData.append('itinerary', JSON.stringify(itineraryToSend));
        
        // Xử lý và thêm các file ảnh lịch trình
        tour.itinerary.forEach(day => {
          if (day.imageFile) {
            // Đổi tên file để dễ dàng xác định ngày trong lịch trình
            const blob = new Blob([day.imageFile], { type: day.imageFile.type });
            const extension = day.imageFile.name.split('.').pop();
            const fileName = `day-${day.day}.${extension}`;
            const itineraryImageFile = new File([blob], fileName, { type: day.imageFile.type });
            
            formData.append('itineraryImagesFiles', itineraryImageFile);
          }
        });
      }
      
      if (tour.startDates && tour.startDates.length > 0) {
        formData.append('startDates', JSON.stringify(tour.startDates));
      }
      
      if (tour.includes && tour.includes.length > 0) {
        formData.append('includes', JSON.stringify(tour.includes));
      }
      
      if (tour.excludes && tour.excludes.length > 0) {
        formData.append('excludes', JSON.stringify(tour.excludes));
      }
      
      // Xử lý hình ảnh
      if (coverImageFile) {
        formData.append('coverImageFile', coverImageFile);
      } else if (tour.coverImage && !coverImageFile) {
        // Gửi URL ảnh hiện tại nếu không có file mới
        formData.append('coverImage', tour.coverImage);
      }
      
      // Xử lý gallery
      if (existingGallery.length > 0) {
        formData.append('images', JSON.stringify(existingGallery));
      }
      
      // Thêm các file ảnh mới vào gallery
      if (galleryFiles.length > 0) {
        galleryFiles.forEach(file => {
          formData.append('imagesFiles', file);
        });
      }
      
      let response;
      
      if (isEditMode) {
        response = await toursAPI.update(id, formData);
      } else {
        response = await toursAPI.create(formData);
      }
      
      if (response.success) {
        navigate('/tours');
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting tour:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu tour');
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa tour' : 'Thêm tour mới'}
          </h1>
          <button
            onClick={() => navigate('/tours')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tour *</label>
                <input
                  type="text"
                  name="name"
                  value={tour.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (ngày) *</label>
                <input
                  type="number"
                  name="duration"
                  value={tour.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số người tối đa *</label>
                <input
                  type="number"
                  name="maxGroupSize"
                  value={tour.maxGroupSize}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó *</label>
                <select
                  name="difficulty"
                  value={tour.difficulty}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="dễ">Dễ</option>
                  <option value="trung bình">Trung bình</option>
                  <option value="khó">Khó</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) *</label>
                <input
                  type="number"
                  name="price"
                  value={tour.price}
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
                  value={tour.priceDiscount}
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
                value={tour.description}
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
          
          {/* Ngày khởi hành */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Ngày khởi hành</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddStartDate}
                className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="space-y-2">
              {tour.startDates && tour.startDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span>{formatDate(date)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStartDate(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              
              {(!tour.startDates || tour.startDates.length === 0) && (
                <p className="text-gray-500 text-sm">Chưa có ngày khởi hành nào</p>
              )}
            </div>
          </div>
          
          {/* Điểm xuất phát */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Điểm xuất phát</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả điểm xuất phát</label>
                <input
                  type="text"
                  name="startLocation.description"
                  value={tour.startLocation.description}
                  onChange={handleStartLocationChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ví dụ: Sân bay Tân Sơn Nhất"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  name="startLocation.address"
                  value={tour.startLocation.address}
                  onChange={handleStartLocationChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Địa chỉ đầy đủ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ</label>
                <input
                  type="number"
                  name="startLocation.lng"
                  value={tour.startLocation.coordinates[0]}
                  onChange={handleStartLocationChange}
                  step="0.000001"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ</label>
                <input
                  type="number"
                  name="startLocation.lat"
                  value={tour.startLocation.coordinates[1]}
                  onChange={handleStartLocationChange}
                  step="0.000001"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          {/* Dịch vụ bao gồm */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Dịch vụ bao gồm</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                placeholder="Nhập dịch vụ bao gồm"
              />
              <button
                type="button"
                onClick={handleAddInclude}
                className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="space-y-2">
              {tour.includes && tour.includes.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInclude(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              
              {(!tour.includes || tour.includes.length === 0) && (
                <p className="text-gray-500 text-sm">Chưa có dịch vụ bao gồm nào</p>
              )}
            </div>
          </div>
          
          {/* Dịch vụ không bao gồm */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Dịch vụ không bao gồm</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                placeholder="Nhập dịch vụ không bao gồm"
              />
              <button
                type="button"
                onClick={handleAddExclude}
                className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="space-y-2">
              {tour.excludes && tour.excludes.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExclude(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              
              {(!tour.excludes || tour.excludes.length === 0) && (
                <p className="text-gray-500 text-sm">Chưa có dịch vụ không bao gồm nào</p>
              )}
            </div>
          </div>
          
          {/* Lịch trình */}
          <div className="mb-6 bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Lịch trình tour</h3>
            <p className="text-gray-600 mb-4">
              Thêm chi tiết lịch trình theo từng ngày của tour
            </p>
            
            <div className="space-y-6">
              {tour.itinerary.map((day, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveItinerary(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày
                      </label>
                      <input
                        type="number"
                        value={day.day}
                        onChange={(e) => handleItineraryChange(index, 'day', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Tiêu đề ngày (ví dụ: Khám phá Hạ Long)"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả ngày
                    </label>
                    <textarea
                      value={day.description}
                      onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="3"
                      placeholder="Mô tả chi tiết về các hoạt động trong ngày"
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nơi lưu trú
                    </label>
                    <input
                      type="text"
                      value={day.accommodation}
                      onChange={(e) => handleItineraryChange(index, 'accommodation', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Tên khách sạn, resort hoặc homestay"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bữa ăn
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`breakfast-${index}`}
                          checked={day.meals.breakfast}
                          onChange={(e) => handleItineraryChange(index, 'meals.breakfast', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`breakfast-${index}`}>Sáng</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`lunch-${index}`}
                          checked={day.meals.lunch}
                          onChange={(e) => handleItineraryChange(index, 'meals.lunch', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`lunch-${index}`}>Trưa</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`dinner-${index}`}
                          checked={day.meals.dinner}
                          onChange={(e) => handleItineraryChange(index, 'meals.dinner', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`dinner-${index}`}>Tối</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ảnh minh họa ngày
                      </label>
                    </div>
                    <div className="border-dashed border-2 border-gray-300 p-4 rounded-md">
                      {day.image ? (
                        <div className="relative">
                          <img 
                            src={day.image} 
                            alt={`Ngày ${day.day}`} 
                            className="w-full h-40 object-cover rounded-md mb-2" 
                          />
                          <button
                            type="button"
                            onClick={() => handleItineraryChange(index, 'image', '')}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <FaImage className="text-gray-400 mb-2" size={32} />
                          <p className="text-sm text-gray-500 mb-2">Chọn ảnh cho ngày {day.day}</p>
                          <label className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded cursor-pointer">
                            <span>Chọn ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleItineraryImageChange(index, e)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hoạt động
                    </label>
                    <div className="space-y-2">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-center">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) => {
                              const updatedActivities = [...day.activities];
                              updatedActivities[actIndex] = e.target.value;
                              handleItineraryChange(index, 'activities', updatedActivities);
                            }}
                            className="flex-grow px-3 py-2 border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveActivity(index, actIndex)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FaMinus />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex mt-2">
                      <input
                        type="text"
                        value={activityInputs[index] || ''}
                        onChange={(e) => {
                          const newInputs = [...activityInputs];
                          newInputs[index] = e.target.value;
                          setActivityInputs(newInputs);
                        }}
                        className="flex-grow px-3 py-2 border rounded-md"
                        placeholder="Thêm hoạt động mới"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (activityInputs[index] && activityInputs[index].trim()) {
                              handleAddActivity(index, activityInputs[index]);
                              const newInputs = [...activityInputs];
                              newInputs[index] = '';
                              setActivityInputs(newInputs);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (activityInputs[index] && activityInputs[index].trim()) {
                            handleAddActivity(index, activityInputs[index]);
                            const newInputs = [...activityInputs];
                            newInputs[index] = '';
                            setActivityInputs(newInputs);
                          }
                        }}
                        className="ml-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={handleAddItinerary}
              className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded flex items-center justify-center hover:bg-indigo-600"
            >
              <FaPlus className="mr-2" /> Thêm ngày
            </button>
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
                  Lưu tour
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TourFormPage; 