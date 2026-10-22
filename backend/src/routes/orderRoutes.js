import { Router } from 'express';
import { optionalAuth } from '../middleware/optionalAuth.js';
import * as orders from '../controllers/orderController.js';

const router = Router();

router.post('/', optionalAuth, orders.checkout);
router.get('/:id', orders.getOrder);

export default router;
