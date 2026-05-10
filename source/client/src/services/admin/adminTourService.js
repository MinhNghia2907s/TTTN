import { apiRequest } from '../user/apiClient.js';
import { getAccessToken } from '../user/authStorage.js';

/**
 * Backend tour update hiện nhận payload đầy đủ của tour.
 * Vì vậy các thao tác nhanh ở UI (đổi status, khôi phục, xóa mềm) cần
 * dựng lại payload hoàn chỉnh từ dữ liệu tour hiện tại trước khi gọi `PUT`.
 */
function buildTourMutationPayload(tour, overrides = {}) {
  return {
    title: overrides.title ?? tour.title,
    location: overrides.location ?? tour.location,
    departurePoint: overrides.departurePoint ?? tour.departurePoint,
    category: overrides.category ?? tour.category,
    durationDays: Number(overrides.durationDays ?? tour.durationDays ?? 0),
    price: Number(overrides.price ?? tour.price ?? 0),
    imageUrl: overrides.imageUrl ?? tour.imageUrl ?? '',
    description: overrides.description ?? tour.description ?? '',
    highlights: overrides.highlights ?? tour.highlights ?? [],
    inclusions: overrides.inclusions ?? tour.inclusions ?? [],
    status: overrides.status ?? tour.status ?? 'draft',
    deleteFlg: Boolean(overrides.deleteFlg ?? tour.deleteFlg),
    itinerary: overrides.itinerary ?? tour.itinerary ?? [],
    departures: overrides.departures ?? tour.departures ?? [],
  };
}

/**
 * Lấy danh sách tour cho khu vực quản trị.
 */
export function getAdminTours() {
  return apiRequest('/admin/tours');
}

/**
 * Lấy chi tiết một tour theo id.
 */
export function getAdminTourDetail(tourId) {
  return apiRequest(`/admin/tours/${tourId}`);
}

/**
 * Tạo tour mới từ form quản trị.
 */
export function createAdminTour(payload) {
  return apiRequest('/admin/tours', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Tải file Excel mẫu từ backend. Dùng fetch riêng vì response là blob, không phải JSON.
 */
export async function downloadTourImportTemplate() {
  const response = await fetch(`${__API_BASE_URL__}/admin/tours/import/template`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Không thể tải file mẫu.' }));
    throw new Error(errorData.message || 'Không thể tải file mẫu.');
  }

  return response.blob();
}

/**
 * Upload file Excel import tour. Backend nhận field `file` trong FormData.
 */
export function importAdminToursFromExcel(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/admin/tours/import', {
    body: formData,
    method: 'POST',
  });
}

/**
 * Cập nhật toàn bộ thông tin tour.
 */
export function updateAdminTour(tourId, payload) {
  return apiRequest(`/admin/tours/${tourId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

/**
 * Đổi nhanh trạng thái tour bằng cách nạp chi tiết hiện tại rồi ghi lại payload đầy đủ.
 */
export async function updateAdminTourStatus(tourId, status) {
  const currentTour = await getAdminTourDetail(tourId);

  return updateAdminTour(tourId, buildTourMutationPayload(currentTour, {
    deleteFlg: false,
    status,
  }));
}

/**
 * Xóa mềm hoặc khôi phục tour tùy theo trạng thái hiện tại.
 */
export async function toggleAdminTourDeleteFlag(tourId) {
  const currentTour = await getAdminTourDetail(tourId);

  if (currentTour.deleteFlg) {
    // Tour khôi phục từ archived được đưa về draft để admin chủ động kiểm tra lại trước khi mở bán lại.
    return updateAdminTour(
      tourId,
      buildTourMutationPayload(currentTour, {
        deleteFlg: false,
        status: currentTour.status === 'archived' ? 'draft' : currentTour.status,
      }),
    );
  }

  return apiRequest(`/admin/tours/${tourId}`, {
    method: 'DELETE',
  });
}
