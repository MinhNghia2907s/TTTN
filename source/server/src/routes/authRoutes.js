import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getProfile,
  login,
  refreshToken,
  register,
  resetPassword,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/refresh', refreshToken);
authRouter.get('/me', authenticate, getProfile);
// Nhóm route tài khoản sau xác thực: lấy hồ sơ, cập nhật hồ sơ và đổi mật khẩu khi user đang đăng nhập.
authRouter.put('/me', authenticate, updateProfile);
authRouter.post('/change-password', authenticate, changePassword);

export default authRouter;
