import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';

const router = Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', requireAuth, auth.me);
router.get('/mail-status', auth.mailStatus);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/change-password', requireAuth, auth.changePassword);

export default router;
