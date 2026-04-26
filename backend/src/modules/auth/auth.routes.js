import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { changePassword, login, logout, me, refresh, register, resendRegisterCode, verifyRegister } from './auth.controller.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendRegisterCodeSchema,
  verifyRegisterSchema,
} from './auth.schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-register', validate(verifyRegisterSchema), verifyRegister);
router.post('/resend-register-code', validate(resendRegisterCodeSchema), resendRegisterCode);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export { router as authRoutes };
