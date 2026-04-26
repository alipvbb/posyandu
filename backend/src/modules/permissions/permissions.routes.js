import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAnyPermission } from '../../middlewares/rbac.middleware.js';
import { listPermissions } from './permissions.controller.js';

const router = Router();

router.use(authenticate, requireAnyPermission('users.manage', 'roles.manage'));
router.get('/', listPermissions);

export { router as permissionsRoutes };
