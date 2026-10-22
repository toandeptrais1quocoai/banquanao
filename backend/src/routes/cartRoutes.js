import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as cart from '../controllers/cartController.js';

const router = Router();

router.post('/hydrate', cart.hydrateCart);
router.get('/', requireAuth, cart.getCart);
router.post('/items', requireAuth, cart.addItem);
router.patch('/items/:id', requireAuth, cart.updateItem);
router.delete('/items/:id', requireAuth, cart.removeItem);
router.delete('/', requireAuth, cart.clearCart);
router.post('/merge', requireAuth, cart.mergeCart);

export default router;
