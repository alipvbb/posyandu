import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createParent, deleteParent, listParents, updateParent } from './parents.controller.js';
import { parentCreateSchema, parentUpdateSchema } from './parents.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/mothers', requirePermission('toddlers.create'), listParents('mother'));
router.post('/mothers', requirePermission('toddlers.create'), validate(parentCreateSchema), createParent('mother'));
router.put('/mothers/:id', requirePermission('toddlers.update'), validate(parentUpdateSchema), updateParent('mother'));
router.delete('/mothers/:id', requirePermission('toddlers.delete'), deleteParent('mother'));

router.get('/fathers', requirePermission('toddlers.create'), listParents('father'));
router.post('/fathers', requirePermission('toddlers.create'), validate(parentCreateSchema), createParent('father'));
router.put('/fathers/:id', requirePermission('toddlers.update'), validate(parentUpdateSchema), updateParent('father'));
router.delete('/fathers/:id', requirePermission('toddlers.delete'), deleteParent('father'));

export { router as parentsRoutes };
