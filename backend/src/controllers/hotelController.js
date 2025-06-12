const Hotel = require('../models/Hotel');
const { upload, getRelativePath, deleteFile } = require('../utils/fileHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

/**
 * @desc    Lấy tất cả khách sạn
 * @route   GET /api/hotels
 * @access  Public
 */
exports.getAllHotels = async (req, res, next) => {
  try {
    // Xây dựng query
    let query = {};

    // Lọc theo thành phố
    if (req.query.city) {
      query.city = { $regex: req.query.city, $options: 'i' };
    }

    // Lọc theo số sao
    if (req.query.stars) {
      const starsArray = req.query.stars.split(',').map(Number);
      query.stars = { $in: starsArray };
    }

    // Lọc theo khoảng giá
    if (req.query.minPrice || req.query.maxPrice) {
      query.pricePerNight = {};
      if (req.query.minPrice) query.pricePerNight.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) query.pricePerNight.$lte = parseInt(req.query.maxPrice);
    }

    // Tìm kiếm theo tên
    if (req.query.keyword) {
      query.name = { $regex: req.query.keyword, $options: 'i' };
    }

    // Lọc theo danh mục
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Đếm tổng số khách sạn
    const total = await Hotel.countDocuments(query);

    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Thực hiện query với phân trang
    const hotels = await Hotel.find(query)
      .select('name coverImage stars city address pricePerNight priceDiscount ratingsAverage ratingsQuantity')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết một khách sạn
 * @route   GET /api/hotels/:id
 * @access  Public
 */
exports.getHotel = async (req, res, next) => {
  try {
    // Kiểm tra ID hợp lệ
    const hotelId = req.params.id;
    
    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      console.log(`Yêu cầu lấy thông tin khách sạn với ID không hợp lệ: ${hotelId}`);
      return res.status(400).json({
        success: false,
        message: 'ID khách sạn không hợp lệ',
      });
    }

    console.log(`Đang tìm khách sạn với ID: ${hotelId}`);
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      console.log(`Không tìm thấy khách sạn với ID: ${hotelId}`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách sạn',
      });
    }

    // Đảm bảo images luôn là array
    const hotelData = hotel.toObject();
    
    // Đảm bảo trường images luôn là mảng
    if (!hotelData.images) {
      hotelData.images = [];
    }
    
    console.log(`Gửi thông tin khách sạn ID ${hotelId}, tên: ${hotelData.name}, có ${hotelData.images.length} ảnh gallery`);

    res.status(200).json({
      success: true,
      data: hotelData,
    });
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin khách sạn: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Tạo khách sạn mới với ảnh
 * @route   POST /api/hotels
 * @access  Private (Admin)
 */
exports.createHotel = async (req, res, next) => {
  // Cấu hình multer cho upload nhiều file
  const uploadMultiple = upload.fields([
    { name: 'coverImageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 20 }
  ]);

  uploadMultiple(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Lỗi từ multer
        return res.status(400).json({
          success: false,
          message: `Lỗi upload: ${err.message}`
        });
      } else {
        // Lỗi không xác định
        return res.status(500).json({
          success: false,
          message: `Lỗi upload: ${err.message}`
        });
      }
    }

    try {
      // Log dữ liệu đầu vào để debug
      console.log('Body data:', req.body);
      console.log('Files:', req.files);
      
      // Dữ liệu khách sạn từ form
      const hotelData = { ...req.body };

      // Kiểm tra các trường bắt buộc
      const requiredFields = ['name', 'description', 'stars', 'category', 'address', 'city', 'pricePerNight'];
      for (const field of requiredFields) {
        if (!hotelData[field]) {
          return res.status(400).json({
            success: false,
            message: `Thiếu thông tin ${field}`
          });
        }
      }

      // Xử lý ảnh đại diện
      if (req.files && req.files.coverImageFile && req.files.coverImageFile.length > 0) {
        const file = req.files.coverImageFile[0];
        const fileType = 'common';
        const relativePath = getRelativePath(fileType, file.filename);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
        
        hotelData.coverImage = fileUrl;
      } else if (req.body.coverImage) {
        // Giữ nguyên ảnh hiện tại nếu không upload ảnh mới
        hotelData.coverImage = req.body.coverImage;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Ảnh đại diện là bắt buộc'
        });
      }

      // ===== XỬ LÝ GALLERY =====
      const galleryImages = [];
      
      // Thêm các URL ảnh hiện có (nếu có)
      if (req.body.gallery) {
        try {
          // Xử lý gallery được gửi từ client
          let existingImages = [];
          
          if (typeof req.body.gallery === 'string') {
            try {
              // Thử parse JSON từ string
              const parsedGallery = JSON.parse(req.body.gallery);
              if (Array.isArray(parsedGallery)) {
                existingImages = parsedGallery;
                console.log(`Parsed gallery từ string JSON, có ${existingImages.length} ảnh`);
              } else {
                console.log('gallery sau khi parse không phải array:', parsedGallery);
              }
            } catch (e) {
              console.error('Lỗi khi parse gallery JSON:', e);
            }
          } else if (Array.isArray(req.body.gallery)) {
            existingImages = req.body.gallery;
            console.log(`Gallery đã là array, có ${existingImages.length} ảnh`);
          } else {
            console.log('gallery không phải string hoặc array:', typeof req.body.gallery);
          }
          
          if (existingImages.length > 0) {
            galleryImages.push(...existingImages);
            console.log(`Thêm ${existingImages.length} ảnh hiện có vào gallery`);
          }
        } catch (e) {
          console.error('Lỗi khi xử lý gallery:', e);
        }
      }
      
      // Thêm các file ảnh mới
      if (req.files && req.files.galleryFiles && req.files.galleryFiles.length > 0) {
        const fileType = 'common';
        
        req.files.galleryFiles.forEach(file => {
          const relativePath = getRelativePath(fileType, file.filename);
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
          galleryImages.push(fileUrl);
        });
        console.log(`Thêm ${req.files.galleryFiles.length} ảnh mới vào gallery`);
      }
      
      hotelData.images = galleryImages;
      console.log(`Tổng cộng ${hotelData.images.length} ảnh trong gallery sau khi xử lý`);

      // Xử lý các trường JSON
      const jsonFields = ['location', 'amenities', 'policies', 'roomTypes', 'nearbyAttractions'];
      
      for (const field of jsonFields) {
        console.log(`Xử lý trường ${field}, giá trị gốc:`, hotelData[field], typeof hotelData[field]);
        
        // Nếu trường không tồn tại, đặt giá trị mặc định
        if (!hotelData[field]) {
          if (field === 'location') hotelData[field] = { latitude: 0, longitude: 0 };
          else if (field === 'amenities') hotelData[field] = [];
          else if (field === 'policies') hotelData[field] = {};
          else if (field === 'roomTypes') hotelData[field] = [];
          else if (field === 'nearbyAttractions') hotelData[field] = [];
          continue;
        }
        
        // Nếu đã là object hoặc array, không cần parse
        if (typeof hotelData[field] !== 'string') {
          continue;
        }
        
        // Parse chuỗi JSON
        try {
          // Kiểm tra nếu là chuỗi trống hoặc "[]"
          if (hotelData[field].trim() === "" || hotelData[field].trim() === "[]") {
            if (field === 'location') hotelData[field] = { latitude: 0, longitude: 0 };
            else if (field === 'amenities') hotelData[field] = [];
            else if (field === 'policies') hotelData[field] = {};
            else if (field === 'roomTypes') hotelData[field] = [];
            else if (field === 'nearbyAttractions') hotelData[field] = [];
          } else {
            hotelData[field] = JSON.parse(hotelData[field]);
          }
        } catch (e) {
          console.error(`Lỗi khi parse ${field}:`, e);
          // Đặt giá trị mặc định cho từng trường
          if (field === 'location') hotelData[field] = { latitude: 0, longitude: 0 };
          else if (field === 'amenities') hotelData[field] = [];
          else if (field === 'policies') hotelData[field] = {};
          else if (field === 'roomTypes') hotelData[field] = [];
          else if (field === 'nearbyAttractions') hotelData[field] = [];
        }
        
        console.log(`Kết quả xử lý trường ${field}:`, hotelData[field], typeof hotelData[field]);
      }

      // Xử lý đặc biệt cho roomTypes để đảm bảo mỗi phòng có ID duy nhất
      if (Array.isArray(hotelData.roomTypes)) {
        hotelData.roomTypes = hotelData.roomTypes.map(room => {
          // Đảm bảo các trường bắt buộc của roomType
          return {
            ...room,
            name: room.name || 'Phòng tiêu chuẩn',
            price: room.price || 0,
            priceDiscount: room.priceDiscount || 0,
            capacity: room.capacity || 2,
            available: room.available || 0,
            amenities: Array.isArray(room.amenities) ? room.amenities : []
          };
        });
      } else {
        hotelData.roomTypes = [];
      }
      
      // Đảm bảo nearbyAttractions là mảng
      if (!Array.isArray(hotelData.nearbyAttractions)) {
        hotelData.nearbyAttractions = [];
      }

      // Đảm bảo các trường số là số
      if (hotelData.stars) hotelData.stars = Number(hotelData.stars);
      if (hotelData.pricePerNight) hotelData.pricePerNight = Number(hotelData.pricePerNight);
      if (hotelData.priceDiscount) hotelData.priceDiscount = Number(hotelData.priceDiscount);

      // Kiểm tra giá và giá khuyến mãi trước khi tạo
      if (hotelData.pricePerNight && hotelData.priceDiscount) {
        const pricePerNight = Number(hotelData.pricePerNight);
        const priceDiscount = Number(hotelData.priceDiscount);
        
        if (priceDiscount >= pricePerNight) {
          return res.status(400).json({
            success: false,
            message: 'Giá khuyến mãi phải nhỏ hơn giá gốc'
          });
        }
      }
      
      // Thêm giá trị mặc định
      hotelData.ratingsAverage = hotelData.ratingsAverage || 4.5;
      hotelData.ratingsQuantity = hotelData.ratingsQuantity || 0;

      console.log('Dữ liệu khách sạn sau khi xử lý:', {
        name: hotelData.name,
        coverImage: hotelData.coverImage ? 'Có ảnh' : 'Không có ảnh',
        roomTypes: Array.isArray(hotelData.roomTypes) ? `${hotelData.roomTypes.length} loại phòng` : 'Không phải array',
        nearbyAttractions: Array.isArray(hotelData.nearbyAttractions) ? `${hotelData.nearbyAttractions.length} địa điểm` : 'Không phải array'
      });

      // Tạo khách sạn mới
      const hotel = await Hotel.create(hotelData);

      res.status(201).json({
        success: true,
        data: hotel
      });
    } catch (error) {
      console.error('Lỗi khi tạo khách sạn:', error);
      next(error);
    }
  });
};

/**
 * @desc    Cập nhật khách sạn với ảnh
 * @route   PUT /api/hotels/:id
 * @access  Private (Admin)
 */
exports.updateHotel = async (req, res, next) => {
  // Cấu hình multer cho upload nhiều file
  const uploadMultiple = upload.fields([
    { name: 'coverImageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 20 }
  ]);

  uploadMultiple(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Lỗi từ multer
        return res.status(400).json({
          success: false,
          message: `Lỗi upload: ${err.message}`
        });
      } else {
        // Lỗi không xác định
        return res.status(500).json({
          success: false,
          message: `Lỗi upload: ${err.message}`
        });
      }
    }

    try {
      // Kiểm tra khách sạn có tồn tại không
      const hotelToUpdate = await Hotel.findById(req.params.id);
      if (!hotelToUpdate) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách sạn'
        });
      }

      // Dữ liệu khách sạn từ form
      const hotelData = { ...req.body };

      // Xử lý ảnh đại diện
      if (req.files && req.files.coverImageFile && req.files.coverImageFile.length > 0) {
        const file = req.files.coverImageFile[0];
        const fileType = 'common';
        const relativePath = getRelativePath(fileType, file.filename);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
        
        // Xóa ảnh cũ nếu có
        if (hotelToUpdate.coverImage) {
          try {
            const oldImagePath = new URL(hotelToUpdate.coverImage).pathname;
            const fileName = path.basename(oldImagePath);
            const fileFolder = path.dirname(oldImagePath).split('/').pop();
            if (fileName && fileFolder) {
              deleteFile(`${fileFolder}/${fileName}`);
            }
          } catch (error) {
            console.error('Lỗi khi xóa ảnh cũ:', error);
          }
        }
        
        hotelData.coverImage = fileUrl;
      }

      // Xử lý gallery
      let galleryImages = [];
      
      // Thêm các URL ảnh hiện có (nếu có)
      if (req.body.gallery) {
        try {
          // Xử lý gallery được gửi từ client
          let existingImages = [];
          
          if (typeof req.body.gallery === 'string') {
            try {
              // Thử parse JSON từ string
              const parsedGallery = JSON.parse(req.body.gallery);
              if (Array.isArray(parsedGallery)) {
                existingImages = parsedGallery;
                console.log(`Parsed gallery từ string JSON, có ${existingImages.length} ảnh`);
              } else {
                console.log('gallery sau khi parse không phải array:', parsedGallery);
              }
            } catch (e) {
              console.error('Lỗi khi parse gallery JSON:', e);
            }
          } else if (Array.isArray(req.body.gallery)) {
            existingImages = req.body.gallery;
            console.log(`Gallery đã là array, có ${existingImages.length} ảnh`);
          } else {
            console.log('gallery không phải string hoặc array:', typeof req.body.gallery);
          }
          
          if (existingImages.length > 0) {
            galleryImages = [...existingImages];
            console.log(`Thêm ${galleryImages.length} ảnh hiện có vào gallery`);
          }
        } catch (e) {
          console.error('Lỗi khi xử lý gallery:', e);
        }
      } else {
        // Giữ gallery hiện tại nếu client không gửi
        if (hotelToUpdate.images && Array.isArray(hotelToUpdate.images)) {
          galleryImages = [...hotelToUpdate.images];
          console.log(`Giữ lại ${galleryImages.length} ảnh từ gallery hiện tại`);
        }
      }
      
      // Thêm các file ảnh mới
      if (req.files && req.files.galleryFiles && req.files.galleryFiles.length > 0) {
        const fileType = 'common';
        
        req.files.galleryFiles.forEach(file => {
          const relativePath = getRelativePath(fileType, file.filename);
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
          galleryImages.push(fileUrl);
        });
        console.log(`Thêm ${req.files.galleryFiles.length} ảnh mới vào gallery`);
      }
      
      hotelData.images = galleryImages;
      console.log(`Tổng cộng ${hotelData.images.length} ảnh trong gallery sau khi xử lý`);

      // Xử lý các trường JSON
      const jsonFields = ['location', 'amenities', 'policies', 'roomTypes', 'nearbyAttractions'];
      
      for (const field of jsonFields) {
        if (hotelData[field] && typeof hotelData[field] === 'string') {
          try {
            hotelData[field] = JSON.parse(hotelData[field]);
          } catch (e) {
            console.error(`Lỗi khi parse ${field}:`, e);
            // Giữ nguyên giá trị cũ
            hotelData[field] = hotelToUpdate[field];
          }
        } else if (!hotelData[field]) {
          // Giữ nguyên giá trị cũ nếu không có trong request
          hotelData[field] = hotelToUpdate[field];
        }
      }

      // Xử lý đặc biệt cho roomTypes
      if (Array.isArray(hotelData.roomTypes)) {
        hotelData.roomTypes = hotelData.roomTypes.map(room => {
          // Đảm bảo các trường bắt buộc của roomType
          return {
            ...room,
            price: room.price || 0,
            priceDiscount: room.priceDiscount || 0,
            capacity: room.capacity || 2,
            available: room.available || 0,
            amenities: Array.isArray(room.amenities) ? room.amenities : []
          };
        });
      }

      // Đảm bảo các trường số là số
      if (hotelData.stars) hotelData.stars = Number(hotelData.stars);
      if (hotelData.pricePerNight) hotelData.pricePerNight = Number(hotelData.pricePerNight);
      if (hotelData.priceDiscount) hotelData.priceDiscount = Number(hotelData.priceDiscount);

      // Kiểm tra giá và giá khuyến mãi trước khi cập nhật
      if (hotelData.pricePerNight && hotelData.priceDiscount) {
        const pricePerNight = Number(hotelData.pricePerNight);
        const priceDiscount = Number(hotelData.priceDiscount);
        
        if (priceDiscount >= pricePerNight) {
          return res.status(400).json({
            success: false,
            message: 'Giá khuyến mãi phải nhỏ hơn giá gốc'
          });
        }
      }

      // Cập nhật khách sạn
      const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: updatedHotel
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật khách sạn:', error);
      next(error);
    }
  });
};

/**
 * @desc    Xóa khách sạn
 * @route   DELETE /api/hotels/:id
 * @access  Private (Admin)
 */
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách sạn',
      });
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Khách sạn đã được xóa',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy các thành phố phổ biến
 * @route   GET /api/hotels/popular-cities
 * @access  Public
 */
exports.getPopularCities = async (req, res, next) => {
  try {
    const cities = await Hotel.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          rating: { $avg: '$ratingsAverage' },
          image: { $first: '$coverImage' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          city: '$_id',
          count: 1,
          rating: 1,
          image: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy các khách sạn theo thành phố
 * @route   GET /api/hotels/cities/:city
 * @access  Public
 */
exports.getHotelsByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const query = { city: { $regex: city, $options: 'i' } };

    // Đếm tổng số khách sạn theo thành phố
    const total = await Hotel.countDocuments(query);

    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Thực hiện query với phân trang
    const hotels = await Hotel.find(query)
      .select('name coverImage stars city address pricePerNight priceDiscount ratingsAverage ratingsQuantity')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy các danh mục khách sạn
 * @route   GET /api/hotels/categories
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = [
      {
        name: 'nghỉ dưỡng',
        title: 'Khách sạn nghỉ dưỡng',
        icon: 'palm.tree',
        description: 'Không gian thoáng đãng để thư giãn và nạp năng lượng',
      },
      {
        name: 'thành phố',
        title: 'Khách sạn trung tâm',
        icon: 'building.2',
        description: 'Vị trí thuận tiện để khám phá thành phố',
      },
      {
        name: 'ven biển',
        title: 'Khách sạn ven biển',
        icon: 'water.waves',
        description: 'Nghỉ dưỡng cạnh bãi biển xinh đẹp',
      },
      {
        name: 'núi',
        title: 'Khách sạn vùng núi',
        icon: 'mountain.2',
        description: 'Phong cảnh núi non hùng vĩ',
      },
      {
        name: 'gia đình',
        title: 'Khách sạn gia đình',
        icon: 'person.3',
        description: 'Không gian lý tưởng cho cả gia đình',
      },
      {
        name: 'doanh nhân',
        title: 'Khách sạn doanh nhân',
        icon: 'briefcase',
        description: 'Tiện nghi đáp ứng nhu cầu công việc',
      },
      {
        name: 'cặp đôi',
        title: 'Khách sạn cho cặp đôi',
        icon: 'heart',
        description: 'Không gian lãng mạn cho hai người',
      },
    ];

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy các khách sạn theo danh mục
 * @route   GET /api/hotels/categories/:category
 * @access  Public
 */
exports.getHotelsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const query = { category };

    // Đếm tổng số khách sạn theo danh mục
    const total = await Hotel.countDocuments(query);

    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Thực hiện query với phân trang
    const hotels = await Hotel.find(query)
      .select('name coverImage stars city address pricePerNight priceDiscount ratingsAverage ratingsQuantity')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy các khách sạn nổi bật
 * @route   GET /api/hotels/featured
 * @access  Public
 */
exports.getFeaturedHotels = async (req, res, next) => {
  try {
    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    // Xác định loại sắp xếp (mặc định là theo đánh giá)
    const sortBy = req.query.sortBy || 'rating';
    
    let sortOption = {};
    
    switch (sortBy) {
      case 'rating':
        sortOption = { ratingsAverage: -1, ratingsQuantity: -1 };
        break;
      case 'price':
        sortOption = { pricePerNight: 1 };
        break;
      case 'popularity':
        sortOption = { ratingsQuantity: -1 };
        break;
      case 'discount':
        // Sắp xếp theo mức giảm giá (cao đến thấp)
        sortOption = {
          $expr: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$priceDiscount', null] },
                  { $ne: ['$priceDiscount', 0] }
                ]
              },
              then: { $subtract: ['$pricePerNight', '$priceDiscount'] },
              else: 0
            }
          }
        };
        break;
      default:
        sortOption = { ratingsAverage: -1, ratingsQuantity: -1 };
    }

    // Lấy khách sạn có rating cao
    const hotels = await Hotel.find()
      .sort(sortOption)
      .select('name coverImage stars city address pricePerNight priceDiscount ratingsAverage ratingsQuantity category')
      .skip(skip)
      .limit(limit);

    // Đếm tổng số
    const total = await Hotel.countDocuments();

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn nổi bật:', error);
    next(error);
  }
};

/**
 * @desc    Kiểm tra phòng có khả dụng
 * @route   POST /api/hotels/:id/check-availability
 * @access  Public
 */
exports.checkAvailability = async (req, res) => {
  try {
    // Lấy hotel ID từ URL
    const { id } = req.params;

    // Lấy thông tin từ body
    const { checkIn, checkOut, guests, roomType } = req.body;
    
    // Kiểm tra thông tin bắt buộc
    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: ngày check-in, check-out và số lượng khách'
      });
    }

    // Tìm kiếm khách sạn
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách sạn'
      });
    }

    // Kiểm tra xem có phòng phù hợp không
    const totalGuests = typeof guests === 'object' ? guests.adults + (guests.children || 0) : parseInt(guests);
    
    // Nếu có chỉ định roomType, chỉ kiểm tra phòng đó
    if (roomType) {
      const room = hotel.roomTypes.find(r => 
        r._id.toString() === roomType || 
        r.name.toLowerCase() === roomType.toLowerCase()
      );

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy loại phòng được chọn'
        });
      }

      // Kiểm tra sức chứa
      if (room.capacity < totalGuests) {
        return res.status(400).json({
          success: false,
          message: `Loại phòng này chỉ phù hợp cho tối đa ${room.capacity} khách`
        });
      }

      // Kiểm tra tính khả dụng
      if (room.available <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Loại phòng này hiện không còn phòng trống'
        });
      }

      // Tính số đêm
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nightCount = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

      return res.status(200).json({
        success: true,
        data: {
          roomType: {
            _id: room._id,
            name: room.name,
            capacity: room.capacity,
            price: room.price,
            priceDiscount: room.priceDiscount || null,
            amenities: room.amenities
          },
          availability: true,
          nightCount,
          totalPrice: (room.priceDiscount || room.price) * nightCount
        }
      });
    } 
    // Nếu không chỉ định roomType, tìm tất cả phòng phù hợp
    else {
      // Lọc các phòng phù hợp về sức chứa và còn trống
      const availableRooms = hotel.roomTypes
        .filter(room => room.capacity >= totalGuests && room.available > 0)
        .map(room => ({
          _id: room._id,
          name: room.name,
          capacity: room.capacity,
          price: room.price,
          priceDiscount: room.priceDiscount || null,
          amenities: room.amenities,
          available: room.available
        }));

      if (availableRooms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không có phòng nào phù hợp với số lượng khách và còn trống'
        });
      }

      // Tính số đêm
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nightCount = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

      return res.status(200).json({
        success: true,
        data: {
          availability: true,
          nightCount,
          roomTypes: availableRooms,
          // Chọn một phòng có giá thấp nhất làm mặc định
          defaultRoom: availableRooms.sort((a, b) => 
            (a.priceDiscount || a.price) - (b.priceDiscount || b.price)
          )[0]
        }
      });
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra phòng khả dụng:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra phòng',
      error: error.message
    });
  }
};

/**
 * @desc    Tìm kiếm khách sạn
 * @route   GET /api/hotels/search
 * @access  Public
 */
exports.searchHotels = async (req, res, next) => {
  try {
    const { 
      city, 
      checkIn, 
      checkOut, 
      guests, 
      minPrice, 
      maxPrice, 
      stars, 
      category,
      amenities,
      sort
    } = req.query;

    // Xây dựng query
    const query = {};

    // Tìm theo thành phố
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    // Lọc theo giá
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) query.pricePerNight.$lte = parseInt(maxPrice);
    }

    // Lọc theo số sao
    if (stars) {
      const starsArray = stars.split(',').map(Number);
      query.stars = { $in: starsArray };
    }

    // Lọc theo danh mục
    if (category) {
      query.category = category;
    }

    // Lọc theo tiện nghi
    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Đếm tổng số khách sạn thỏa mãn điều kiện
    const total = await Hotel.countDocuments(query);

    // Phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Xác định cách sắp xếp
    let sortOptions = { ratingsAverage: -1 }; // Mặc định sắp xếp theo đánh giá cao nhất
    
    if (sort) {
      switch(sort) {
        case 'price_asc':
          sortOptions = { pricePerNight: 1 };
          break;
        case 'price_desc':
          sortOptions = { pricePerNight: -1 };
          break;
        case 'rating_desc':
          sortOptions = { ratingsAverage: -1 };
          break;
        case 'rating_asc':
          sortOptions = { ratingsAverage: 1 };
          break;
        case 'name_asc':
          sortOptions = { name: 1 };
          break;
        case 'name_desc':
          sortOptions = { name: -1 };
          break;
      }
    }

    // Lấy khách sạn phù hợp với điều kiện tìm kiếm
    const hotels = await Hotel.find(query)
      .select('name coverImage stars city address pricePerNight priceDiscount ratingsAverage ratingsQuantity category')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: hotels.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm khách sạn:', error);
    next(error);
  }
};

/**
 * @desc    Cập nhật danh sách ảnh khách sạn
 * @route   PUT /api/hotels/:id/images
 * @access  Private (Admin)
 */
exports.updateHotelImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    // Kiểm tra khách sạn có tồn tại không
    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách sạn',
      });
    }

    // Cập nhật danh sách ảnh
    hotel.images = Array.isArray(images) ? images : [];
    await hotel.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh khách sạn thành công',
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
}; 