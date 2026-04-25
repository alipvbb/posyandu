import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { listRoles, updateRolePermissions } from './roles.controller.js';
import { rolePermissionUpdateSchema } from './roles.schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', requirePermission('roles.manage'), listRoles);
router.put('/:id/permissions', requirePermission('roles.manage'), validate(rolePermissionUpdateSchema), updateRolePermissions);

export { router as rolesRoutes };

