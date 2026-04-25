import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCheckup, deleteCheckup, getMonthlyCheckupOverview, listToddlerCheckups, updateCheckup } from './checkups.controller.js';
import { checkupCreateSchema, checkupUpdateSchema } from './checkups.schemas.js';

const router = Router();

router.get('/checkups/monthly', authenticate, requirePermission('checkups.view'), getMonthlyCheckupOverview);
router.get('/checkups/daily', authenticate, requirePermission('checkups.view'), getMonthlyCheckupOverview);
router.get('/toddlers/:id/checkups', authenticate, requirePermission('checkups.view'), listToddlerCheckups);
router.post('/toddlers/:id/checkups', authenticate, requirePermission('checkups.create'), validate(checkupCreateSchema), createCheckup);
router.put('/checkups/:id', authenticate, requirePermission('checkups.update'), validate(checkupUpdateSchema), updateCheckup);
router.delete('/checkups/:id', authenticate, requirePermission('checkups.delete'), deleteCheckup);

export { router as checkupsRoutes };
