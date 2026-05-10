import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { withTransaction } from '../config/database.js';
import { env } from '../config/env.js';
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  invalidatePasswordResetTokensForUser,
  markPasswordResetTokenUsed,
} from '../models/passwordResetTokenModel.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByLoginId,
  findUserByPhone,
  findUserByUsername,
  updateUserProfile,
  updateUserPassword,
} from '../models/userModel.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Không trả password hash về frontend.
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Access token được dùng để gọi API user-facing.
 */
function createAccessToken(user) {
  return jwt.sign({ userId: user.id }, env.jwtSecret, {
    expiresIn: env.accessTokenExpiresIn,
  });
}

/**
 * Refresh token dùng để xin cấp lại access token khi phiên còn hiệu lực.
 */
function createRefreshToken(user) {
  return jwt.sign({ userId: user.id }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  });
}

/**
 * Đồng bộ format auth response sau login/register/refresh.
 */
function buildAuthPayload(user) {
  return {
    refreshToken: createRefreshToken(user),
    token: createAccessToken(user),
    user: sanitizeUser(user),
  };
}

function createPasswordResetDebugPayload(token, expiresAt) {
  const resetUrl = `${env.appUrl}/reset-password?token=${token}`;

  return {
    expiresAt,
    ...(env.appEnv !== 'production'
      ? {
          resetToken: token,
          resetUrl,
        }
      : {}),
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Chỉ cho phép tài khoản đang hoạt động đăng nhập và duy trì phiên làm việc.
 */
function assertUserCanUseSession(user) {
  if (!user) {
    throw new ApiError(401, 'Thông tin đăng nhập không chính xác.');
  }

  if (user.status === 'blocked') {
    throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Tài khoản hiện không ở trạng thái hoạt động.');
  }

  return user;
}

function formatSqlDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Chuyển lỗi unique key từ MySQL thành message thân thiện hơn cho frontend.
 */
function mapUserWriteError(error) {
  if (error?.code !== 'ER_DUP_ENTRY') {
    throw error;
  }

  const message = String(error.sqlMessage || error.message || '');

  if (message.includes('uq_users_email')) {
    throw new ApiError(409, 'Email này đã được sử dụng.');
  }

  if (message.includes('uq_users_username')) {
    throw new ApiError(409, 'Tên đăng nhập này đã được sử dụng.');
  }

  if (message.includes('uq_users_phone')) {
    throw new ApiError(409, 'Số điện thoại này đã được sử dụng.');
  }

  throw new ApiError(409, 'Thông tin tài khoản đã tồn tại trong hệ thống.');
}

/**
 * Đăng ký user mới trong DB, validate duplicate trước và sau khi insert.
 */
export async function registerUser(payload) {
  const { email, fullName, password, phone, username } = payload;

  if (!fullName || !email || !phone || !password) {
    throw new ApiError(400, 'Vui lòng cung cấp đầy đủ họ tên, email, số điện thoại và mật khẩu.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = (username || normalizedEmail.split('@')[0]).trim().toLowerCase();

  if (await findUserByEmail(normalizedEmail)) {
    throw new ApiError(409, 'Email này đã được sử dụng.');
  }

  if (await findUserByUsername(normalizedUsername)) {
    throw new ApiError(409, 'Tên đăng nhập này đã được sử dụng.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await createUser({
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
      phone: phone.trim(),
      role: 'user',
      username: normalizedUsername,
    });

    return buildAuthPayload(user);
  } catch (error) {
    mapUserWriteError(error);
  }
}

/**
 * Đăng nhập bằng email hoặc username, sau đó trả về cặp token mới.
 */
export async function loginUser(payload) {
  const { loginId, password } = payload;

  if (!loginId || !password) {
    throw new ApiError(400, 'Vui lòng nhập tên đăng nhập/email và mật khẩu.');
  }

  const user = assertUserCanUseSession(await findUserByLoginId(loginId));

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Thông tin đăng nhập không chính xác.');
  }

  return buildAuthPayload(user);
}

/**
 * Lấy profile user hiện tại từ DB để route `/auth/me` không phụ thuộc localStorage.
 */
export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản.');
  }

  return sanitizeUser(assertUserCanUseSession(user));
}

/**
 * Cập nhật thông tin cá nhân của user đang đăng nhập và đồng bộ lại dữ liệu trả về frontend.
 * Backend chỉ trả về user đã được làm sạch, còn frontend sẽ tự ghi đè lại localStorage để Header đổi tên ngay.
 */
export async function updateCurrentUserProfile(userId, payload) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản.');
  }

  const fullName = String(payload?.fullName || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const phone = String(payload?.phone || '').trim();

  if (!fullName || !email || !phone) {
    throw new ApiError(400, 'Vui lòng nhập đầy đủ họ tên, email và số điện thoại.');
  }

  // Kiểm tra trùng dữ liệu với tài khoản khác trước khi ghi đè để tránh lỗi unique key khó đọc từ DB.
  const emailOwner = await findUserByEmail(email);
  if (emailOwner && emailOwner.id !== user.id) {
    throw new ApiError(409, 'Email này đã được sử dụng.');
  }

  const phoneOwner = await findUserByPhone(phone);
  if (phoneOwner && phoneOwner.id !== user.id) {
    throw new ApiError(409, 'Số điện thoại này đã được sử dụng.');
  }

  try {
    const updatedUser = await updateUserProfile(user.id, {
      email,
      fullName,
      phone,
    });

    return sanitizeUser(updatedUser);
  } catch (error) {
    mapUserWriteError(error);
  }
}

/**
 * Xác thực refresh token và cấp lại trọn bộ session token cho frontend.
 */
export async function refreshUserSession(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(400, 'Vui lòng cung cấp refresh token hợp lệ.');
  }

  try {
    const payload = jwt.verify(refreshToken, env.refreshTokenSecret);
    const user = assertUserCanUseSession(await findUserById(payload.userId));

    return buildAuthPayload(user);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, 'Refresh token không hợp lệ hoặc đã hết hạn.');
  }
}

/**
 * Tạo yêu cầu đặt lại mật khẩu. Ở môi trường development sẽ trả lại token để test local dễ hơn.
 */
export async function requestPasswordReset(payload) {
  const email = String(payload?.email || '').trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, 'Vui lòng nhập email đã đăng ký.');
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return {
      email,
      message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đi.',
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = formatSqlDateTime(
    new Date(Date.now() + env.passwordResetExpiresMinutes * 60 * 1000),
  );

  await withTransaction(async (connection) => {
    await invalidatePasswordResetTokensForUser(user.id, connection);
    await createPasswordResetToken(
      {
        expiresAt,
        tokenHash,
        userId: user.id,
      },
      connection,
    );
  });

  return {
    email,
    message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đi.',
    ...createPasswordResetDebugPayload(rawToken, expiresAt),
  };
}

/**
 * Xác thực token reset và cập nhật mật khẩu mới cho tài khoản.
 */
export async function resetUserPassword(payload) {
  const token = String(payload?.token || '').trim();
  const newPassword = String(payload?.newPassword || '').trim();

  if (!token || !newPassword) {
    throw new ApiError(400, 'Vui lòng cung cấp token đặt lại mật khẩu và mật khẩu mới.');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'Mật khẩu mới cần có ít nhất 6 ký tự.');
  }

  const hashedToken = hashResetToken(token);
  const resetToken = await findValidPasswordResetToken(hashedToken);

  if (!resetToken) {
    throw new ApiError(400, 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await withTransaction(async (connection) => {
    await updateUserPassword(resetToken.userId, passwordHash, connection);
    await markPasswordResetTokenUsed(resetToken.id, connection);
    await invalidatePasswordResetTokensForUser(resetToken.userId, connection);
  });

  return {
    email: resetToken.email,
    resetAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

/**
 * Đổi mật khẩu trong phiên đăng nhập hiện tại bằng cách yêu cầu người dùng nhập mật khẩu cũ.
 * Đây là luồng đổi mật khẩu chủ động sau khi đăng nhập, tách biệt với luồng reset mật khẩu bằng token.
 */
export async function changeCurrentUserPassword(userId, payload) {
  const currentPassword = String(payload?.currentPassword || '').trim();
  const newPassword = String(payload?.newPassword || '').trim();

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'Mật khẩu mới cần có ít nhất 6 ký tự.');
  }

  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản.');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Mật khẩu hiện tại không chính xác.');
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

  if (isSamePassword) {
    throw new ApiError(400, 'Mật khẩu mới cần khác mật khẩu hiện tại.');
  }

  // Chỉ khi đã xác minh mật khẩu cũ hợp lệ mới ghi đè password hash mới vào DB.
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(user.id, passwordHash);

  return {
    changedAt: formatSqlDateTime(new Date()),
    message: 'Đổi mật khẩu thành công.',
  };
}
