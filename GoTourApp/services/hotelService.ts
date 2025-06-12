import { apiGet, apiPost, API_URL } from '@/lib/api/apiClient';
import { Hotel, HotelFilter } from '@/types';

// Lấy danh sách tất cả khách sạn
export const getHotels = async () => {
  try {
    const response = await apiGet(`${API_URL}/hotels`);
    return response;
  } catch (error) {
    console.error('Error in getHotels:', error);
    return { success: false, message: 'Không thể tải danh sách khách sạn' };
  }
};

// Lấy khách sạn nổi bật
export const getFeaturedHotels = async () => {
  try {
    // Sử dụng API chung nếu không có endpoint riêng cho khách sạn nổi bật
    const response = await apiGet(`${API_URL}/hotels?featured=true`);
    return response;
  } catch (error) {
    console.error('Error in getFeaturedHotels:', error);
    return { success: false, message: 'Không thể tải khách sạn nổi bật' };
  }
};

// Lấy thông tin chi tiết khách sạn theo ID
export const getHotelById = async (id: string) => {
  try {
    const response = await apiGet(`${API_URL}/hotels/${id}`);
    return response;
  } catch (error) {
    console.error(`Error in getHotelById for ${id}:`, error);
    return { success: false, message: 'Không thể tải thông tin khách sạn' };
  }
};

// Tìm kiếm khách sạn theo từ khóa
export const searchHotels = async (query: string | { [key: string]: any }) => {
  try {
    // Xử lý query là string
    if (typeof query === 'string') {
      const response = await apiGet(`${API_URL}/hotels/search?q=${encodeURIComponent(query)}`);
      return response;
    } 
    // Xử lý query là object
    else {
      const queryParams = Object.entries(query)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');
      
      const response = await apiGet(`${API_URL}/hotels/search?${queryParams}`);
      return response;
    }
  } catch (error) {
    console.error(`Error in searchHotels:`, error);
    return { success: false, message: 'Không thể tìm kiếm khách sạn' };
  }
};

// Lọc khách sạn theo tiêu chí
export const filterHotels = async (filters: HotelFilter) => {
  try {
    // Xây dựng query string từ bộ lọc
    const queryParams = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}=${value.join(',')}`;
        }
        return `${key}=${encodeURIComponent(value)}`;
      })
      .join('&');

    const response = await apiGet(`${API_URL}/hotels?${queryParams}`);
    return response;
  } catch (error) {
    console.error('Error in filterHotels:', error);
    return { success: false, message: 'Không thể lọc khách sạn' };
  }
};

// Lấy khách sạn theo thành phố
export const getHotelsByCity = async (city: string) => {
  try {
    const response = await apiGet(`${API_URL}/hotels?city=${encodeURIComponent(city)}`);
    return response;
  } catch (error) {
    console.error(`Error in getHotelsByCity for ${city}:`, error);
    return { success: false, message: 'Không thể tải khách sạn theo thành phố' };
  }
};

// Lấy khách sạn theo danh mục
export const getHotelsByCategory = async (category: string) => {
  try {
    const response = await apiGet(`${API_URL}/hotels?category=${encodeURIComponent(category)}`);
    return response;
  } catch (error) {
    console.error(`Error in getHotelsByCategory for ${category}:`, error);
    return { success: false, message: 'Không thể tải khách sạn theo danh mục' };
  }
};

// Lấy danh sách phòng của khách sạn
export const getHotelRooms = async (hotelId: string) => {
  try {
    const response = await apiGet(`${API_URL}/hotels/${hotelId}/rooms`);
    return response;
  } catch (error) {
    console.error(`Error in getHotelRooms for ${hotelId}:`, error);
    return { success: false, message: 'Không thể tải danh sách phòng' };
  }
};

// Lấy danh sách đánh giá của khách sạn
export const getHotelReviews = async (hotelId: string) => {
  try {
    const response = await apiGet(`${API_URL}/reviews/hotel/${hotelId}`);
    return response;
  } catch (error) {
    console.error(`Error in getHotelReviews for ${hotelId}:`, error);
    return { success: false, message: 'Không thể tải đánh giá' };
  }
};

// Kiểm tra tình trạng phòng còn trống
export const checkRoomAvailability = async (hotelId: string, roomId: string, checkIn: string, checkOut: string) => {
  try {
    const response = await apiGet(`${API_URL}/hotels/${hotelId}/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
    return response;
  } catch (error) {
    console.error(`Error in checkRoomAvailability:`, error);
    return { success: false, message: 'Không thể kiểm tra tình trạng phòng' };
  }
};

export const hotelService = {
  getHotels,
  getFeaturedHotels,
  getHotelById,
  searchHotels,
  filterHotels,
  getHotelsByCity,
  getHotelsByCategory,
  getHotelRooms,
  getHotelReviews,
  checkRoomAvailability
}; 