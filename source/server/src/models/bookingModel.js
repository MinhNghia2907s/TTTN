import { execute, select } from '../config/database.js';
import { formatDateOnly, parseJsonValue, toNumber } from '../utils/dbHelpers.js';

/**
 * Tạo `booking_code` để frontend và người dùng nhìn thấy mã đặt tour thân thiện hơn id số trong DB.
 */
function generateBookingCode() {
  return `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 90 + 10,
  )}`;
}

/**
 * Map row booking SQL sang object `camelCase/frontend contract`.
 */
function mapBookingRow(row, includeInternal = false) {
  const booking = {
    bookedAt: formatDateOnly(row.booked_at),
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    departureDate: formatDateOnly(row.departure_date),
    departureId: row.departure_code,
    id: row.booking_code,
    notes: row.notes || 'Không có ghi chú thêm.',
    paymentMethod: row.payment_method || 'Chưa thanh toán',
    paymentStatus: row.payment_status,
    discountAmount: toNumber(row.discount_amount),
    promotionCode: row.promotion_code || null,
    status: row.status,
    subtotalPrice: toNumber(row.subtotal_price || row.total_price),
    timeline: parseJsonValue(row.timeline_json, []),
    totalPrice: toNumber(row.total_price),
    tourId: toNumber(row.tour_id, null),
    travelers: toNumber(row.travelers_count),
  };

  if (includeInternal) {
    booking._bookingDbId = toNumber(row.booking_db_id, null);
    booking._departureDbId = toNumber(row.departure_db_id, null);
    booking._userDbId = toNumber(row.user_id, null);
  }

  return booking;
}

/**
 * Gom câu `SELECT` chung cho list/detail booking để tránh lặp query JOIN.
 */
function getBookingSelectSql() {
  return `
    SELECT
      b.id AS booking_db_id,
      b.booking_code,
      b.user_id,
      b.tour_id,
      b.departure_id AS departure_db_id,
      d.departure_code,
      d.departure_date,
      b.customer_name,
      b.customer_email,
      b.customer_phone,
      b.travelers_count,
      b.subtotal_price,
      b.discount_amount,
      b.promotion_code,
      b.total_price,
      b.status,
      b.payment_status,
      b.payment_method,
      b.notes,
      b.timeline_json,
      b.booked_at,
      b.created_at,
      b.updated_at
    FROM bookings b
    INNER JOIN tour_departures d ON d.id = b.departure_id
  `;
}

/**
 * Lấy toàn bộ booking của user hiện tại cho trang lịch sử.
 */
export async function findBookingsByUserId(userId, connection = null) {
  const rows = await select(
    `
      ${getBookingSelectSql()}
      WHERE b.user_id = ?
      ORDER BY b.booked_at DESC, b.id DESC
    `,
    [Number(userId)],
    connection,
  );

  return rows.map((row) => mapBookingRow(row));
}

/**
 * Chỉ cho phép đọc booking thuộc về đúng user đang đăng nhập.
 */
export async function findBookingByIdAndUserId(bookingId, userId, options = {}, connection = null) {
  const rows = await select(
    `
      ${getBookingSelectSql()}
      WHERE b.booking_code = ? AND b.user_id = ?
      LIMIT 1
    `,
    [String(bookingId || '').trim(), Number(userId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapBookingRow(rows[0], Boolean(options.includeInternal));
}

/**
 * Đọc lại booking vừa tạo/cập nhật bằng id DB nội bộ.
 */
export async function findBookingByDbId(bookingDbId, options = {}, connection = null) {
  const rows = await select(
    `
      ${getBookingSelectSql()}
      WHERE b.id = ?
      LIMIT 1
    `,
    [Number(bookingDbId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapBookingRow(rows[0], Boolean(options.includeInternal));
}

/**
 * Tạo booking mới trong DB và trả về bản ghi đã map sẵn cho frontend.
 */
export async function createBooking(payload, connection = null) {
  const bookingCode = generateBookingCode();
  const result = await execute(
    `
      INSERT INTO bookings (
        booking_code,
        user_id,
        tour_id,
        departure_id,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count,
        subtotal_price,
        discount_amount,
        promotion_code,
        total_price,
        status,
        payment_status,
        payment_method,
        notes,
        timeline_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      bookingCode,
      payload.userId,
      payload.tourId,
      payload.departureDbId,
      payload.customerName,
      payload.customerEmail,
      payload.customerPhone,
      payload.travelers,
      payload.subtotalPrice,
      payload.discountAmount,
      payload.promotionCode,
      payload.totalPrice,
      payload.status,
      payload.paymentStatus,
      payload.paymentMethod,
      payload.notes,
      JSON.stringify(payload.timeline || []),
    ],
    connection,
  );

  return findBookingByDbId(result.insertId, {}, connection);
}

/**
 * Cập nhật các trường cho phép thay đổi trong luồng booking/payment/hủy booking.
 */
export async function updateBooking(bookingDbId, updates, connection = null) {
  const assignments = [];
  const params = [];

  if (updates.status !== undefined) {
    assignments.push('status = ?');
    params.push(updates.status);
  }

  if (updates.paymentStatus !== undefined) {
    assignments.push('payment_status = ?');
    params.push(updates.paymentStatus);
  }

  if (updates.paymentMethod !== undefined) {
    assignments.push('payment_method = ?');
    params.push(updates.paymentMethod);
  }

  if (updates.notes !== undefined) {
    assignments.push('notes = ?');
    params.push(updates.notes);
  }

  if (updates.timeline !== undefined) {
    assignments.push('timeline_json = ?');
    params.push(JSON.stringify(updates.timeline || []));
  }

  if (!assignments.length) {
    return findBookingByDbId(bookingDbId, {}, connection);
  }

  await execute(
    `
      UPDATE bookings
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [...params, Number(bookingDbId)],
    connection,
  );

  return findBookingByDbId(bookingDbId, {}, connection);
}
