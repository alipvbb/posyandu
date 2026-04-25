import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { listAuditLogs } from './audit.controller.js';

const router = Router();

router.use(authenticate, requirePermission('audit.view'));
router.get('/', listAuditLogs);

export { router as auditRoutes };

