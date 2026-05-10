import { apiRequest } from './apiClient.js';

/**
 * Lấy thông tin thanh toán của booking để render trang checkout.
 */
export function getPaymentDetail(bookingId) {
  return apiRequest(`/payments/${bookingId}`);
}

/**
 * Gửi yêu cầu xác nhận thanh toán cho booking.
 */
export function payBooking(payload) {
  return apiRequest('/payments', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function syncPaymentStatus(bookingId) {
  return apiRequest(`/payments/${bookingId}/sync`, {
    method: 'POST',
  });
}
