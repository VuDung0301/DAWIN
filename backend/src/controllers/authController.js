const User = require('../models/User');
const { sendToken } = require('../utils/jwtToken');

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký',
      });
    }

    // Tạo người dùng mới
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Gửi token
    sendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email và password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu',
      });
    }

    // Tìm người dùng và kiểm tra mật khẩu
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // Gửi token
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng xuất người dùng
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  // Xóa cookie
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công',
  });
};

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res, next) => {
  try {
    const { name, phone, dateOfBirth, address, preferences } = req.body;

    // Tạo object chứa các field được phép cập nhật
    const fieldsToUpdate = {};
    
    if (name !== undefined) fieldsToUpdate.name = name;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (dateOfBirth !== undefined) fieldsToUpdate.dateOfBirth = dateOfBirth;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (preferences !== undefined) fieldsToUpdate.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Cập nhật thông tin thành công',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật mật khẩu
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { passwordCurrent, password, passwordConfirm } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!passwordCurrent || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin mật khẩu',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    // Lấy người dùng
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Kiểm tra mật khẩu hiện tại
    if (!(await user.matchPassword(passwordCurrent))) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    // Cập nhật mật khẩu
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    next(error);
  }
}; 