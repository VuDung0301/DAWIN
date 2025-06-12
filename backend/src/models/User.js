const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'default-avatar.jpg',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    // Tùy chọn thông báo
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      promotionalEmails: {
        type: Boolean,
        default: true,
      },
      twoFactorAuth: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Mã hóa mật khẩu trước khi lưu bằng crypto
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Tạo salt ngẫu nhiên
    const salt = crypto.randomBytes(16).toString('hex');
    // Sử dụng hàm hash sha256 với salt
    const hash = crypto.pbkdf2Sync(this.password, salt, 1000, 64, 'sha512').toString('hex');
    // Lưu mật khẩu dưới dạng salt:hash
    this.password = `${salt}:${hash}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    // Tách salt và hash từ mật khẩu đã lưu
    const [salt, storedHash] = this.password.split(':');
    // Tính toán hash từ mật khẩu nhập vào với salt đã lưu
    const hash = crypto.pbkdf2Sync(enteredPassword, salt, 1000, 64, 'sha512').toString('hex');
    // So sánh hash
    return storedHash === hash;
  } catch (error) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 