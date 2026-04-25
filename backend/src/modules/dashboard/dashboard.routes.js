import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { getDashboardRisk, getDashboardSummary } from './dashboard.controller.js';

const router = Router();

router.use(authenticate, requirePermission('dashboard.view'));
router.get('/summary', getDashboardSummary);
router.get('/risk', getDashboardRisk);

export { router as dashboardRoutes };

