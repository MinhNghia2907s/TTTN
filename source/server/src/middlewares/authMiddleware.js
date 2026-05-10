import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById } from '../models/userModel.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware bảo vệ các route cần đăng nhập:
 * đọc Bearer token, verify JWT, sau đó nạp user thật từ DB vào `req.user`.
 */
export async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Bạn cần đăng nhập để sử dụng tính năng này.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await findUserById(payload.userId);

    if (!user) {
      return next(new ApiError(401, 'Tài khoản không tồn tại hoặc đã hết hiệu lực.'));
    }

    if (user.status === 'blocked') {
      return next(new ApiError(403, 'Tài khoản đã bị khóa và không thể tiếp tục sử dụng phiên hiện tại.'));
    }

    if (user.status !== 'active') {
      return next(new ApiError(403, 'Tài khoản hiện không ở trạng thái hoạt động.'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn.'));
  }
}
