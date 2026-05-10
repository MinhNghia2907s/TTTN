/**
 * Lớp lỗi chuẩn để service/controller có thể trả về HTTP status rõ ràng.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
