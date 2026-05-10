import { apiRequest } from '../user/apiClient.js';

let adminMetaCache = null;
let adminMetaPromise = null;

/**
 * Lấy metadata dùng chung cho khu vực admin và cache lại để các page tái sử dụng.
 *
 * Lý do cache ở tầng service:
 * - nhiều màn admin cùng cần các option giống nhau
 * - metadata này thay đổi ít hơn dữ liệu nghiệp vụ
 * - tránh việc mỗi lần chuyển trang lại gọi `/admin/meta` một lần mới
 *
 * `adminMetaPromise` giúp các request song song dùng chung một promise đang chạy,
 * nhờ đó tránh bắn nhiều request trùng nhau khi trang vừa mount.
 */
export async function getAdminMeta(forceRefresh = false) {
  if (!forceRefresh && adminMetaCache) {
    return adminMetaCache;
  }

  if (!forceRefresh && adminMetaPromise) {
    return adminMetaPromise;
  }

  adminMetaPromise = apiRequest('/admin/meta')
    .then((meta) => {
      adminMetaCache = meta;
      return meta;
    })
    .finally(() => {
      adminMetaPromise = null;
    });

  return adminMetaPromise;
}
