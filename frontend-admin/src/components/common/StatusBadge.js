import React from 'react';

/**
 * Component hiển thị trạng thái với màu sắc tương ứng
 * @param {string} status - Trạng thái gốc
 * @param {string} text - Văn bản hiển thị (nếu có)
 * @param {string} type - Loại trạng thái (hotel, tour, booking, flight)
 */
const StatusBadge = ({ status, text, type = 'booking' }) => {
  let className = 'inline-block px-2 py-1 text-xs font-semibold rounded-full ';
  let displayText = text || status;

  if (type === 'booking') {
    // Trạng thái cho đặt phòng/tour
    switch (status) {
      case 'pending':
        className += 'bg-yellow-100 text-yellow-800';
        displayText = text || 'Chờ xác nhận';
        break;
      case 'confirmed':
        className += 'bg-green-100 text-green-800';
        displayText = text || 'Đã xác nhận';
        break;
      case 'canceled':
      case 'cancelled':
        className += 'bg-red-100 text-red-800';
        displayText = text || 'Đã hủy';
        break;
      case 'completed':
        className += 'bg-blue-100 text-blue-800';
        displayText = text || 'Hoàn thành';
        break;
      default:
        className += 'bg-gray-100 text-gray-800';
    }
  } else if (type === 'hotel' || type === 'tour') {
    // Trạng thái cho khách sạn/tour
    switch (status) {
      case 'active':
        className += 'bg-green-100 text-green-800';
        displayText = text || 'Đang hoạt động';
        break;
      case 'inactive':
        className += 'bg-gray-100 text-gray-800';
        displayText = text || 'Không hoạt động';
        break;
      case 'featured':
        className += 'bg-purple-100 text-purple-800';
        displayText = text || 'Nổi bật';
        break;
      default:
        className += 'bg-gray-100 text-gray-800';
    }
  } else if (type === 'flight') {
    // Trạng thái cho chuyến bay
    switch (status) {
      case 'scheduled':
        className += 'bg-blue-100 text-blue-800';
        displayText = text || 'Lịch trình';
        break;
      case 'active':
        className += 'bg-green-100 text-green-800';
        displayText = text || 'Đang bay';
        break;
      case 'landed':
        className += 'bg-indigo-100 text-indigo-800';
        displayText = text || 'Đã hạ cánh';
        break;
      case 'delayed':
        className += 'bg-yellow-100 text-yellow-800';
        displayText = text || 'Trễ';
        break;
      case 'diverted':
        className += 'bg-purple-100 text-purple-800';
        displayText = text || 'Chuyển hướng';
        break;
      case 'cancelled':
        className += 'bg-red-100 text-red-800';
        displayText = text || 'Đã hủy';
        break;
      case 'incident':
        className += 'bg-orange-100 text-orange-800';
        displayText = text || 'Sự cố';
        break;
      case 'Đúng giờ':
        className += 'bg-green-100 text-green-800';
        break;
      case 'Trễ':
        className += 'bg-yellow-100 text-yellow-800';
        break;
      case 'Hủy':
        className += 'bg-red-100 text-red-800';
        break;
      case 'Đã bay':
        className += 'bg-blue-100 text-blue-800';
        break;
      default:
        className += 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};

export default StatusBadge; 