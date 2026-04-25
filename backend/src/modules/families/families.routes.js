import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createFamily, deleteFamily, listFamilies, updateFamily } from './families.controller.js';
import { familyCreateSchema, familyUpdateSchema } from './families.schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', requirePermission('toddlers.create'), listFamilies);
router.post('/', requirePermission('toddlers.create'), validate(familyCreateSchema), createFamily);
router.put('/:id', requirePermission('toddlers.update'), validate(familyUpdateSchema), updateFamily);
router.delete('/:id', requirePermission('toddlers.delete'), deleteFamily);

export { router as familiesRoutes };
