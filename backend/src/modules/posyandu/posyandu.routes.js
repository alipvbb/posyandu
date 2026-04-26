import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createHamlet,
  createPosyandu,
  createRt,
  createRw,
  deleteHamlet,
  deletePosyandu,
  deleteRt,
  deleteRw,
  listHamlets,
  listPosyandus,
  listRts,
  listRws,
  updateHamlet,
  updatePosyandu,
  updateRt,
  updateRw,
} from './posyandu.controller.js';
import {
  hamletCreateSchema,
  hamletUpdateSchema,
  posyanduCreateSchema,
  posyanduUpdateSchema,
  rtCreateSchema,
  rtUpdateSchema,
  rwCreateSchema,
  rwUpdateSchema,
} from './posyandu.schemas.js';

const router = Router();

router.use(authenticate);
router.get('/hamlets', listHamlets);
router.get('/rws', listRws);
router.get('/rts', listRts);
router.get('/', listPosyandus);
router.post('/hamlets', requirePermission('settings.manage'), validate(hamletCreateSchema), createHamlet);
router.put('/hamlets/:id', requirePermission('settings.manage'), validate(hamletUpdateSchema), updateHamlet);
router.delete('/hamlets/:id', requirePermission('settings.manage'), deleteHamlet);
router.post('/rws', requirePermission('settings.manage'), validate(rwCreateSchema), createRw);
router.put('/rws/:id', requirePermission('settings.manage'), validate(rwUpdateSchema), updateRw);
router.delete('/rws/:id', requirePermission('settings.manage'), deleteRw);
router.post('/rts', requirePermission('settings.manage'), validate(rtCreateSchema), createRt);
router.put('/rts/:id', requirePermission('settings.manage'), validate(rtUpdateSchema), updateRt);
router.delete('/rts/:id', requirePermission('settings.manage'), deleteRt);
router.post('/', requirePermission('settings.manage'), validate(posyanduCreateSchema), createPosyandu);
router.put('/:id', requirePermission('settings.manage'), validate(posyanduUpdateSchema), updatePosyandu);
router.delete('/:id', requirePermission('settings.manage'), deletePosyandu);

export { router as posyanduRoutes };
