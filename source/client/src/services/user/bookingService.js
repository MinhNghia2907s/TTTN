import { apiRequest } from './apiClient.js';

/**
 * Lấy lịch sử booking của người dùng đang đăng nhập.
 */
export function getBookings() {
  return apiRequest('/bookings');
}

/**
 * Lấy chi tiết một booking của người dùng hiện tại.
 */
export function getBookingDetail(bookingId) {
  return apiRequest(`/bookings/${bookingId}`);
}

/**
 * Goi backend tinh thu tong tien booking, gom ca tien giam neu co ma khuyen mai.
 */
export function quoteBooking(payload) {
  return apiRequest('/bookings/quote', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Tạo booking mới từ form đặt tour.
 */
export function createBooking(payload) {
  return apiRequest('/bookings', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

/**
 * Hủy một booking nếu backend còn cho phép thay đổi trạng thái.
 */
export function cancelBooking(bookingId) {
  return apiRequest(`/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
  });
}
