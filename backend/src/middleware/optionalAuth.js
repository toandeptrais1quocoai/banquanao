import jwt from 'jsonwebtoken';

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    req.userId = null;
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
  } catch {
    req.userId = null;
  }
  next();
}
