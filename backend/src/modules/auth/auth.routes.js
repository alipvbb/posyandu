import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendRegisterCode,
  resetPassword,
  verifyRegister,
} from './auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendRegisterCodeSchema,
  resetPasswordSchema,
  verifyRegisterSchema,
} from './auth.schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-register', validate(verifyRegisterSchema), verifyRegister);
router.post('/resend-register-code', validate(resendRegisterCodeSchema), resendRegisterCode);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export { router as authRoutes };
