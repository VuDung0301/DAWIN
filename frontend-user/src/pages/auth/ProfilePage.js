import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMap, FiCalendar, FiEdit, FiLock, FiLogOut, FiSettings, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage = () => {
  const { currentUser, updateProfile, changePassword, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // State quản lý tab hiện tại
  const [activeTab, setActiveTab] = useState('profile');
  
  // State quản lý form thông tin cá nhân
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });

  // State quản lý preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    promotionalEmails: true,
    twoFactorAuth: false,
  });
  
  // State quản lý form đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // State quản lý lỗi
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Cập nhật dữ liệu khi có thông tin người dùng
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : '',
      });

      // Cập nhật preferences nếu có
      if (currentUser.preferences) {
        setPreferences({
          emailNotifications: currentUser.preferences.emailNotifications ?? true,
          promotionalEmails: currentUser.preferences.promotionalEmails ?? true,
          twoFactorAuth: currentUser.preferences.twoFactorAuth ?? false,
        });
      }
    } else {
      // Redirect nếu chưa đăng nhập
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  // Validate form thông tin cá nhân
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Họ tên không được để trống';
    }
    
    if (profileData.phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(profileData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate form đổi mật khẩu
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Cập nhật thông tin cá nhân
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});
    
    try {
      await updateProfile(profileData);
      setSuccessMessage('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      setErrors({ submit: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin' });
    } finally {
      setIsSubmitting(false);
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Cập nhật preferences
  const handlePreferencesUpdate = async (updatedPreferences) => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});
    
    try {
      await updateProfile({ preferences: updatedPreferences });
      setPreferences(updatedPreferences);
      setSuccessMessage('Cập nhật tùy chọn thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật tùy chọn:', error);
      setErrors({ submit: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tùy chọn' });
    } finally {
      setIsSubmitting(false);
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };
  
  // Đổi mật khẩu
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});
    
    try {
      await changePassword({
        passwordCurrent: passwordData.currentPassword,
        password: passwordData.newPassword,
        passwordConfirm: passwordData.confirmPassword,
      });
      
      setSuccessMessage('Đổi mật khẩu thành công!');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      setErrors({ submit: error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu' });
    } finally {
      setIsSubmitting(false);
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };
  
  // Cập nhật thông tin form
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi người dùng bắt đầu sửa
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Cập nhật thông tin form mật khẩu
  const handlePasswordDataChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi người dùng bắt đầu sửa
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Xử lý thay đổi preferences
  const handlePreferenceChange = (key, value) => {
    const updatedPreferences = {
      ...preferences,
      [key]: value
    };
    setPreferences(updatedPreferences);
    
    // Tự động lưu preferences
    handlePreferencesUpdate(updatedPreferences);
  };
  
  // Đăng xuất
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-16 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen"
    >
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Tiêu đề trang */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-3 text-gray-800 flex items-center">
              <span className="bg-primary-100 text-primary-600 p-2 rounded-full mr-3">
                <FiUser size={20} />
              </span>
              Tài khoản của tôi
            </h1>
            <p className="text-gray-600 pl-12">Quản lý thông tin cá nhân và thiết lập tài khoản</p>
          </motion.div>
          
          {/* Thẻ tài khoản */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100"
          >
            <div className="md:flex">
              {/* Sidebar */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="mb-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-xl font-bold text-primary-600">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800">{currentUser?.name || 'Người dùng'}</h3>
                    <p className="text-sm text-gray-500">{currentUser?.email || 'email@example.com'}</p>
                  </div>
                  <nav>
                    <ul className="space-y-2">
                      <li>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all ${
                            activeTab === 'profile' 
                              ? 'bg-primary-600 text-white shadow-md' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <FiUser className={`mr-3 ${activeTab === 'profile' ? 'text-white' : 'text-primary-500'}`} />
                          <span>Thông tin cá nhân</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => setActiveTab('security')}
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all ${
                            activeTab === 'security' 
                              ? 'bg-primary-600 text-white shadow-md' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <FiLock className={`mr-3 ${activeTab === 'security' ? 'text-white' : 'text-primary-500'}`} />
                          <span>Bảo mật</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => setActiveTab('preferences')}
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all ${
                            activeTab === 'preferences' 
                              ? 'bg-primary-600 text-white shadow-md' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <FiSettings className={`mr-3 ${activeTab === 'preferences' ? 'text-white' : 'text-primary-500'}`} />
                          <span>Tùy chọn</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 rounded-lg flex items-center text-red-600 hover:bg-red-50 transition-all"
                        >
                          <FiLogOut className="mr-3" />
                          <span>Đăng xuất</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              
              {/* Nội dung */}
              <div className="flex-1 p-6">
                <AnimatePresence mode="wait">
                  {/* Tab thông tin cá nhân */}
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                          <FiUser className="mr-2 text-primary-500" /> Thông tin cá nhân
                        </h2>
                      </div>
                      
                      <AnimatePresence>
                        {successMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center"
                          >
                            <FiCheckCircle className="mr-2 text-green-500" size={20} />
                            {successMessage}
                          </motion.div>
                        )}
                        {errors.submit && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center"
                          >
                            <span className="mr-2">⚠️</span>
                            {errors.submit}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <form onSubmit={handleProfileUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                              Họ tên
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={profileData.name}
                                onChange={handleProfileChange}
                                className={`input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
                              />
                            </div>
                            {errors.name && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <span className="mr-1">•</span> {errors.name}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="text-gray-400" />
                              </div>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={profileData.email}
                                disabled
                                className="input pl-10 w-full py-2.5 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                              />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500">Email không thể thay đổi</p>
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                              Số điện thoại
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiPhone className="text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                placeholder="Nhập số điện thoại của bạn"
                                className={`input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.phone ? 'border-red-500 focus:ring-red-200' : ''}`}
                              />
                            </div>
                            {errors.phone && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <span className="mr-1">•</span> {errors.phone}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                              Ngày sinh
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiCalendar className="text-gray-400" />
                              </div>
                              <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={profileData.dateOfBirth}
                                onChange={handleProfileChange}
                                className="input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                              Địa chỉ
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                <FiMap className="text-gray-400" />
                              </div>
                              <textarea
                                id="address"
                                name="address"
                                value={profileData.address}
                                onChange={handleProfileChange}
                                rows="3"
                                placeholder="Nhập địa chỉ đầy đủ của bạn"
                                className="input pl-10 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <motion.button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="btn btn-primary relative px-6 py-2.5 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {(isSubmitting || loading) && (
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <span>{isSubmitting || loading ? 'Đang xử lý...' : 'Lưu thay đổi'}</span>
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  
                  {/* Tab bảo mật */}
                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                          <FiLock className="mr-2 text-primary-500" /> Bảo mật
                        </h2>
                      </div>
                      
                      <AnimatePresence>
                        {successMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center"
                          >
                            <FiCheckCircle className="mr-2 text-green-500" size={20} />
                            {successMessage}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-100">
                        <p className="text-yellow-700 text-sm">
                          Đảm bảo mật khẩu mới của bạn có ít nhất 6 ký tự và bao gồm chữ hoa, chữ thường và số để tăng cường bảo mật.
                        </p>
                      </div>
                      
                      <form onSubmit={handlePasswordChange}>
                        <div className="space-y-5 mb-6">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                              Mật khẩu hiện tại
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="text-gray-400" />
                              </div>
                              <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordDataChange}
                                className={`input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.currentPassword ? 'border-red-500 focus:ring-red-200' : ''}`}
                              />
                            </div>
                            {errors.currentPassword && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <span className="mr-1">•</span> {errors.currentPassword}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                              Mật khẩu mới
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="text-gray-400" />
                              </div>
                              <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordDataChange}
                                className={`input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.newPassword ? 'border-red-500 focus:ring-red-200' : ''}`}
                              />
                            </div>
                            {errors.newPassword && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <span className="mr-1">•</span> {errors.newPassword}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                              Xác nhận mật khẩu mới
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="text-gray-400" />
                              </div>
                              <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordDataChange}
                                className={`input pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : ''}`}
                              />
                            </div>
                            {errors.confirmPassword && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <span className="mr-1">•</span> {errors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <motion.button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="btn btn-primary relative px-6 py-2.5 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {(isSubmitting || loading) && (
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <span>{isSubmitting || loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  
                  {/* Tab tùy chọn */}
                  {activeTab === 'preferences' && (
                    <motion.div
                      key="preferences"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                          <FiSettings className="mr-2 text-primary-500" /> Tùy chọn
                        </h2>
                      </div>
                      
                      <div className="space-y-5">
                        <motion.div 
                          className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800 mb-1">Thông báo qua email</h3>
                              <p className="text-sm text-gray-600">Nhận thông báo về ưu đãi và khuyến mãi</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={preferences.emailNotifications} onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)} />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800 mb-1">Thông báo về khuyến mãi</h3>
                              <p className="text-sm text-gray-600">Nhận thông báo về ưu đãi đặc biệt và giảm giá</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={preferences.promotionalEmails} onChange={(e) => handlePreferenceChange('promotionalEmails', e.target.checked)} />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800 mb-1">Xác thực hai yếu tố</h3>
                              <p className="text-sm text-gray-600">Tăng cường bảo mật cho tài khoản của bạn</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={preferences.twoFactorAuth} onChange={(e) => handlePreferenceChange('twoFactorAuth', e.target.checked)} />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </motion.div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
                          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                            <FiShield className="mr-2" /> Bảo mật tài khoản
                          </h3>
                          <p className="text-sm text-blue-700">
                            Để bảo vệ tài khoản của bạn, chúng tôi khuyến nghị bật xác thực hai yếu tố và cập nhật mật khẩu định kỳ.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage; 