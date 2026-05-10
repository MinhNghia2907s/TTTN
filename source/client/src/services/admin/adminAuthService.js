import { apiRequest } from '../user/apiClient.js';
import { clearStoredAuth, setStoredAuth } from '../user/authStorage.js';
import { clearStoredAdminAuth, getStoredAdminAuth, setStoredAdminAuth } from './adminAuthStorage.js';

const ADMIN_PORTAL_ROLES = ['admin', 'staff'];
export const ADMIN_PERMISSION_KEYS = {
  META_READ: 'admin.meta.read',
  USERS_READ: 'admin.users.read',
  USERS_UPDATE: 'admin.users.update',
  USERS_DELETE: 'admin.users.delete',
  TOURS_READ: 'admin.tours.read',
  TOURS_CREATE: 'admin.tours.create',
  TOURS_UPDATE: 'admin.tours.update',
  TOURS_DELETE: 'admin.tours.delete',
  BOOKINGS_READ: 'admin.bookings.read',
  BOOKINGS_UPDATE_STATUS: 'admin.bookings.update_status',
  BOOKINGS_DELETE: 'admin.bookings.delete',
  PAYMENTS_READ: 'admin.payments.read',
  PAYMENTS_UPDATE_STATUS: 'admin.payments.update_status',
  PAYMENTS_REFUND: 'admin.payments.refund',
};
const STAFF_PERMISSIONS = [
  ADMIN_PERMISSION_KEYS.META_READ,
  ADMIN_PERMISSION_KEYS.USERS_READ,
  ADMIN_PERMISSION_KEYS.TOURS_READ,
  ADMIN_PERMISSION_KEYS.TOURS_CREATE,
  ADMIN_PERMISSION_KEYS.TOURS_UPDATE,
  ADMIN_PERMISSION_KEYS.BOOKINGS_READ,
  ADMIN_PERMISSION_KEYS.BOOKINGS_UPDATE_STATUS,
  ADMIN_PERMISSION_KEYS.PAYMENTS_READ,
  ADMIN_PERMISSION_KEYS.PAYMENTS_UPDATE_STATUS,
];

/**
 * Auth admin dùng chung payload login với khu user,
 * nhưng giữ thêm một lớp session riêng cho route `/admin`
 * để UI quản trị có thể kiểm soát guard và layout độc lập.
 */

/**
 * Chuẩn hóa role cũ về bộ role mới để các session lưu từ bản trước không làm lệch route guard.
 */
function normalizeRole(role) {
  if (role === 'customer') {
    return 'user';
  }

  if (role === 'admin' || role === 'staff' || role === 'user') {
    return role;
  }

  return 'user';
}

/**
 * Kiểm tra một role có được phép đi vào khu vực quản trị hay không.
 */
export function isAdminPortalRole(role) {
  return ADMIN_PORTAL_ROLES.includes(normalizeRole(role));
}

export function getAdminPermissions(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') {
    return ['*'];
  }

  if (normalizedRole === 'staff') {
    return STAFF_PERMISSIONS;
  }

  return [];
}

export function hasAdminPermission(permission, adminUser = getStoredAdminUser()) {
  const permissions = Array.isArray(adminUser?.permissions) ? adminUser.permissions : getAdminPermissions(adminUser?.role);
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Đồng bộ session admin từ auth payload thật của backend để route `/admin` dùng chung đúng token hiện tại.
 */
export function syncAdminSession(authData) {
  const currentRole = normalizeRole(authData?.user?.role);

  if (!authData?.token || !isAdminPortalRole(currentRole)) {
    clearStoredAdminAuth();
    return null;
  }

  setStoredAdminAuth({
    refreshToken: authData.refreshToken,
    token: authData.token,
    user: {
      ...authData.user,
      permissions: getAdminPermissions(currentRole),
      role: currentRole,
      title: currentRole === 'admin' ? 'Quản trị hệ thống' : 'Nhân viên vận hành',
    },
  });

  return authData;
}

/**
 * Đăng nhập admin bằng tài khoản thật từ backend, sau đó đồng bộ cả phiên user và phiên admin.
 */
export async function loginAdmin(payload) {
  const authData = await apiRequest('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  setStoredAuth(authData);
  syncAdminSession(authData);
  return authData;
}

/**
 * Kiểm tra admin đã có session đăng nhập trên frontend hay chưa.
 */
export function isAdminAuthenticated() {
  const authData = getStoredAdminAuth();
  const currentRole = normalizeRole(authData?.user?.role);
  return Boolean(authData?.token) && isAdminPortalRole(currentRole);
}

/**
 * Trả về thông tin admin đang đăng nhập để hiển thị ở layout.
 */
export function getStoredAdminUser() {
  const storedUser = getStoredAdminAuth()?.user;

  if (!storedUser) {
    return null;
  }

  return {
    ...storedUser,
    permissions: Array.isArray(storedUser.permissions) ? storedUser.permissions : getAdminPermissions(storedUser.role),
    role: normalizeRole(storedUser.role),
  };
}

/**
 * Xóa cả session admin và session auth chung khi đăng xuất khỏi khu vực quản trị.
 */
export function logoutAdmin() {
  clearStoredAdminAuth();
  clearStoredAuth();
}
