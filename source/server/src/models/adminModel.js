import { execute, select } from '../config/database.js';
import { formatDateOnly, formatDateTimeMinute, parseJsonValue, toNumber } from '../utils/dbHelpers.js';

/**
 * Tầng model admin chịu trách nhiệm:
 * - đọc row SQL và map về shape frontend dễ dùng
 * - gom các truy vấn quản trị theo user / tour / booking / payment
 * - hỗ trợ transaction bằng cách nhận `connection` khi cần
 */

/**
 * Gom nhóm dữ liệu người dùng kèm thống kê booking và tổng chi tiêu cho màn hình admin.
 */
function mapAdminUserRow(row) {
  return {
    bookingCount: toNumber(row.booking_count),
    createdAt: row.created_at,
    deleteFlg: Boolean(row.delete_flg),
    email: row.email,
    fullName: row.full_name,
    id: toNumber(row.id, null),
    phone: row.phone,
    role: row.role,
    status: row.status,
    totalSpent: toNumber(row.total_spent),
    updatedAt: row.updated_at,
    username: row.username,
  };
}

/**
 * Chuyển row itinerary về shape dễ đọc cho controller và frontend admin.
 */
function mapAdminItineraryRow(row) {
  return {
    dayNumber: toNumber(row.day_number),
    description: row.description,
    id: toNumber(row.id, null),
    title: row.title,
  };
}

/**
 * Chuyển row departure sang format có cả số chỗ tổng và số chỗ còn lại.
 */
function mapAdminDepartureRow(row) {
  return {
    date: formatDateOnly(row.departure_date),
    id: toNumber(row.id, null),
    labelText: row.label_text,
    departureCode: row.departure_code,
    price: toNumber(row.price),
    seatsBooked: toNumber(row.slots_booked),
    seatsRemaining: Math.max(toNumber(row.slots_total) - toNumber(row.slots_booked), 0),
    seatsTotal: toNumber(row.slots_total),
    status: row.status,
  };
}

/**
 * Tour admin giữ nhiều thông tin hơn luồng user-facing để hỗ trợ form thêm và sửa.
 */
function mapAdminTourRow(row) {
  return {
    category: row.category,
    createdAt: row.created_at,
    deleteFlg: Boolean(row.delete_flg),
    departurePoint: row.departure_point,
    description: row.description,
    durationDays: toNumber(row.duration_days),
    durationLabel: row.duration_label,
    id: toNumber(row.id, null),
    imageUrl: row.image_url,
    inclusions: parseJsonValue(row.inclusions_json, []),
    highlights: parseJsonValue(row.highlights_json, []),
    location: row.location,
    openDepartures: toNumber(row.open_departures),
    price: toNumber(row.price),
    rating: toNumber(row.rating),
    remainingSeats: toNumber(row.remaining_seats),
    reviewCount: toNumber(row.review_count),
    slug: row.slug,
    status: row.status,
    title: row.title,
    totalDepartures: toNumber(row.total_departures),
    updatedAt: row.updated_at,
  };
}

/**
 * Row booking cho admin cần kèm thêm tên khách, tour, payment và trạng thái xóa mềm.
 */
function mapAdminBookingRow(row, includeInternal = false) {
  const booking = {
    bookedAt: formatDateTimeMinute(row.booked_at),
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deleteFlg: Boolean(row.delete_flg),
    departureDate: formatDateOnly(row.departure_date),
    departureId: row.departure_code,
    id: row.booking_code,
    notes: row.notes || '',
    paymentCode: row.payment_code || null,
    paymentMethod: row.payment_method || '',
    paymentStatus: row.payment_status,
    discountAmount: toNumber(row.discount_amount),
    promotionCode: row.promotion_code || null,
    status: row.status,
    subtotalPrice: toNumber(row.subtotal_price || row.total_price),
    timeline: parseJsonValue(row.timeline_json, []),
    totalPrice: toNumber(row.total_price),
    tourId: toNumber(row.tour_id, null),
    tourTitle: row.tour_title,
    travelers: toNumber(row.travelers_count),
    userId: toNumber(row.user_id, null),
    username: row.username,
  };

  if (includeInternal) {
    booking._bookingDbId = toNumber(row.booking_db_id, null);
  }

  return booking;
}

/**
 * Row payment cho admin cần thêm tên khách, booking và tour để đối soát.
 */
function mapAdminPaymentRow(row, includeInternal = false) {
  const payment = {
    amount: toNumber(row.amount),
    bookingCode: row.booking_code,
    cardLast4: row.card_last4,
    cardName: row.card_name,
    checkoutUrl: row.checkout_url,
    createdAt: row.created_at,
    customerName: row.customer_name,
    id: row.payment_code,
    method: row.method,
    paidAt: row.paid_at,
    provider: row.provider,
    providerOrderCode: toNumber(row.provider_order_code, null),
    providerPaymentLinkId: row.provider_payment_link_id,
    providerStatus: row.provider_status,
    qrCode: row.qr_code,
    status: row.status,
    tourTitle: row.tour_title,
    userId: toNumber(row.user_id, null),
  };

  if (includeInternal) {
    payment._paymentDbId = toNumber(row.payment_db_id, null);
    payment._bookingDbId = toNumber(row.booking_id, null);
  }

  return payment;
}

/**
 * Query dùng chung cho list/detail booking.
 * Tách thành helper để các truy vấn theo booking_code và theo id DB nội bộ không bị lặp SQL dài.
 */
function getAdminBookingSelectSql() {
  return `
    SELECT
      b.id AS booking_db_id,
      b.booking_code,
      b.user_id,
      b.tour_id,
      b.customer_name,
      b.customer_email,
      b.customer_phone,
      b.travelers_count,
      b.subtotal_price,
      b.discount_amount,
      b.promotion_code,
      b.total_price,
      b.status,
      b.delete_flg,
      b.payment_status,
      b.payment_method,
      b.notes,
      b.timeline_json,
      b.booked_at,
      d.departure_code,
      d.departure_date,
      u.username,
      t.title AS tour_title,
      p.payment_code
    FROM bookings b
    INNER JOIN users u ON u.id = b.user_id
    INNER JOIN tours t ON t.id = b.tour_id
    INNER JOIN tour_departures d ON d.id = b.departure_id
    LEFT JOIN payments p ON p.booking_id = b.id
  `;
}

/**
 * Query dùng chung cho list/detail payment.
 */
function getAdminPaymentSelectSql() {
  return `
    SELECT
      p.id AS payment_db_id,
      p.booking_id,
      p.payment_code,
      p.user_id,
      p.amount,
      p.method,
      p.status,
      p.card_name,
      p.card_last4,
      p.paid_at,
      p.provider,
      p.provider_order_code,
      p.provider_payment_link_id,
      p.checkout_url,
      p.qr_code,
      p.provider_status,
      p.created_at,
      b.booking_code,
      b.customer_name,
      t.title AS tour_title
    FROM payments p
    INNER JOIN bookings b ON b.id = p.booking_id
    INNER JOIN tours t ON t.id = b.tour_id
  `;
}

/**
 * Lấy toàn bộ danh sách user cho admin cùng thống kê booking và tổng chi tiêu.
 */
export async function findAdminUsers(connection = null) {
  const rows = await select(
    `
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.delete_flg,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT b.id) AS booking_count,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id AND b.delete_flg = 0
      LEFT JOIN payments p ON p.booking_id = b.id
      GROUP BY
        u.id, u.full_name, u.username, u.email, u.phone, u.role, u.status, u.delete_flg, u.created_at, u.updated_at
      ORDER BY u.created_at DESC, u.id DESC
    `,
    [],
    connection,
  );

  return rows.map(mapAdminUserRow);
}

/**
 * Lấy chi tiết một user cùng vài booking gần đây để màn hình detail có thêm ngữ cảnh.
 */
export async function findAdminUserById(userId, connection = null) {
  const rows = await select(
    `
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.delete_flg,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT b.id) AS booking_count,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE u.id = ?
      GROUP BY
        u.id, u.full_name, u.username, u.email, u.phone, u.role, u.status, u.delete_flg, u.created_at, u.updated_at
      LIMIT 1
    `,
    [Number(userId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  const recentBookingRows = await select(
    `
      SELECT
        b.booking_code,
        b.status,
        b.payment_status,
        b.total_price,
        d.departure_date,
        t.title AS tour_title
      FROM bookings b
      INNER JOIN tours t ON t.id = b.tour_id
      INNER JOIN tour_departures d ON d.id = b.departure_id
      WHERE b.user_id = ?
      ORDER BY b.booked_at DESC, b.id DESC
      LIMIT 5
    `,
    [Number(userId)],
    connection,
  );

  return {
    ...mapAdminUserRow(rows[0]),
    recentBookings: recentBookingRows.map((row) => ({
      bookingCode: row.booking_code,
      departureDate: formatDateOnly(row.departure_date),
      paymentStatus: row.payment_status,
      status: row.status,
      totalPrice: toNumber(row.total_price),
      tourTitle: row.tour_title,
    })),
  };
}

/**
 * Cập nhật user từ khu vực admin.
 */
export async function updateAdminUserById(userId, updates, connection = null) {
  const assignments = [];
  const params = [];

  if (updates.fullName !== undefined) {
    assignments.push('full_name = ?');
    params.push(updates.fullName);
  }

  if (updates.email !== undefined) {
    assignments.push('email = ?');
    params.push(updates.email);
  }

  if (updates.phone !== undefined) {
    assignments.push('phone = ?');
    params.push(updates.phone);
  }

  if (updates.role !== undefined) {
    assignments.push('role = ?');
    params.push(updates.role);
  }

  if (updates.status !== undefined) {
    assignments.push('status = ?');
    params.push(updates.status);
  }

  if (updates.deleteFlg !== undefined) {
    assignments.push('delete_flg = ?');
    params.push(updates.deleteFlg ? 1 : 0);
  }

  if (!assignments.length) {
    // Nếu không có field nào thay đổi, trả luôn bản ghi hiện tại để caller vẫn có dữ liệu đồng nhất.
    return findAdminUserById(userId, connection);
  }

  await execute(
    `
      UPDATE users
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [...params, Number(userId)],
    connection,
  );

  return findAdminUserById(userId, connection);
}

/**
 * Lấy danh sách tour cho admin với thống kê đợt khởi hành và số chỗ còn lại.
 */
export async function findAdminTours(connection = null) {
  const rows = await select(
    `
      SELECT
        t.id,
        t.slug,
        t.title,
        t.location,
        t.departure_point,
        t.category,
        t.duration_days,
        t.duration_label,
        t.price,
        t.rating,
        t.review_count,
        t.image_url,
        t.description,
        t.highlights_json,
        t.inclusions_json,
        t.status,
        t.delete_flg,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT d.id) AS total_departures,
        SUM(CASE WHEN d.status IN ('open', 'nearly_full') THEN 1 ELSE 0 END) AS open_departures,
        COALESCE(SUM(GREATEST(d.slots_total - d.slots_booked, 0)), 0) AS remaining_seats
      FROM tours t
      LEFT JOIN tour_departures d ON d.tour_id = t.id
      GROUP BY
        t.id, t.slug, t.title, t.location, t.departure_point, t.category, t.duration_days, t.duration_label,
        t.price, t.rating, t.review_count, t.image_url, t.description, t.highlights_json, t.inclusions_json,
        t.status, t.delete_flg, t.created_at, t.updated_at
      ORDER BY t.created_at DESC, t.id DESC
    `,
    [],
    connection,
  );

  return rows.map(mapAdminTourRow);
}

/**
 * Lấy chi tiết một tour cùng itinerary và danh sách departures để admin chỉnh sửa.
 */
export async function findAdminTourById(tourId, connection = null) {
  const rows = await select(
    `
      SELECT
        t.id,
        t.slug,
        t.title,
        t.location,
        t.departure_point,
        t.category,
        t.duration_days,
        t.duration_label,
        t.price,
        t.rating,
        t.review_count,
        t.image_url,
        t.description,
        t.highlights_json,
        t.inclusions_json,
        t.status,
        t.delete_flg,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT d.id) AS total_departures,
        SUM(CASE WHEN d.status IN ('open', 'nearly_full') THEN 1 ELSE 0 END) AS open_departures,
        COALESCE(SUM(GREATEST(d.slots_total - d.slots_booked, 0)), 0) AS remaining_seats
      FROM tours t
      LEFT JOIN tour_departures d ON d.tour_id = t.id
      WHERE t.id = ?
      GROUP BY
        t.id, t.slug, t.title, t.location, t.departure_point, t.category, t.duration_days, t.duration_label,
        t.price, t.rating, t.review_count, t.image_url, t.description, t.highlights_json, t.inclusions_json,
        t.status, t.delete_flg, t.created_at, t.updated_at
      LIMIT 1
    `,
    [Number(tourId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  const itineraryRows = await select(
    `
      SELECT id, day_number, title, description
      FROM tour_itineraries
      WHERE tour_id = ?
      ORDER BY day_number ASC, id ASC
    `,
    [Number(tourId)],
    connection,
  );

  const departureRows = await select(
    `
      SELECT id, departure_code, departure_date, slots_total, slots_booked, price, label_text, status
      FROM tour_departures
      WHERE tour_id = ?
      ORDER BY departure_date ASC, id ASC
    `,
    [Number(tourId)],
    connection,
  );

  return {
    ...mapAdminTourRow(rows[0]),
    departures: departureRows.map(mapAdminDepartureRow),
    itinerary: itineraryRows.map(mapAdminItineraryRow),
  };
}

/**
 * Tạo bản ghi tour mới trước khi thêm itinerary và departures.
 */
export async function createAdminTourRecord(payload, connection = null) {
  const result = await execute(
    `
      INSERT INTO tours (
        slug,
        title,
        location,
        departure_point,
        category,
        duration_days,
        duration_label,
        price,
        image_url,
        description,
        highlights_json,
        inclusions_json,
        status,
        delete_flg
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.slug,
      payload.title,
      payload.location,
      payload.departurePoint,
      payload.category,
      payload.durationDays,
      payload.durationLabel,
      payload.price,
      payload.imageUrl,
      payload.description,
      JSON.stringify(payload.highlights || []),
      JSON.stringify(payload.inclusions || []),
      payload.status,
      payload.deleteFlg ? 1 : 0,
    ],
    connection,
  );

  return toNumber(result.insertId, null);
}

/**
 * Cập nhật các trường cơ bản của tour.
 */
export async function updateAdminTourRecord(tourId, payload, connection = null) {
  await execute(
    `
      UPDATE tours
      SET
        slug = ?,
        title = ?,
        location = ?,
        departure_point = ?,
        category = ?,
        duration_days = ?,
        duration_label = ?,
        price = ?,
        image_url = ?,
        description = ?,
        highlights_json = ?,
        inclusions_json = ?,
        status = ?,
        delete_flg = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      payload.slug,
      payload.title,
      payload.location,
      payload.departurePoint,
      payload.category,
      payload.durationDays,
      payload.durationLabel,
      payload.price,
      payload.imageUrl,
      payload.description,
      JSON.stringify(payload.highlights || []),
      JSON.stringify(payload.inclusions || []),
      payload.status,
      payload.deleteFlg ? 1 : 0,
      Number(tourId),
    ],
    connection,
  );
}

/**
 * Ghi lại toàn bộ itinerary hiện tại của tour theo kiểu xóa cũ, tạo mới để code dễ đọc hơn.
 */
export async function replaceAdminTourItineraries(tourId, itineraryList, connection = null) {
  await execute('DELETE FROM tour_itineraries WHERE tour_id = ?', [Number(tourId)], connection);

  for (const itineraryItem of itineraryList) {
    await execute(
      `
        INSERT INTO tour_itineraries (tour_id, day_number, title, description)
        VALUES (?, ?, ?, ?)
      `,
      [Number(tourId), itineraryItem.dayNumber, itineraryItem.title, itineraryItem.description],
      connection,
    );
  }
}

/**
 * Ghi lại toàn bộ departures hiện tại của tour theo kiểu xóa cũ, tạo mới để tránh diff phức tạp.
 */
export async function replaceAdminTourDepartures(tourId, departureList, connection = null) {
  await execute('DELETE FROM tour_departures WHERE tour_id = ?', [Number(tourId)], connection);

  for (const departure of departureList) {
    await execute(
      `
        INSERT INTO tour_departures (
          tour_id,
          departure_code,
          departure_date,
          slots_total,
          slots_booked,
          price,
          label_text,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(tourId),
        departure.departureCode,
        departure.departureDate,
        departure.seatsTotal,
        departure.seatsBooked,
        departure.price,
        departure.labelText,
        departure.status,
      ],
      connection,
    );
  }
}

/**
 * Đánh dấu xóa mềm tour thay vì xóa thật để admin còn khả năng rà soát lại dữ liệu.
 */
export async function softDeleteAdminTourById(tourId, connection = null) {
  await execute(
    `
      UPDATE tours
      SET delete_flg = 1, status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [Number(tourId)],
    connection,
  );

  return findAdminTourById(tourId, connection);
}

/**
 * Lấy danh sách booking cho khu vực admin.
 */
export async function findAdminBookings(connection = null) {
  const rows = await select(
    `
      ${getAdminBookingSelectSql()}
      ORDER BY b.booked_at DESC, b.id DESC
    `,
    [],
    connection,
  );

  return rows.map((row) => mapAdminBookingRow(row));
}

/**
 * Lấy chi tiết một booking theo booking_code cho admin.
 */
export async function findAdminBookingByCode(bookingCode, options = {}, connection = null) {
  const rows = await select(
    `
      ${getAdminBookingSelectSql()}
      WHERE b.booking_code = ?
      LIMIT 1
    `,
    [String(bookingCode || '').trim()],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapAdminBookingRow(rows[0], Boolean(options.includeInternal));
}

/**
 * Cập nhật booking từ khu vực admin.
 */
export async function updateAdminBookingByRecordId(bookingDbId, updates, connection = null) {
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

  if (updates.notes !== undefined) {
    assignments.push('notes = ?');
    params.push(updates.notes);
  }

  if (updates.timeline !== undefined) {
    assignments.push('timeline_json = ?');
    params.push(JSON.stringify(updates.timeline || []));
  }

  if (updates.deleteFlg !== undefined) {
    assignments.push('delete_flg = ?');
    params.push(updates.deleteFlg ? 1 : 0);
  }

  if (!assignments.length) {
    return findAdminBookingByRecordId(bookingDbId, {}, connection);
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

  return findAdminBookingByRecordId(bookingDbId, {}, connection);
}

/**
 * Đọc booking theo id DB nội bộ sau khi đã update trong transaction.
 */
export async function findAdminBookingByRecordId(bookingDbId, options = {}, connection = null) {
  const rows = await select(
    `
      ${getAdminBookingSelectSql()}
      WHERE b.id = ?
      LIMIT 1
    `,
    [Number(bookingDbId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapAdminBookingRow(rows[0], Boolean(options.includeInternal));
}

/**
 * Lấy danh sách payment cho admin kèm khách hàng và tour liên quan.
 */
export async function findAdminPayments(connection = null) {
  const rows = await select(
    `
      ${getAdminPaymentSelectSql()}
      ORDER BY p.created_at DESC, p.id DESC
    `,
    [],
    connection,
  );

  return rows.map((row) => mapAdminPaymentRow(row));
}

/**
 * Lấy chi tiết một payment theo payment_code.
 */
export async function findAdminPaymentByCode(paymentCode, options = {}, connection = null) {
  const rows = await select(
    `
      ${getAdminPaymentSelectSql()}
      WHERE p.payment_code = ?
      LIMIT 1
    `,
    [String(paymentCode || '').trim()],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapAdminPaymentRow(rows[0], Boolean(options.includeInternal));
}

/**
 * Cập nhật payment từ khu vực admin.
 */
export async function updateAdminPaymentByRecordId(paymentDbId, updates, connection = null) {
  const assignments = [];
  const params = [];

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

  if (!assignments.length) {
    return findAdminPaymentByRecordId(paymentDbId, {}, connection);
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

  return findAdminPaymentByRecordId(paymentDbId, {}, connection);
}

/**
 * Đọc payment theo id DB nội bộ sau khi đã update trong transaction.
 */
export async function findAdminPaymentByRecordId(paymentDbId, options = {}, connection = null) {
  const rows = await select(
    `
      ${getAdminPaymentSelectSql()}
      WHERE p.id = ?
      LIMIT 1
    `,
    [Number(paymentDbId)],
    connection,
  );

  if (!rows[0]) {
    return null;
  }

  return mapAdminPaymentRow(rows[0], Boolean(options.includeInternal));
}
