import { PayOS } from '@payos/node';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

let payosClient = null;

/**
 * PayOS key chỉ được đọc ở backend. Nếu thiếu key thì dừng tại service để frontend không nhận
 * lỗi mơ hồ khi bấm tạo QR.
 */
function ensurePayosConfig() {
  const missingKeys = [];

  if (!env.payosClientId) {
    missingKeys.push('PAYOS_CLIENT_ID');
  }

  if (!env.payosApiKey) {
    missingKeys.push('PAYOS_API_KEY');
  }

  if (!env.payosChecksumKey) {
    missingKeys.push('PAYOS_CHECKSUM_KEY');
  }

  if (missingKeys.length) {
    throw new ApiError(500, `Thiếu cấu hình PayOS: ${missingKeys.join(', ')}.`);
  }
}

/**
 * Dùng singleton để không khởi tạo SDK lặp lại cho mỗi request thanh toán/webhook.
 */
function getPayosClient() {
  ensurePayosConfig();

  if (!payosClient) {
    payosClient = new PayOS({
      apiKey: env.payosApiKey,
      checksumKey: env.payosChecksumKey,
      clientId: env.payosClientId,
    });
  }

  return payosClient;
}

/**
 * Tạo payment link PayOS, response gồm checkoutUrl và qrCode dùng cho trang thanh toán.
 */
export async function createPayosPaymentLink(paymentData) {
  return getPayosClient().paymentRequests.create(paymentData);
}

/**
 * Đọc trạng thái mới nhất từ PayOS khi local webhook chưa gọi được vào máy dev.
 */
export async function getPayosPaymentLink(orderCodeOrPaymentLinkId) {
  return getPayosClient().paymentRequests.get(orderCodeOrPaymentLinkId);
}

/**
 * Xác thực chữ ký webhook trước khi cập nhật payment/booking trong database.
 */
export async function verifyPayosWebhook(payload) {
  return getPayosClient().webhooks.verify(payload);
}
