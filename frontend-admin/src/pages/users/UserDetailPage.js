import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaEnvelope, FaPhone, FaUserCircle, FaCalendarAlt, FaCreditCard, FaMapMarkerAlt, FaLock, FaUnlock } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { usersAPI } from '../../services/api';

const UserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getById(id);
        
        if (response.success) {
          setUser(response.data);
          
          // Tải thêm lịch sử đặt phòng, tour, vé (nếu có API)
          try {
            const bookingsResponse = await usersAPI.getUserBookings(id);
            if (bookingsResponse.success) {
              setBookings(bookingsResponse.data);
            }
          } catch (bookingError) {
            console.error('Error fetching user bookings:', bookingError);
          }
        } else {
          setError('Không thể tải thông tin khách hàng');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu khách hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleToggleAccountStatus = async () => {
    const action = user.isActive ? 'khóa' : 'mở khóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này không?`)) {
      try {
        const response = await usersAPI.updateStatus(id, { isActive: !user.isActive });
        if (response.success) {
          alert(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công!`);
          setUser(prev => ({ ...prev, isActive: !prev.isActive }));
        } else {
          alert(`Không thể ${action} tài khoản. Vui lòng thử lại sau.`);
        }
      } catch (error) {
        console.error('Update account status error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
          <p className="text-red-500 mb-4">{error || 'Không thể tải thông tin khách hàng'}</p>
          <Link to="/users" className="flex items-center text-indigo-600 hover:text-indigo-800">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách khách hàng
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/users" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <FaArrowLeft className="mr-2" />
            Quay lại danh sách khách hàng
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Thông tin cá nhân */}
          <div className="w-full md:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                <Link 
                  to={`/users/edit/${user._id}`} 
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <FaEdit size={20} />
                </Link>
              </div>
              
              <div className="flex flex-col items-center mb-6">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <FaUserCircle size={80} />
                  </div>
                )}
                
                <h3 className="text-xl font-bold mt-4">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</h3>
                
                <div className="flex items-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                  
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                    {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-gray-500 text-sm">Email</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaPhone className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-gray-500 text-sm">Số điện thoại</p>
                    <p>{user.phone || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-gray-500 text-sm">Ngày tham gia</p>
                    <p>{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                
                {user.address && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-gray-500 text-sm">Địa chỉ</p>
                      <p>{user.address}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleToggleAccountStatus}
                  className={`w-full py-2 px-4 rounded flex items-center justify-center ${
                    user.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {user.isActive ? (
                    <>
                      <FaLock className="mr-2" />
                      Khóa tài khoản
                    </>
                  ) : (
                    <>
                      <FaUnlock className="mr-2" />
                      Mở khóa tài khoản
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Phần bên phải: Lịch sử đặt */}
          <div className="w-full md:w-2/3">
            {/* Thông tin thêm */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Thông tin bổ sung</h2>
              
              {user.bio ? (
                <div className="mb-4">
                  <h3 className="text-gray-700 font-semibold mb-2">Giới thiệu</h3>
                  <p className="text-gray-600">{user.bio}</p>
                </div>
              ) : null}
              
              {user.preferences ? (
                <div>
                  <h3 className="text-gray-700 font-semibold mb-2">Sở thích</h3>
                  <p className="text-gray-600">{user.preferences}</p>
                </div>
              ) : null}
            </div>
            
            {/* Lịch sử đặt */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Lịch sử đặt chỗ</h2>
              
              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã đơn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dịch vụ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày đặt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tổng tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {booking._id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {booking.type === 'hotel' ? 'Khách sạn' : 
                             booking.type === 'tour' ? 'Tour' : 
                             booking.type === 'flight' ? 'Vé máy bay' : 
                             'Khác'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {booking.hotel?.name || booking.tour?.name || booking.flight?.flightNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatCurrency(booking.totalPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                              {booking.status === 'confirmed' ? 'Đã xác nhận' : 
                               booking.status === 'cancelled' ? 'Đã hủy' : 
                               booking.status === 'completed' ? 'Hoàn thành' : 
                               'Chờ xác nhận'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded text-gray-500 text-center">
                  Khách hàng chưa có đơn đặt chỗ nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetailPage; 