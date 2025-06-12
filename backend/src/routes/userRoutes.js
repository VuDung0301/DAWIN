const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();


// Routes quản lý người dùng
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.get('/stats', getUserStats);

module.exports = router; 