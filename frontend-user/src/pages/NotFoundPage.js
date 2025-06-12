import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft, FiHelpCircle } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen flex items-center">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-bold text-red-500">404</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">Trang không tồn tại</h1>
            
            <p className="text-gray-600 mb-8">
              Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
              Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/" className="btn btn-primary inline-flex items-center">
                <FiHome className="mr-2" /> Về trang chủ
              </Link>
              
              <button 
                onClick={() => window.history.back()}
                className="btn btn-outline inline-flex items-center"
              >
                <FiArrowLeft className="mr-2" /> Quay lại
              </button>
              
              <Link to="/contact" className="btn btn-outline inline-flex items-center">
                <FiHelpCircle className="mr-2" /> Liên hệ hỗ trợ
              </Link>
            </div>
          </motion.div>
          
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Bạn có thể thử các trang sau:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                to="/tours" 
                className="p-4 bg-white rounded-lg shadow-soft hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold mb-2">Tours</h3>
                <p className="text-sm text-gray-600">Khám phá các tour du lịch hấp dẫn</p>
              </Link>
              
              <Link 
                to="/hotels" 
                className="p-4 bg-white rounded-lg shadow-soft hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold mb-2">Khách sạn</h3>
                <p className="text-sm text-gray-600">Tìm kiếm và đặt phòng khách sạn</p>
              </Link>
              
              <Link 
                to="/flights" 
                className="p-4 bg-white rounded-lg shadow-soft hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold mb-2">Vé máy bay</h3>
                <p className="text-sm text-gray-600">Đặt vé máy bay giá tốt nhất</p>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-gray-500 text-sm">
            <p>Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
            <p>Mã lỗi: 404 - Không tìm thấy trang</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 