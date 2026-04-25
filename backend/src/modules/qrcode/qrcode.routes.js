import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { getQrCode } from './qrcode.controller.js';

const router = Router();

router.use(authenticate, requirePermission('cards.generate'));
router.get('/:id', getQrCode);

export { router as qrcodeRoutes };

