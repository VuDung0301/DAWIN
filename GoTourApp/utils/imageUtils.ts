/**
 * Các tiện ích xử lý URL hình ảnh
 */

/**
 * Chuyển đổi URL hình ảnh từ localhost sang địa chỉ IP máy ảo Android
 * @param url URL hình ảnh gốc
 * @returns URL đã được chuyển đổi
 */
export const fixImageUrl = (url: string | undefined): string => {
  if (!url) return 'https://via.placeholder.com/300x200/eee?text=No+Image';
  
  // Thay thế localhost hoặc 127.0.0.1 bằng 10.0.2.2 cho máy ảo Android
  return url.replace(/http:\/\/(localhost|127\.0\.0\.1):5001/g, 'http://10.0.2.2:5001');
};

/**
 * Xử lý danh sách URL hình ảnh
 * @param urls Mảng các URL hình ảnh
 * @returns Mảng các URL đã được chuyển đổi
 */
export const fixImageUrls = (urls: string[] | undefined): string[] => {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return [];
  }
  
  return urls.map(url => fixImageUrl(url));
};

/**
 * Lấy URL hình ảnh đại diện từ nhiều nguồn (coverImage, gallery)
 * @param coverImage URL hình ảnh đại diện
 * @param gallery Mảng các URL hình ảnh
 * @returns URL hình ảnh đại diện đã được chuyển đổi
 */
export const getThumbnailImage = (coverImage: string | undefined, gallery: string[] | undefined): string => {
  const defaultImage = 'https://via.placeholder.com/300x200/eee?text=No+Image';
  
  // Ưu tiên coverImage
  if (coverImage) {
    return fixImageUrl(coverImage);
  }
  
  // Nếu không có coverImage, lấy ảnh đầu tiên từ gallery
  if (gallery && Array.isArray(gallery) && gallery.length > 0) {
    return fixImageUrl(gallery[0]);
  }
  
  // Nếu không có ảnh nào, trả về ảnh mặc định
  return defaultImage;
}; 