import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { getCheckupReport, getReportInsights, getRiskReport, getToddlerReport } from './reports.controller.js';

const router = Router();

router.use(authenticate, requirePermission('reports.view'));
router.get('/insights', getReportInsights);
router.get('/toddlers', getToddlerReport);
router.get('/checkups', getCheckupReport);
router.get('/risk', getRiskReport);

export { router as reportsRoutes };
