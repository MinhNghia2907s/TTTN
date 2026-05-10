/**
 * Trả response thành công theo một format thống nhất.
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
