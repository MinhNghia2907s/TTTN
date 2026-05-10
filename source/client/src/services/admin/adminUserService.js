import { apiRequest } from '../user/apiClient.js';

/**
 * UI list/detail đôi lúc chỉ muốn bật/tắt cờ xóa mềm hoặc trạng thái,
 * nhưng backend user update chấp nhận patch trực tiếp nên service này
 * giữ API mỏng và để page quyết định payload cần gửi.
 */

/**
 * Lấy danh sách người dùng cho khu vực quản trị.
 */
export function getAdminUsers() {
  return apiRequest('/admin/users');
}

/**
 * Lấy chi tiết một người dùng theo id.
 */
export function getAdminUserDetail(userId) {
  return apiRequest(`/admin/users/${userId}`);
}

/**
 * Cập nhật hồ sơ người dùng từ khu vực admin.
 */
export function updateAdminUser(userId, payload) {
  return apiRequest(`/admin/users/${userId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

/**
 * Xóa mềm hoặc khôi phục người dùng tùy vào trạng thái hiện tại.
 */
export function toggleAdminUserDeleteFlag(user) {
  if (user.deleteFlg) {
    // Khi khôi phục tài khoản từng bị xóa mềm, ưu tiên bật lại trạng thái active để admin thấy ngay trong danh sách.
    return updateAdminUser(user.id, {
      deleteFlg: false,
      status: user.status === 'inactive' ? 'active' : user.status,
    });
  }

  return apiRequest(`/admin/users/${user.id}`, {
    method: 'DELETE',
  });
}
