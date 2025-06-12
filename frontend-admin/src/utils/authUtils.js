
// Kiểm tra token có hết hạn chưa
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
}; 