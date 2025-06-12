const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Các routes công khai
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Các routes yêu cầu đăng nhập
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 