import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { getPayment } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins.length === 1 ? origins[0] : origins }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });
  app.get('/api/payment', getPayment);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Không có đường dẫn này.' });
  });
  app.use(errorHandler);
  return app;
}
