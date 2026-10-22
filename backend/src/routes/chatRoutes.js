import { Router } from 'express';
import * as chat from '../controllers/chatController.js';

const router = Router();

router.post('/', chat.chat);

export default router;
