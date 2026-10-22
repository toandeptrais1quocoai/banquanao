import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import * as users from '../repositories/userRepository.js';
import { asyncHandler } from './asyncHandler.js';

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
    req.tokenRole = payload.role === 'admin' ? 'admin' : 'customer';
    next();
  } catch {
    next(new AppError(401, 'Phiên đăng nhập đã hết. Bạn đăng nhập lại giúp.'));
  }
}

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const user = await users.findById(req.userId);
  if (!user || user.role !== 'admin') {
    throw new AppError(403, 'Chỉ tài khoản quản trị mới vào được khu vực này.');
  }
  req.admin = user;
  next();
});
