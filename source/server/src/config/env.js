import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const port = Number(process.env.PORT || 3000);
const appUrl = `http://localhost:${port}`;

/**
 * Chuẩn hóa các biến môi trường để phần backend dùng chung một nguồn cấu hình.
 */
export const env = {
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '7h',
  appEnv: process.env.APP_ENV || 'development',
  appName: process.env.APP_NAME || 'Website bán gói tour du lịch Chill n Free',
  appPort: port,
  appUrl,
  dbHost: process.env.DB_HOST || 'localhost',
  dbName: process.env.DB_NAME || 'tour_db',
  dbPassword: process.env.DB_PASSWORD || '',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  jwtSecret: process.env.JWT_SECRET || 'change_me_for_real_project',
  passwordResetExpiresMinutes: Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 30),
  payosApiKey: process.env.PAYOS_API_KEY || '',
  payosCancelUrl: process.env.PAYOS_CANCEL_URL || '',
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  payosClientId: process.env.PAYOS_CLIENT_ID || '',
  payosReturnUrl: process.env.PAYOS_RETURN_URL || '',
  payosWebhookUrl: process.env.PAYOS_WEBHOOK_URL || `${appUrl}/api/payments/payos/webhook`,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '1d',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'change_me_for_real_project_refresh',
};
