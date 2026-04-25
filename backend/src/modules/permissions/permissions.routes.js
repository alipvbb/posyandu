import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { listPermissions } from './permissions.controller.js';

const router = Router();

router.use(authenticate, requirePermission('roles.manage'));
router.get('/', listPermissions);

export { router as permissionsRoutes };

