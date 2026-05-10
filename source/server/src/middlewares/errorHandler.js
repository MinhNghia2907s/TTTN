import { ApiError } from '../utils/apiError.js';

/**
 * Middleware gom toàn bộ lỗi và chuyển thành JSON để frontend dễ xử lý.
 */
export function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống, vui lòng thử lại sau.',
  });
}
