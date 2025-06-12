/**
 * Định dạng số tiền thành dạng tiền tệ Việt Nam
 * @param amount - Số tiền cần định dạng
 * @returns Chuỗi tiền tệ đã định dạng (ví dụ: 1.500.000 ₫)
 */
export const formatCurrency = (amount: number): string => {
  if (!amount && amount !== 0) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0 
  }).format(amount);
};

/**
 * Định dạng ngày thành chuỗi ngày tháng Việt Nam
 * @param date - Ngày cần định dạng
 * @returns Chuỗi ngày tháng đã định dạng (ví dụ: 01/01/2023)
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Định dạng thời gian thành chuỗi giờ phút
 * @param time - Thời gian cần định dạng (Date hoặc chuỗi ISO)
 * @returns Chuỗi giờ phút đã định dạng (ví dụ: 15:30)
 */
export const formatTime = (time: Date | string): string => {
  if (!time) return '';
  
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(timeObj);
};

/**
 * Định dạng khoảng thời gian thành chuỗi hh giờ mm phút
 * @param minutes - Số phút của khoảng thời gian
 * @returns Chuỗi khoảng thời gian đã định dạng (ví dụ: 2 giờ 30 phút)
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes && minutes !== 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours} giờ ${mins} phút`;
  } else if (hours > 0) {
    return `${hours} giờ`;
  } else {
    return `${mins} phút`;
  }
}; 