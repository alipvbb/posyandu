import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createToddler, deleteToddler, getToddlerById, listToddlers, updateToddler } from './balita.controller.js';
import { toddlerCreateSchema, toddlerUpdateSchema } from './balita.schemas.js';

const router = Router();

router.use(authenticate);
router.get('/', requirePermission('toddlers.view'), listToddlers);
router.post('/', requirePermission('toddlers.create'), validate(toddlerCreateSchema), createToddler);
router.get('/:id', requirePermission('toddlers.view'), getToddlerById);
router.put('/:id', requirePermission('toddlers.update'), validate(toddlerUpdateSchema), updateToddler);
router.delete('/:id', requirePermission('toddlers.delete'), deleteToddler);

export { router as balitaRoutes };

