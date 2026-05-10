import { execute, select } from '../config/database.js';
import { toNumber } from '../utils/dbHelpers.js';

/**
 * Map tên cột `snake_case` trong MySQL về object `camelCase` mà service đang dùng.
 */
function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    id: toNumber(row.id, null),
    passwordHash: row.password_hash,
    phone: row.phone,
    role: row.role,
    status: row.status,
    updatedAt: row.updated_at,
    username: row.username,
  };
}

/**
 * Tìm user theo primary key để auth middleware và refresh token có thể xác thực lại phiên.
 */
export async function findUserById(userId, connection = null) {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, full_name, username, email, phone, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [normalizedUserId],
    connection,
  );

  return mapUserRow(rows[0]);
}

/**
 * Cho phép đăng nhập bằng email hoặc username trên cùng một endpoint.
 */
export async function findUserByLoginId(loginId, connection = null) {
  const normalizedLoginId = String(loginId || '').trim().toLowerCase();

  if (!normalizedLoginId) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, full_name, username, email, phone, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
      LIMIT 1
    `,
    [normalizedLoginId, normalizedLoginId],
    connection,
  );

  return mapUserRow(rows[0]);
}

/**
 * Kiểm tra email tồn tại trước khi tạo tài khoản mới.
 */
export async function findUserByEmail(email, connection = null) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, full_name, username, email, phone, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    [normalizedEmail],
    connection,
  );

  return mapUserRow(rows[0]);
}

/**
 * Kiểm tra username tồn tại trước khi đăng ký.
 */
export async function findUserByUsername(username, connection = null) {
  const normalizedUsername = String(username || '').trim().toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, full_name, username, email, phone, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE LOWER(username) = ?
      LIMIT 1
    `,
    [normalizedUsername],
    connection,
  );

  return mapUserRow(rows[0]);
}

/**
 * Kiểm tra số điện thoại tồn tại trước khi cập nhật hồ sơ hoặc tạo tài khoản.
 */
export async function findUserByPhone(phone, connection = null) {
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedPhone) {
    return null;
  }

  const rows = await select(
    `
      SELECT id, full_name, username, email, phone, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE phone = ?
      LIMIT 1
    `,
    [normalizedPhone],
    connection,
  );

  return mapUserRow(rows[0]);
}

/**
 * Tạo user mới trong bảng `users`, sau đó đọc lại bản ghi vừa tạo để đồng bộ format.
 */
export async function createUser(payload, connection = null) {
  const result = await execute(
    `
      INSERT INTO users (full_name, username, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      payload.fullName,
      payload.username,
      payload.email,
      payload.phone,
      payload.passwordHash,
      payload.role || 'user',
    ],
    connection,
  );

  return findUserById(result.insertId, connection);
}

/**
 * Cập nhật thông tin hồ sơ cơ bản để người dùng tự chỉnh sửa tài khoản của mình.
 */
export async function updateUserProfile(userId, payload, connection = null) {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    return null;
  }

  await execute(
    `
      UPDATE users
      SET full_name = ?, email = ?, phone = ?
      WHERE id = ?
    `,
    [payload.fullName, payload.email, payload.phone, normalizedUserId],
    connection,
  );

  return findUserById(normalizedUserId, connection);
}

/**
 * Cập nhật password hash cho một tài khoản sau khi đổi hoặc đặt lại mật khẩu.
 */
export async function updateUserPassword(userId, passwordHash, connection = null) {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    return null;
  }

  await execute(
    `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `,
    [passwordHash, normalizedUserId],
    connection,
  );

  return findUserById(normalizedUserId, connection);
}
