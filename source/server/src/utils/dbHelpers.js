/**
 * Phân tích chuỗi JSON lấy từ MySQL JSON/TEXT về object JS, nếu lỗi thì trả về fallback.
 */
export function parseJsonValue(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  return value;
}

/**
 * Chuẩn hóa dữ liệu số từ DB/query string về `Number` an toàn.
 */
export function toNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

/**
 * Rút gọn DATETIME/DATE về định dạng `YYYY-MM-DD` cho frontend.
 */
export function formatDateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

/**
 * Rút gọn DATETIME về mức phút để hiển thị timeline gọn hơn.
 */
export function formatDateTimeMinute(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '';
}
