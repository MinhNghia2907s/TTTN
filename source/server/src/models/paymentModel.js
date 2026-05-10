import { execute, select } from '../config/database.js';
import { toNumber } from '../utils/dbHelpers.js';

/**
 * Tạo `payment_code` để dễ đối soát giao dịch hơn id số tăng dần.
 */
function generatePaymentCode() {
  return `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 90 + 10,
  )}`;
}

/**
 * Map row payment sang object trả về cho frontend và service.
 */
function mapPaymentRow(row, includeInternal = false) {
  if (!row) {
    return null;
  }

  const payment = {
    amount: toNumber(row.amount),
    cardLast4: row.card_last4,
    cardName: row.card_name,
    checkoutUrl: row.checkout_url,
    id: row.payment_code,
    method: row.method,
    paidAt: row.paid_at,
    provider: row.provider,
    providerOrderCode: toNumber(row.provider_order_code, null),
    providerPaymentLinkId: row.provider_payment_link_id,
    providerStatus: row.provider_status,
    qrCode: row.qr_code,
    status: row.status,
  };

  if (includeInternal) {
    payment._paymentDbId = toNumber(row.payment_db_id, null);
    payment._bookingDbId = toNumber(row.booking_id, null);
    payment._userDbId = toNumber(row.user_id, null);
  }

  return payment;
}

/**
 * Mỗi booking chỉ có tối đa một bản ghi payment hiện tại trong luồng user-facing.
 */
export async function findPaymentByBookingId(bookingId, connection = null, options = {}) {
  const rows = await select(
    `
      SELECT
        id AS payment_db_id,
        payment_code,
        booking_id,
        user_id,
        amount,
        method,
        status,
        card_name,
        card_last4,
        paid_at,
        provider,
        provider_order_code,
        provider_payment_link_id,
        checkout_url,
        qr_code,
        provider_status
      FROM payments
      WHERE booking_id = ?
      LIMIT 1
    `,
    [Number(bookingId)],
    connection,
  );

  return rows[0] ? mapPaymentRow(rows[0], Boolean(options.includeInternal)) : null;
}

/**
 * Tạo bản ghi payment mới khi booking thanh toán lần đầu.
 */
export async function createPayment(payload, connection = null, options = {}) {
  const paymentCode = generatePaymentCode();
  const result = await execute(
    `
      INSERT INTO payments (
        payment_code,
        booking_id,
        user_id,
        amount,
        method,
        status,
        card_name,
        card_last4,
        paid_at,
        provider,
        provider_order_code,
        provider_payment_link_id,
        checkout_url,
        qr_code,
        provider_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      paymentCode,
      payload.bookingId,
      payload.userId,
      payload.amount,
      payload.method,
      payload.status,
      payload.cardName ?? null,
      payload.cardLast4 ?? null,
      payload.paidAt ?? null,
      payload.provider ?? null,
      payload.providerOrderCode ?? null,
      payload.providerPaymentLinkId ?? null,
      payload.checkoutUrl ?? null,
      payload.qrCode ?? null,
      payload.providerStatus ?? null,
    ],
    connection,
  );

  return findPaymentByRecordId(result.insertId, connection, options);
}

/**
 * Đọc payment theo id DB sau khi insert/update để lấy dữ liệu mới nhất.
 */
export async function findPaymentByRecordId(paymentDbId, connection = null, options = {}) {
  const rows = await select(
    `
      SELECT
        id AS payment_db_id,
        payment_code,
        booking_id,
        user_id,
        amount,
        method,
        status,
        card_name,
        card_last4,
        paid_at,
        provider,
        provider_order_code,
        provider_payment_link_id,
        checkout_url,
        qr_code,
        provider_status
      FROM payments
      WHERE id = ?
      LIMIT 1
    `,
    [Number(paymentDbId)],
    connection,
  );

  return rows[0] ? mapPaymentRow(rows[0], Boolean(options.includeInternal)) : null;
}

/**
 * Cập nhật giao dịch hiện có nếu booking được thanh toán lại trên cùng bản ghi.
 */
export async function updatePayment(paymentDbId, updates, connection = null, options = {}) {
  const assignments = [];
  const params = [];

  if (updates.amount !== undefined) {
    assignments.push('amount = ?');
    params.push(updates.amount);
  }

  if (updates.method !== undefined) {
    assignments.push('method = ?');
    params.push(updates.method);
  }

  if (updates.status !== undefined) {
    assignments.push('status = ?');
    params.push(updates.status);
  }

  if (updates.cardName !== undefined) {
    assignments.push('card_name = ?');
    params.push(updates.cardName);
  }

  if (updates.cardLast4 !== undefined) {
    assignments.push('card_last4 = ?');
    params.push(updates.cardLast4);
  }

  if (updates.paidAt !== undefined) {
    assignments.push('paid_at = ?');
    params.push(updates.paidAt);
  }

  if (updates.provider !== undefined) {
    assignments.push('provider = ?');
    params.push(updates.provider);
  }

  if (updates.providerOrderCode !== undefined) {
    assignments.push('provider_order_code = ?');
    params.push(updates.providerOrderCode);
  }

  if (updates.providerPaymentLinkId !== undefined) {
    assignments.push('provider_payment_link_id = ?');
    params.push(updates.providerPaymentLinkId);
  }

  if (updates.checkoutUrl !== undefined) {
    assignments.push('checkout_url = ?');
    params.push(updates.checkoutUrl);
  }

  if (updates.qrCode !== undefined) {
    assignments.push('qr_code = ?');
    params.push(updates.qrCode);
  }

  if (updates.providerStatus !== undefined) {
    assignments.push('provider_status = ?');
    params.push(updates.providerStatus);
  }

  if (!assignments.length) {
    return findPaymentByRecordId(paymentDbId, connection, options);
  }

  await execute(
    `
      UPDATE payments
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [...params, Number(paymentDbId)],
    connection,
  );

  return findPaymentByRecordId(paymentDbId, connection, options);
}

export async function findPaymentByProviderOrderCode(providerOrderCode, connection = null, options = {}) {
  const rows = await select(
    `
      SELECT
        id AS payment_db_id,
        payment_code,
        booking_id,
        user_id,
        amount,
        method,
        status,
        card_name,
        card_last4,
        paid_at,
        provider,
        provider_order_code,
        provider_payment_link_id,
        checkout_url,
        qr_code,
        provider_status
      FROM payments
      WHERE provider_order_code = ?
      LIMIT 1
    `,
    [Number(providerOrderCode)],
    connection,
  );

  return rows[0] ? mapPaymentRow(rows[0], Boolean(options.includeInternal)) : null;
}
