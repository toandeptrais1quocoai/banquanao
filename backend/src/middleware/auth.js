import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    next(new AppError(401, 'Bạn cần đăng nhập.'));
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
    next();
  } catch {
    next(new AppError(401, 'Phiên đăng nhập đã hết. Bạn đăng nhập lại giúp.'));
  }
}
