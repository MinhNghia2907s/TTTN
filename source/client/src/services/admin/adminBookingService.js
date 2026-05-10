import { apiRequest } from '../user/apiClient.js';

/**
 * API booking admin chỉ nhận payload trạng thái tối giản.
 * Service này chuẩn hóa cả trường hợp page truyền `status` hoặc `bookingStatus`
 * để component phía trên đọc/ghi dễ hơn.
 */
function createBookingStatusPayload(payload) {
  return {
    status: payload.status ?? payload.bookingStatus,
  };
}

/**
 * Lấy danh sách booking cho khu vực admin.
 */
export function getAdminBookings() {
  return apiRequest('/admin/bookings');
}

/**
 * Lấy chi tiết một booking theo mã booking.
 */
export function getAdminBookingDetail(bookingCode) {
  return apiRequest(`/admin/bookings/${bookingCode}`);
}

/**
 * Cập nhật trạng thái booking từ khu vực quản trị.
 */
export function updateAdminBooking(bookingCode, payload) {
  return apiRequest(`/admin/bookings/${bookingCode}/status`, {
    body: JSON.stringify(createBookingStatusPayload(payload)),
    method: 'PUT',
  });
}

/**
 * Xóa mềm booking khỏi danh sách vận hành.
 */
export function toggleAdminBookingDeleteFlag(bookingCode) {
  return apiRequest(`/admin/bookings/${bookingCode}`, {
    method: 'DELETE',
  });
}
