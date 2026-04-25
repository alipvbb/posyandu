import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { getCardByToddlerId, getPublicCard } from './cards.controller.js';

const router = Router();

router.get('/public/:token', getPublicCard);
router.get('/:id', authenticate, requirePermission('cards.generate'), getCardByToddlerId);

export { router as cardsRoutes };

