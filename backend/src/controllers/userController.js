const User = require('../models/User');

/**
 * @desc    Lấy danh sách người dùng
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Xử lý phân trang và tìm kiếm
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const keyword = req.query.keyword || '';

    // Tạo điều kiện tìm kiếm
    const searchCondition = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword, $options: 'i' } }
          ]
        }
      : {};

    // Đếm tổng số bản ghi
    const total = await User.countDocuments(searchCondition);

    // Lấy dữ liệu
    const users = await User.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin một người dùng
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo người dùng mới
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký'
      });
    }

    // Tạo người dùng mới
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Lấy thông tin cần cập nhật
    const updateData = { ...req.body };

    // Nếu không có mật khẩu, loại bỏ trường password
    if (!updateData.password) {
      delete updateData.password;
    }

    // Cập nhật người dùng
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa người dùng
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra không cho phép xóa bản thân (nếu admin đang đăng nhập)
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính bạn'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thống kê người dùng
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
exports.getUserStats = async (req, res, next) => {
  try {
    // Thống kê tổng số người dùng theo vai trò
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê người dùng mới trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        usersByRole: userStats,
        newUsersLast30Days: newUsers
      }
    });
  } catch (error) {
    next(error);
  }
}; 