import { apiRequest } from './apiClient.js';
import { clearStoredAuth, getStoredAuth, setStoredAuth, updateStoredUser } from './authStorage.js';
import { isAdminPortalRole, syncAdminSession } from '../admin/adminAuthService.js';
import { clearStoredAdminAuth } from '../admin/adminAuthStorage.js';

/**
 * Đăng nhập bằng email hoặc username và lưu phiên làm việc vào localStorage.
 */
export async function login(payload) {
  const authData = await apiRequest('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  setStoredAuth(authData);
  syncAdminSession(authData);
  return authData;
}

/**
 * Đăng ký tài khoản mới rồi lưu luôn phiên đăng nhập vừa tạo.
 */
export async function register(payload) {
  const authData = await apiRequest('/auth/register', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  setStoredAuth(authData);
  syncAdminSession(authData);
  return authData;
}

/**
 * Gửi yêu cầu quên mật khẩu để backend tạo token reset hoặc xử lý email.
 */
export async function forgotPassword(payload) {
  return apiRequest('/auth/forgot-password', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Gửi token reset cùng mật khẩu mới để hoàn tất đặt lại mật khẩu.
 */
export async function resetPassword(payload) {
  return apiRequest('/auth/reset-password', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Lấy thông tin user hiện tại từ backend để đồng bộ trạng thái phiên.
 */
export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

/**
 * Khi app khởi động lại, gọi backend để nạp user mới nhất từ DB thay vì tin hoàn toàn vào localStorage.
 */
export async function syncCurrentSession() {
  const currentAuth = getStoredAuth();

  if (!currentAuth?.token) {
    return null;
  }

  const user = await getCurrentUser();
  updateStoredUser(user);
  syncAdminSession({
    ...currentAuth,
    user,
  });

  return user;
}

/**
 * Cập nhật thông tin hồ sơ và lưu lại user mới trong localStorage để header đổi ngay.
 * Đây là mắt xích nối luồng `trang tài khoản -> API /auth/me -> authStorage -> Header`.
 */
export async function updateProfile(payload) {
  const user = await apiRequest('/auth/me', {
    body: JSON.stringify(payload),
    method: 'PUT',
  });

  updateStoredUser(user);
  return user;
}

/**
 * Đổi mật khẩu cho tài khoản đang đăng nhập.
 * API này không tự đăng xuất người dùng, nhưng những lần đăng nhập cũ bằng mật khẩu cũ sẽ không còn hợp lệ nữa.
 */
export async function changePassword(payload) {
  return apiRequest('/auth/change-password', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Kiểm tra frontend có token đăng nhập hay chưa.
 */
export function isAuthenticated() {
  return Boolean(getStoredAuth()?.token);
}

/**
 * Trả user hiện đang lưu ở localStorage.
 */
export function getStoredUser() {
  return getStoredAuth()?.user || null;
}

/**
 * Xóa phiên đăng nhập hiện tại.
 */
export function logout() {
  clearStoredAuth();
  clearStoredAdminAuth();
}

/**
 * Kiểm tra user hiện tại có thuộc nhóm được dùng khu vực quản trị hay không.
 */
export function canAccessAdminPortal() {
  return isAdminPortalRole(getStoredUser()?.role);
}
