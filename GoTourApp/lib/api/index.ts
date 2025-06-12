import { hotelsApi as originalHotelsApi, reviewsApi } from '../api';

// Tạo bản sao của hotelsApi với các alias phương thức để tương thích với code hiện tại
export const hotelsApi = {
  ...originalHotelsApi,
  // Thêm các alias cho các phương thức
  getHotels: originalHotelsApi.getAll,
  getHotelRooms: originalHotelsApi.getRooms,
  getHotelReviews: reviewsApi.getHotelReviews,
  checkRoomAvailability: (hotelId: string, roomId: string, checkIn: string, checkOut: string) => {
    // Gọi checkAvailability từ lib/api.ts
    return originalHotelsApi.checkAvailability(hotelId, {
      checkIn,
      checkOut,
      guests: 2 // Giá trị mặc định
    });
  }
}; 