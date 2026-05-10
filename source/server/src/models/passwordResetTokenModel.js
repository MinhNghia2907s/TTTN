import { execute, select } from '../config/database.js';
import { toNumber } from '../utils/dbHelpers.js';

function mapPasswordResetTokenRow(row) {
  if (!row) {
    return null;
  }

  return {
    createdAt: row.created_at,
    email: row.email,
    expiresAt: row.expires_at,
    id: toNumber(row.id, null),
    tokenHash: row.token_hash,
    usedAt: row.used_at,
    userId: toNumber(row.user_id, null),
  };
}

/**
 * Tạo token đặt lại mật khẩu mới cho một tài khoản.
 */
export async function createPasswordResetToken(payload, connection = null) {
  const result = await execute(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `,
    [payload.userId, payload.tokenHash, payload.expiresAt],
    connection,
  );

  const rows = await select(
    `
      SELECT id, user_id, token_hash, expires_at, used_at, created_at
      FROM password_reset_tokens
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId],
    connection,
  );

  return mapPasswordResetTokenRow(rows[0]);
}

/**
 * Tìm token reset còn hiệu lực theo giá trị hash.
 */
export async function findValidPasswordResetToken(tokenHash, connection = null) {
  const rows = await select(
    `
      SELECT
        prt.id,
        prt.user_id,
        prt.token_hash,
        prt.expires_at,
        prt.used_at,
        prt.created_at,
        u.email
      FROM password_reset_tokens prt
      INNER JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = ?
        AND prt.used_at IS NULL
        AND prt.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash],
    connection,
  );

  return mapPasswordResetTokenRow(rows[0]);
}

/**
 * Đánh dấu toàn bộ token reset hiện có của user là đã dùng để tránh tái sử dụng.
 */
export async function invalidatePasswordResetTokensForUser(userId, connection = null) {
  return execute(
    `
      UPDATE password_reset_tokens
      SET used_at = COALESCE(used_at, NOW())
      WHERE user_id = ?
        AND used_at IS NULL
    `,
    [userId],
    connection,
  );
}

/**
 * Đánh dấu một token cụ thể là đã dùng sau khi đổi mật khẩu thành công.
 */
export async function markPasswordResetTokenUsed(tokenId, connection = null) {
  return execute(
    `
      UPDATE password_reset_tokens
      SET used_at = COALESCE(used_at, NOW())
      WHERE id = ?
    `,
    [tokenId],
    connection,
  );
}
