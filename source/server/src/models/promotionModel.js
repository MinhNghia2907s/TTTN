import { select } from '../config/database.js';
import { toNumber } from '../utils/dbHelpers.js';

/**
 * Map row promotion từ SQL sang object camelCase để service dễ đọc hơn.
 */
function mapPromotionRow(row) {
  if (!row) {
    return null;
  }

  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: toNumber(row.discount_value),
    endsAt: row.ends_at,
    id: toNumber(row.id, null),
    minTravelers: toNumber(row.min_travelers),
    name: row.name,
    startsAt: row.starts_at,
    status: row.status,
  };
}

/**
 * Tìm mã khuyến mãi đang active tại thời điểm hiện tại.
 * Điều kiện ngày bắt đầu/kết thúc để null nghĩa là không giới hạn.
 */
export async function findActivePromotionByCode(code, connection = null) {
  const normalizedCode = String(code || '').trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const rows = await select(
    `
      SELECT
        id,
        code,
        name,
        discount_type,
        discount_value,
        min_travelers,
        status,
        starts_at,
        ends_at
      FROM promotions
      WHERE code = ?
        AND status = 'active'
        AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
        AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
      LIMIT 1
    `,
    [normalizedCode],
    connection,
  );

  return mapPromotionRow(rows[0]);
}
