import { execute, select } from '../config/database.js';
import { parseJsonValue, toNumber } from '../utils/dbHelpers.js';

/**
 * Tour summary là format chung cho card/listing và cũng là nền của trang chi tiết.
 */
function mapTourSummary(row) {
  return {
    category: row.category,
    departurePoint: row.departure_point,
    description: row.description,
    duration: row.duration_label,
    id: toNumber(row.id, null),
    image: row.image_url,
    inclusions: parseJsonValue(row.inclusions_json, []),
    highlights: parseJsonValue(row.highlights_json, []),
    location: row.location,
    price: toNumber(row.price),
    rating: toNumber(row.rating),
    reviewCount: toNumber(row.review_count),
    title: row.title,
  };
}

/**
 * Đổi `day_number` trong DB thành nhãn "Ngày X" để frontend render trực tiếp.
 */
function mapItineraryRow(row) {
  return {
    day: `Ngày ${row.day_number}`,
    description: row.description,
    title: row.title,
  };
}

/**
 * Đổi row lịch khởi hành sang format frontend, đồng thời tính số chỗ còn lại từ `slots_total - slots_booked`.
 */
function mapDepartureRow(row, includeInternal = false) {
  const mappedDeparture = {
    date: row.departure_date,
    id: row.departure_code,
    label: row.label_text,
    price: toNumber(row.price),
    slots: toNumber(row.slots_total) - toNumber(row.slots_booked),
    status: row.status,
  };

  if (includeInternal) {
    mappedDeparture._departureDbId = toNumber(row.id, null);
    mappedDeparture._tourDbId = toNumber(row.tour_id, null);
  }

  return mappedDeparture;
}

/**
 * Query danh sách tour với bộ lọc từ frontend, filter được đẩy xuống SQL thay vì lọc trong RAM.
 */
export async function findAllTours(filters = {}, connection = null) {
  const conditions = [`status = 'published'`];
  const params = [];
  const normalizedKeyword = String(filters.keyword || '').trim().toLowerCase();
  const normalizedLocation = String(filters.location || '').trim().toLowerCase();

  if (normalizedKeyword) {
    const likeKeyword = `%${normalizedKeyword}%`;
    conditions.push(`(LOWER(title) LIKE ? OR LOWER(location) LIKE ? OR LOWER(description) LIKE ?)`);
    params.push(likeKeyword, likeKeyword, likeKeyword);
  }

  if (filters.category && filters.category !== 'all') {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (normalizedLocation) {
    conditions.push('LOWER(location) LIKE ?');
    params.push(`%${normalizedLocation}%`);
  }

  if (filters.minPrice) {
    conditions.push('price >= ?');
    params.push(Number(filters.minPrice));
  }

  if (filters.maxPrice) {
    conditions.push('price <= ?');
    params.push(Number(filters.maxPrice));
  }

  if (filters.minDays) {
    conditions.push('duration_days >= ?');
    params.push(Number(filters.minDays));
  }

  if (filters.maxDays) {
    conditions.push('duration_days <= ?');
    params.push(Number(filters.maxDays));
  }

  const rows = await select(
    `
      SELECT
        id,
        title,
        location,
        departure_point,
        category,
        duration_label,
        price,
        rating,
        review_count,
        image_url,
        description,
        highlights_json,
        inclusions_json
      FROM tours
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC, id DESC
    `,
    params,
    connection,
  );

  return rows.map(mapTourSummary);
}

/**
 * Lấy nhóm tour nổi bật cho trang chủ theo tiêu chí rating và review_count.
 */
export async function findFeaturedTours(limit = 3, connection = null) {
  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 3;
  const rows = await select(
    `
      SELECT
        id,
        title,
        location,
        departure_point,
        category,
        duration_label,
        price,
        rating,
        review_count,
        image_url,
        description,
        highlights_json,
        inclusions_json
      FROM tours
      WHERE status = 'published'
      ORDER BY rating DESC, review_count DESC, id ASC
      -- MySQL ở môi trường local hiện tại báo lỗi với prepared placeholder trong LIMIT.
      -- Sau khi ép kiểu chặt về số nguyên dương, có thể nội suy trực tiếp mà vẫn an toàn.
      LIMIT ${normalizedLimit}
    `,
    [],
    connection,
  );

  return rows.map(mapTourSummary);
}

/**
 * Landing page dùng testimonials riêng, được map về shape `name/role/content` mà UI đang đọc.
 */
export async function findTestimonials(connection = null) {
  const rows = await select(
    `
      SELECT id, user_name, role_label, content
      FROM testimonials
      ORDER BY sort_order ASC, id ASC
    `,
    [],
    connection,
  );

  return rows.map((row) => ({
    content: row.content,
    id: `review-${row.id}`,
    name: row.user_name,
    role: row.role_label,
  }));
}

/**
 * Lấy một tour chi tiết kèm itinerary và departures từ DB thật.
 */
export async function findTourById(tourId, connection = null) {
  const normalizedTourId = Number(tourId);

  if (!Number.isInteger(normalizedTourId) || normalizedTourId < 1) {
    return null;
  }

  const tourRows = await select(
    `
      SELECT
        id,
        title,
        location,
        departure_point,
        category,
        duration_label,
        price,
        rating,
        review_count,
        image_url,
        description,
        highlights_json,
        inclusions_json
      FROM tours
      WHERE id = ? AND status = 'published'
      LIMIT 1
    `,
    [normalizedTourId],
    connection,
  );

  const tourRow = tourRows[0];

  if (!tourRow) {
    return null;
  }

  const itineraryRows = await select(
    `
      SELECT day_number, title, description
      FROM tour_itineraries
      WHERE tour_id = ?
      ORDER BY day_number ASC
    `,
    [normalizedTourId],
    connection,
  );

  const departureRows = await select(
    `
      SELECT id, tour_id, departure_code, departure_date, slots_total, slots_booked, price, label_text, status
      FROM tour_departures
      WHERE tour_id = ?
      ORDER BY departure_date ASC, id ASC
    `,
    [normalizedTourId],
    connection,
  );

  return {
    ...mapTourSummary(tourRow),
    departures: departureRows.map((row) => mapDepartureRow(row)),
    itinerary: itineraryRows.map(mapItineraryRow),
  };
}

/**
 * Tìm một lịch khởi hành cụ thể theo `tour + departure_code` để tạo booking.
 */
export async function findDepartureById(tourId, departureId, connection = null) {
  const normalizedTourId = Number(tourId);
  const normalizedDepartureId = String(departureId || '').trim();

  if (!Number.isInteger(normalizedTourId) || normalizedTourId < 1 || !normalizedDepartureId) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, tour_id, departure_code, departure_date, slots_total, slots_booked, price, label_text, status
      FROM tour_departures
      WHERE tour_id = ? AND departure_code = ?
      LIMIT 1
    `,
    [normalizedTourId, normalizedDepartureId],
    connection,
  );

  return rows[0] ? mapDepartureRow(rows[0], true) : null;
}

/**
 * Giữ chỗ theo số lượng khách; điều kiện `slots` trong `WHERE` giúp tránh overbooking khi nhiều request đến cùng lúc.
 */
export async function reserveDepartureSlots(tourId, departureId, travelerCount, connection = null) {
  const result = await execute(
    `
      UPDATE tour_departures
      SET slots_booked = slots_booked + ?
      WHERE tour_id = ?
        AND departure_code = ?
        AND status = 'open'
        AND (slots_total - slots_booked) >= ?
    `,
    [travelerCount, Number(tourId), String(departureId || '').trim(), travelerCount],
    connection,
  );

  return result.affectedRows > 0;
}

/**
 * Trả lại số chỗ khi booking bị hủy.
 */
export async function releaseDepartureSlots(tourId, departureId, travelerCount, connection = null) {
  const result = await execute(
    `
      UPDATE tour_departures
      SET slots_booked = CASE
        WHEN slots_booked >= ? THEN slots_booked - ?
        ELSE 0
      END
      WHERE tour_id = ? AND departure_code = ?
    `,
    [travelerCount, travelerCount, Number(tourId), String(departureId || '').trim()],
    connection,
  );

  return result.affectedRows > 0;
}
