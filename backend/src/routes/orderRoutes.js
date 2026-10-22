import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import * as orders from '../controllers/orderController.js';

const router = Router();

router.post('/', optionalAuth, orders.checkout);
router.get('/', requireAuth, orders.listMyOrders);
router.post('/:id/cancel', requireAuth, orders.cancelMyOrder);
router.get('/:id', orders.getOrder);

export default router;
