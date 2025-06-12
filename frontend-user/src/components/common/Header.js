import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiSearch, FiShoppingCart } from 'react-icons/fi';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  // Kiểm tra xem trang hiện tại có phải là trang có hero image không
  const hasHeroImage = ['/explore', '/'].includes(location.pathname);

  // Theo dõi scroll để thay đổi màu header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen || !hasHeroImage
          ? 'bg-white shadow-md py-2'
          : 'bg-black bg-opacity-20 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <h1 className={`text-2xl font-bold ${isScrolled || !hasHeroImage ? 'text-primary-600' : 'text-white'}`}>
            Dawin
          </h1>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`${
              isScrolled || !hasHeroImage ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-100'
            } font-medium transition-colors`}
          >
            Trang chủ
          </Link>
          <Link
            to="/tours"
            className={`${
              isScrolled || !hasHeroImage ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-100'
            } font-medium transition-colors`}
          >
            Tours
          </Link>
          <Link
            to="/hotels"
            className={`${
              isScrolled || !hasHeroImage ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-100'
            } font-medium transition-colors`}
          >
            Khách sạn
          </Link>
          <Link
            to="/flights"
            className={`${
              isScrolled || !hasHeroImage ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-100'
            } font-medium transition-colors`}
          >
            Vé máy bay
          </Link>
          <Link
            to="/about"
            className={`${
              isScrolled || !hasHeroImage ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-100'
            } font-medium transition-colors`}
          >
            Về chúng tôi
          </Link>
        </nav>

        {/* Right buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/search"
            className={`p-2 rounded-full ${
              isScrolled || !hasHeroImage
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/20'
            } transition-colors`}
          >
            <FiSearch className="text-xl" />
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center space-x-2 p-2 rounded-full ${
                  isScrolled || !hasHeroImage
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/20'
                } transition-colors`}
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  {currentUser?.name?.charAt(0).toUpperCase() || <FiUser />}
                </div>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20"
                  >
                    <div className="p-2">
                      <span className="block px-4 py-2 text-sm text-gray-500">
                        Xin chào, {currentUser?.name}
                      </span>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Tài khoản của tôi
                      </Link>
                      <Link
                        to="/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Đặt chỗ của tôi
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Danh sách yêu thích
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md flex items-center"
                      >
                        <FiLogOut className="mr-2" /> Đăng xuất
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className={`btn ${
                isScrolled || !hasHeroImage ? 'btn-primary' : 'bg-white text-primary-600 hover:bg-gray-100'
              }`}
            >
              Đăng nhập
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/bookings"
              className={`p-2 rounded-full relative ${
                isScrolled || !hasHeroImage
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/20'
              } transition-colors`}
            >
              <FiShoppingCart className="text-xl" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`md:hidden p-2 rounded-md ${
            isScrolled || !hasHeroImage ? 'text-gray-700' : 'text-white'
          }`}
        >
          {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white"
          >
            <div className="container py-4 flex flex-col divide-y">
              <Link
                to="/"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Trang chủ
              </Link>
              <Link
                to="/tours"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Tours
              </Link>
              <Link
                to="/hotels"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Khách sạn
              </Link>
              <Link
                to="/flights"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Vé máy bay
              </Link>
              <Link
                to="/explore"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Khám phá
              </Link>
              <Link
                to="/about"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium"
              >
                Về chúng tôi
              </Link>
              
              <Link
                to="/search"
                className="py-3 text-gray-700 hover:text-primary-600 font-medium flex items-center"
              >
                <FiSearch className="mr-2" /> Tìm kiếm
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="py-3 text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Tài khoản của tôi
                  </Link>
                  <Link
                    to="/bookings"
                    className="py-3 text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Đặt chỗ của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="py-3 text-red-600 hover:text-red-700 font-medium text-left"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="py-3">
                  <Link to="/login" className="btn btn-primary w-full text-center mb-2">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-outline w-full text-center">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header; 