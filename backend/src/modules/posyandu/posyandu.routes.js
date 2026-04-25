import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { listPosyandus } from './posyandu.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', listPosyandus);

export { router as posyanduRoutes };

