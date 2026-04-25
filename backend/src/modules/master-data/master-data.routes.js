import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getMasterData } from './master-data.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getMasterData);

export { router as masterDataRoutes };

