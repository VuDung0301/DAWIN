import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiGlobe, 
  FiUsers, 
  FiAward, 
  FiHeart, 
  FiShield, 
  FiStar,
  FiLinkedin,
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiTrendingUp
} from 'react-icons/fi';

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState('about');

  // Dữ liệu đội ngũ
  const teamMembers = [
    {
      id: 1,
      name: 'Nguyễn Văn An',
      position: 'CEO & Founder',
      image: '/images/team/ceo.jpg',
      description: 'Với hơn 15 năm kinh nghiệm trong ngành du lịch, An đã dẫn dắt Dawin trở thành một trong những nền tảng du lịch hàng đầu Việt Nam.',
      social: {
        linkedin: '#',
        facebook: '#'
      }
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      position: 'Head of Operations',
      image: '/images/team/operations.jpg',
      description: 'Bình chịu trách nhiệm vận hành và đảm bảo chất lượng dịch vụ của Dawin với đội ngũ hơn 50 nhân viên chuyên nghiệp.',
      social: {
        linkedin: '#',
        instagram: '#'
      }
    },
    {
      id: 3,
      name: 'Lê Minh Cường',
      position: 'Head of Technology',
      image: '/images/team/tech.jpg',
      description: 'Cường là người đứng sau công nghệ của Dawin, với kinh nghiệm phát triển các hệ thống quy mô lớn.',
      social: {
        linkedin: '#',
        github: '#'
      }
    },
    {
      id: 4,
      name: 'Phạm Thu Hà',
      position: 'Head of Marketing',
      image: '/images/team/marketing.jpg',
      description: 'Hà đảm trách việc xây dựng thương hiệu và kết nối Dawin với hàng triệu khách hàng trên khắp Việt Nam.',
      social: {
        linkedin: '#',
        facebook: '#',
        instagram: '#'
      }
    }
  ];

  // Dữ liệu thành tích
  const achievements = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      number: '2M+',
      label: 'Khách hàng tin tưởng',
      description: 'Phục vụ hơn 2 triệu lượt khách hàng'
    },
    {
      icon: <FiMapPin className="w-8 h-8" />,
      number: '500+',
      label: 'Điểm đến',
      description: 'Bao phủ 63 tỉnh thành và quốc tế'
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      number: '50+',
      label: 'Giải thưởng',
      description: 'Được công nhận bởi các tổ chức uy tín'
    },
    {
      icon: <FiStar className="w-8 h-8" />,
      number: '4.8/5',
      label: 'Đánh giá',
      description: 'Điểm đánh giá trung bình từ khách hàng'
    }
  ];

  // Dữ liệu giá trị cốt lõi
  const values = [
    {
      icon: <FiHeart className="w-12 h-12" />,
      title: 'Tận tâm',
      description: 'Chúng tôi luôn đặt khách hàng làm trung tâm, tận tâm phục vụ với chất lượng tốt nhất.'
    },
    {
      icon: <FiShield className="w-12 h-12" />,
      title: 'Tin cậy',
      description: 'Minh bạch, đáng tin cậy trong mọi giao dịch và cam kết với khách hàng.'
    },
    {
      icon: <FiTrendingUp className="w-12 h-12" />,
      title: 'Đổi mới',
      description: 'Không ngừng đổi mới công nghệ và dịch vụ để mang lại trải nghiệm tốt nhất.'
    },
    {
      icon: <FiGlobe className="w-12 h-12" />,
      title: 'Toàn cầu',
      description: 'Kết nối du lịch Việt Nam với thế giới, nâng tầm trải nghiệm du lịch.'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              >
                Về <span className="text-primary-600">Dawin</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Dawin là nền tảng du lịch hàng đầu Việt Nam, kết nối bạn với những trải nghiệm du lịch tuyệt vời nhất. 
                Chúng tôi cam kết mang đến dịch vụ chất lượng cao với giá cả hợp lý.
              </motion.p>
            </div>

            {/* Thành tích */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {achievements.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className="text-primary-600 mb-4 flex justify-center">
                    {item.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{item.number}</div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </motion.div>
              ))}
            </div>

            {/* Câu chuyện công ty */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Câu chuyện của chúng tôi</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Dawin được thành lập vào năm 2019 với mục tiêu làm cho du lịch trở nên dễ dàng và tiếp cận hơn cho mọi người. 
                    Bắt đầu từ một startup nhỏ, chúng tôi đã phát triển thành một trong những nền tảng du lịch hàng đầu tại Việt Nam.
                  </p>
                  <p>
                    Với sự đam mê về du lịch và công nghệ, chúng tôi đã xây dựng một hệ sinh thái hoàn chỉnh bao gồm đặt tour, 
                    khách sạn, vé máy bay và nhiều dịch vụ du lịch khác. Mỗi ngày, hàng nghìn khách hàng tin tưởng lựa chọn 
                    Dawin cho hành trình khám phá của mình.
                  </p>
                  <p>
                    Chúng tôi tin rằng du lịch không chỉ là việc di chuyển từ nơi này đến nơi khác, mà là cơ hội để tạo nên 
                    những kỷ niệm đẹp, khám phá văn hóa mới và kết nối với con người.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <img 
                  src="/images/about/story.jpg" 
                  alt="Dawin Story" 
                  className="rounded-lg shadow-lg w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = '/images/hero-bg.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              </motion.div>
            </div>

            {/* Tầm nhìn và sứ mệnh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-primary-50 p-8 rounded-xl"
              >
                <h3 className="text-2xl font-bold text-primary-900 mb-4">Tầm nhìn</h3>
                <p className="text-primary-700">
                  Trở thành nền tảng du lịch số 1 Đông Nam Á, kết nối mọi người với những trải nghiệm du lịch tuyệt vời 
                  và góp phần phát triển ngành du lịch bền vững.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-blue-50 p-8 rounded-xl"
              >
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Sứ mệnh</h3>
                <p className="text-blue-700">
                  Làm cho du lịch trở nên dễ dàng, tiện lợi và đáng tin cậy thông qua công nghệ tiên tiến và dịch vụ 
                  khách hàng xuất sắc.
                </p>
              </motion.div>
            </div>
          </div>
        );
      
      case 'team':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Đội ngũ lãnh đạo</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những con người tài năng và đam mê đứng sau thành công của Dawin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white p-6 rounded-xl shadow-soft hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3B82F6&color=fff&size=80`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-primary-600 font-medium mb-2">{member.position}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                      
                      <div className="flex space-x-3 mt-4">
                        {member.social.linkedin && (
                          <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <FiLinkedin className="w-5 h-5" />
                          </a>
                        )}
                        {member.social.facebook && (
                          <a href={member.social.facebook} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <FiFacebook className="w-5 h-5" />
                          </a>
                        )}
                        {member.social.instagram && (
                          <a href={member.social.instagram} className="text-gray-400 hover:text-pink-600 transition-colors">
                            <FiInstagram className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'values':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Những giá trị định hướng mọi hoạt động và quyết định của chúng tôi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white p-8 rounded-xl shadow-soft hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-primary-600 mb-6 flex justify-center">
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-gray-900">Thông tin liên hệ</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-primary-600 mt-1">
                      <FiMapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Địa chỉ</h4>
                      <p className="text-gray-600">
                        123 Đường Lê Lợi, Quận 1,<br />
                        Thành phố Hồ Chí Minh, Việt Nam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="text-primary-600 mt-1">
                      <FiPhone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Điện thoại</h4>
                      <p className="text-gray-600">
                        Hotline: <a href="tel:1900123456" className="text-primary-600 hover:underline">1900 123 456</a><br />
                        Di động: <a href="tel:0909123456" className="text-primary-600 hover:underline">0909 123 456</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="text-primary-600 mt-1">
                      <FiMail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <p className="text-gray-600">
                        Hỗ trợ: <a href="mailto:support@dawin.vn" className="text-primary-600 hover:underline">support@dawin.vn</a><br />
                        Kinh doanh: <a href="mailto:business@dawin.vn" className="text-primary-600 hover:underline">business@dawin.vn</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="text-primary-600 mt-1">
                      <FiGlobe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Website</h4>
                      <p className="text-gray-600">
                        <a href="https://dawin.vn" className="text-primary-600 hover:underline">www.dawin.vn</a>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Theo dõi chúng tôi</h4>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <FiFacebook className="w-6 h-6" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors">
                      <FiInstagram className="w-6 h-6" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                      <FiTwitter className="w-6 h-6" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <FiLinkedin className="w-6 h-6" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h3>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                        placeholder="Nhập email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option>Hỗ trợ khách hàng</option>
                      <option>Đặt tour</option>
                      <option>Đặt khách sạn</option>
                      <option>Đặt vé máy bay</option>
                      <option>Khiếu nại</option>
                      <option>Khác</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tin nhắn</label>
                    <textarea 
                      rows="5" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                      placeholder="Nhập tin nhắn của bạn..."
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Gửi tin nhắn
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Content */}
      <div className="container py-12">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AboutPage;