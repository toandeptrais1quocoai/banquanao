import { Router } from 'express';
import * as catalog from '../controllers/catalogController.js';

const router = Router();

router.get('/categories', catalog.categories);
router.get('/storefront-voucher', catalog.storefrontVoucher);
router.get('/products', catalog.products);
router.get('/products/:slug', catalog.product);

export default router;
