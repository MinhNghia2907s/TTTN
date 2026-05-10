import { env } from '../config/env.js';
import { API_PREFIX } from '../routes/index.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Trả trạng thái sống của backend để kiểm tra server đã chạy hay chưa.
 */
export function getHealth(req, res) {
  return sendSuccess(
    res,
    {
      apiPrefix: API_PREFIX,
      appName: env.appName,
      environment: env.appEnv,
      timestamp: new Date().toISOString(),
    },
    'Backend is healthy.',
  );
}
