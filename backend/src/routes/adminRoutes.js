import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', adminController.dashboard);
router.get('/categories', adminController.listCategories);
router.get('/products', adminController.listProducts);
router.get('/products/:id', adminController.getProduct);
router.post('/products', adminController.createProduct);
router.patch('/products/:id', adminController.updateProduct);
router.patch('/products/:id/inventory', adminController.updateInventory);
router.delete('/products/:id', adminController.removeProduct);
router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.getOrder);
router.patch('/orders/:id', adminController.updateOrderStatus);
router.get('/customers', adminController.listCustomers);
router.get('/customers/:id', adminController.getCustomer);
router.post('/customers', adminController.createCustomer);
router.patch('/customers/:id', adminController.updateCustomer);
router.delete('/customers/:id', adminController.removeCustomer);

export default router;
