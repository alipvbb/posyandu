import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUser, deleteUser, listUsers, updateUser } from './users.controller.js';
import { userCreateSchema, userUpdateSchema } from './users.schemas.js';

const router = Router();

router.use(authenticate, requirePermission('users.manage'));
router.get('/', listUsers);
router.post('/', validate(userCreateSchema), createUser);
router.put('/:id', validate(userUpdateSchema), updateUser);
router.delete('/:id', deleteUser);

export { router as usersRoutes };

