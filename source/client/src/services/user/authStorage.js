const AUTH_STORAGE_KEY = 'tourflow-auth';
const AUTH_EVENT_NAME = 'tourflow-auth-changed';

/**
 * Đọc thông tin đăng nhập hiện tại từ localStorage.
 */
export function getStoredAuth() {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * Lấy token hiện tại để gắn vào header Authorization khi gọi API.
 */
export function getAccessToken() {
  return getStoredAuth()?.token || '';
}

/**
 * Lấy refresh token hiện tại để làm mới phiên khi access token hết hạn.
 */
export function getRefreshToken() {
  return getStoredAuth()?.refreshToken || '';
}

/**
 * Lưu token và user sau khi đăng nhập hoặc đăng ký thành công.
 */
export function setStoredAuth(authData) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

/**
 * Cập nhật bộ token mới nhưng vẫn giữ user hiện tại nếu backend không trả lại.
 */
export function updateStoredTokens(authData) {
  const currentAuth = getStoredAuth() || {};
  setStoredAuth({
    ...currentAuth,
    ...authData,
    user: authData.user || currentAuth.user || null,
  });
}

/**
 * Đồng bộ riêng phần thông tin user khi người dùng cập nhật hồ sơ ngay trên giao diện.
 * Nhờ event auth bắn ra từ đây, Header sẽ đổi tên hiển thị ngay mà không cần tải lại trang.
 */
export function updateStoredUser(user) {
  const currentAuth = getStoredAuth() || {};
  setStoredAuth({
    ...currentAuth,
    user,
  });
}

/**
 * Xóa trạng thái đăng nhập hiện tại.
 */
export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

/**
 * Tên event dùng để các component đồng bộ lại trạng thái auth trong cùng tab.
 */
export function getAuthEventName() {
  return AUTH_EVENT_NAME;
}
