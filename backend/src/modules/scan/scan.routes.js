import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { resolveScan } from './scan.controller.js';

const router = Router();

router.post('/resolve', authenticate, requirePermission('qrcode.scan'), resolveScan);

export { router as scanRoutes };

