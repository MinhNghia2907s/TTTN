import { ApiError } from '../utils/apiError.js';

const ADMIN_PORTAL_ROLES = ['admin', 'staff'];
const STAFF_PERMISSIONS = [
  'admin.meta.read',
  'admin.users.read',
  'admin.tours.read',
  'admin.tours.create',
  'admin.tours.update',
  'admin.bookings.read',
  'admin.bookings.update_status',
  'admin.payments.read',
  'admin.payments.update_status',
];

/**
 * Middleware này là cổng cuối trước admin API.
 * Dù frontend đã có route guard, backend vẫn phải tự kiểm tra lại để đảm bảo an toàn.
 */

/**
 * Chặn người dùng thường truy cập khu vực admin, chỉ cho phép tài khoản quản trị hoặc vận hành đi tiếp.
 */
export function authorizeAdmin(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Bạn cần đăng nhập để truy cập khu vực quản trị.'));
  }

  if (req.user.status !== 'active') {
    return next(new ApiError(403, 'Tài khoản hiện không ở trạng thái hoạt động để vào khu quản trị.'));
  }

  if (!ADMIN_PORTAL_ROLES.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền truy cập khu vực quản trị.'));
  }

  return next();
}

function normalizeAdminRole(role) {
  return ADMIN_PORTAL_ROLES.includes(role) ? role : null;
}

function getAdminPermissionsByRole(role) {
  const normalizedRole = normalizeAdminRole(role);

  if (normalizedRole === 'admin') {
    return ['*'];
  }

  if (normalizedRole === 'staff') {
    return STAFF_PERMISSIONS;
  }

  return [];
}

function hasAdminPermission(role, permission) {
  const permissions = getAdminPermissionsByRole(role);
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Chốt quyền chi tiết cho từng endpoint admin sau khi đã xác thực portal.
 */
export function authorizeAdminPermission(permission) {
  return function checkAdminPermission(req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ thá»±c hiá»‡n thao tÃ¡c nÃ y.'));
    }

    if (hasAdminPermission(req.user.role, permission)) {
      return next();
    }

    return next(new ApiError(403, 'Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c nÃ y.'));
  };
}
