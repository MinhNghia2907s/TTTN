import { apiRequest } from '../user/apiClient.js';

/**
 * Tầng service payment giữ rất mỏng:
 * - update status thường đi qua `/status`
 * - hoàn tiền đi qua endpoint riêng để backend đồng bộ thêm booking
 */

/**
 * Lấy danh sách payment cho khu vực admin.
 */
export function getAdminPayments() {
  return apiRequest('/admin/payments');
}

/**
 * Lấy chi tiết một payment theo mã payment.
 */
export function getAdminPaymentDetail(paymentCode) {
  return apiRequest(`/admin/payments/${paymentCode}`);
}

/**
 * Cập nhật trạng thái thanh toán từ khu vực quản trị.
 */
export function updateAdminPayment(paymentCode, payload) {
  return apiRequest(`/admin/payments/${paymentCode}/status`, {
    body: JSON.stringify({
      status: payload.status,
    }),
    method: 'PUT',
  });
}

/**
 * Hoàn tiền cho giao dịch đã thanh toán.
 */
export function refundAdminPayment(paymentCode) {
  return apiRequest(`/admin/payments/refund/${paymentCode}`, {
    method: 'POST',
  });
}
