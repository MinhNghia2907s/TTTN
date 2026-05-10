import { select, execute } from '../config/database.js'; // Đảm bảo bạn có export execute từ database.js
import { toNumber } from '../utils/dbHelpers.js';

/**
 * Map row promotion từ SQL sang object camelCase
 */
function mapPromotionRow(row) {
  if (!row) return null;
  return {
    id: toNumber(row.id, null),
    code: row.code,
    name: row.name,
    discountType: row.discount_type,
    discountValue: toNumber(row.discount_value),
    minTravelers: toNumber(row.min_travelers),
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lấy tất cả mã khuyến mãi (dành cho Admin)
 */
export async function findAllPromotions() {
  const rows = await select(
    'SELECT * FROM promotions ORDER BY created_at DESC'
  );
  return rows.map(mapPromotionRow);
}

/**
 * Tìm mã khuyến mãi đang active (Code cũ của bạn)
 */
export async function findActivePromotionByCode(code, connection = null) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;

  const rows = await select(
    `SELECT * FROM promotions 
     WHERE code = ? AND status = 'active'
     AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
     AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
     LIMIT 1`,
    [normalizedCode],
    connection
  );
  return mapPromotionRow(rows[0]);
}

/**
 * Thêm mới khuyến mãi
 */
export async function createPromotion(data) {
  const { code, name, discountType, discountValue, minTravelers, status, startsAt, endsAt } = data;
  
  const result = await execute(
    `INSERT INTO promotions (code, name, discount_type, discount_value, min_travelers, status, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code.toUpperCase(), name, discountType, discountValue, minTravelers || 1, status || 'active', startsAt, endsAt]
  );
  
  return result.insertId;
}

/**
 * Cập nhật khuyến mãi
 */
export async function updatePromotion(id, data) {
  const { code, name, discountType, discountValue, minTravelers, status, startsAt, endsAt } = data;
  
  await execute(
    `UPDATE promotions 
     SET code = ?, name = ?, discount_type = ?, discount_value = ?, min_travelers = ?, status = ?, starts_at = ?, ends_at = ?
     WHERE id = ?`,
    [code.toUpperCase(), name, discountType, discountValue, minTravelers, status, startsAt, endsAt, id]
  );
  return true;
}

/**
 * Xóa khuyến mãi
 */
export async function deletePromotion(id) {
  await execute('DELETE FROM promotions WHERE id = ?', [id]);
  return true;
}
export const getById = async (id) => {
    const rows = await select('SELECT * FROM promotions WHERE id = ?', [id]);
    return mapPromotionRow(rows[0]);
};
export const findById = getById;
export const findAll = findAllPromotions;
export const create = createPromotion;
export const update = updatePromotion;
export const remove = deletePromotion;
