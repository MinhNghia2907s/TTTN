import {
  changeCurrentUserPassword,
  requestPasswordReset,
  getCurrentUser,
  loginUser,
  resetUserPassword,
  refreshUserSession,
  registerUser,
  updateCurrentUserProfile,
} from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Nhận request đăng ký và ủy quyền xử lý cho auth service.
 */
export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, result, 'Đăng ký tài khoản thành công.', 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Nhận request đăng nhập và trả về auth payload cho frontend.
 */
export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    return sendSuccess(res, result, 'Đăng nhập thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Nhận request quên mật khẩu và tạo token reset nếu email tồn tại.
 */
export async function forgotPassword(req, res, next) {
  try {
    const result = await requestPasswordReset(req.body);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    return next(error);
  }
}

/**
 * Nhận token reset và mật khẩu mới để hoàn tất đổi mật khẩu.
 */
export async function resetPassword(req, res, next) {
  try {
    const result = await resetUserPassword(req.body);
    return sendSuccess(res, result, 'Đặt lại mật khẩu thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Endpoint làm mới session khi access token hết hạn.
 */
export async function refreshToken(req, res, next) {
  try {
    const result = await refreshUserSession(req.body.refreshToken);
    return sendSuccess(res, result, 'Làm mới phiên đăng nhập thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả profile user hiện tại dựa trên `req.user` đã được middleware xác thực.
 */
export async function getProfile(req, res, next) {
  try {
    const result = await getCurrentUser(req.user.id);
    return sendSuccess(res, result, 'Lấy thông tin tài khoản thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Cập nhật hồ sơ cơ bản cho tài khoản đang đăng nhập.
 * Route này được gọi từ trang "Cài đặt tài khoản" mở ra từ dropdown người dùng trên Header.
 */
export async function updateProfile(req, res, next) {
  try {
    const result = await updateCurrentUserProfile(req.user.id, req.body);
    return sendSuccess(res, result, 'Cập nhật thông tin tài khoản thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Đổi mật khẩu trong phiên hiện tại sau khi xác thực lại bằng mật khẩu cũ.
 * Frontend dùng route này cho màn "Đổi mật khẩu", không đi qua email reset token.
 */
export async function changePassword(req, res, next) {
  try {
    const result = await changeCurrentUserPassword(req.user.id, req.body);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    return next(error);
  }
}
