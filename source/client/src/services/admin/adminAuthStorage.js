const ADMIN_AUTH_STORAGE_KEY = 'tourflow-admin-auth';
const ADMIN_AUTH_EVENT_NAME = 'tourflow-admin-auth-changed';

/**
 * File này chỉ lo phần lưu/đọc session admin ở localStorage.
 * Mọi rule về role và guard nằm ở `adminAuthService.js`.
 */

/**
 * Đọc session đăng nhập của admin từ localStorage.
 */
export function getStoredAdminAuth() {
  const rawValue = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * Lưu session admin và phát event để layout đồng bộ giao diện ngay lập tức.
 */
export function setStoredAdminAuth(authData) {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(authData));
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT_NAME));
}

/**
 * Xóa session admin khi đăng xuất khỏi khu vực quản trị.
 */
export function clearStoredAdminAuth() {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT_NAME));
}

/**
 * Tên event dùng để các component admin lắng nghe thay đổi session.
 */
export function getAdminAuthEventName() {
  return ADMIN_AUTH_EVENT_NAME;
}
