import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { AppError } from '../utils/errors.js';
import * as users from '../repositories/userRepository.js';
import * as resets from '../repositories/resetRepository.js';
import { getMailStatus, sendPasswordOtp } from './mailService.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(0|\+84)[0-9]{8,10}$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    role: user.role === 'admin' ? 'admin' : 'customer',
  };
}

function sign(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: publicUser(user).role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function assertEmail(email) {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Email chưa đúng định dạng.');
  }
}

function assertPassword(password) {
  if (!password || password.length < 6) {
    throw new AppError(400, 'Mật khẩu cần ít nhất 6 ký tự.');
  }
  if (password.length > 72) {
    throw new AppError(400, 'Mật khẩu tối đa 72 ký tự.');
  }
}

function assertPhone(phone) {
  if (!PHONE_PATTERN.test(phone)) {
    throw new AppError(400, 'Số điện thoại chưa đúng.');
  }
}

export async function register(body) {
  const fullName = text(body.fullName).replace(/\s+/g, ' ');
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone).replace(/\s+/g, '');
  const password = typeof body.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 80) {
    throw new AppError(400, 'Tên cần từ 2 đến 80 ký tự.');
  }
  assertEmail(email);
  assertPhone(phone);
  assertPassword(password);

  const existing = await users.findByEmail(email);
  if (existing) {
    throw new AppError(409, 'Email này đã có tài khoản.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await users.createUser({ fullName, email, phone, passwordHash });
  return { token: sign(user), user: publicUser(user) };
}

export async function login(body) {
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  assertEmail(email);
  if (!password) {
    throw new AppError(400, 'Bạn nhập mật khẩu giúp.');
  }

  const user = await users.findByEmail(email);
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw new AppError(401, 'Email hoặc mật khẩu chưa đúng.');
  }
  return { token: sign(user), user: publicUser(user) };
}

export async function me(userId) {
  const user = await users.findById(userId);
  if (!user) {
    throw new AppError(401, 'Tài khoản không còn trên hệ thống.');
  }
  return publicUser(user);
}

export function mailStatus() {
  return getMailStatus();
}

export async function forgotPassword(body) {
  const email = text(body.email).toLowerCase();
  assertEmail(email);

  const mail = getMailStatus();
  if (!mail.configured) {
    throw new AppError(503, mail.hint);
  }

  const user = await users.findByEmail(email);
  if (!user) {
    throw new AppError(404, 'Email này chưa có tài khoản.');
  }

  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await resets.replaceCode(user.id, codeHash, expiresAt);

  // OTP chỉ gửi tới đúng email người dùng nhập (ví dụ Gmail bạn bè).
  await sendPasswordOtp({
    to: email,
    code,
    fullName: user.fullName,
  });

  return {
    message: `Đã gửi mã OTP tới ${email}. Mở đúng hộp thư đó (Hộp thư đến / Spam / Quảng cáo). Mã hết hạn sau 15 phút.`,
    email,
  };
}

export async function resetPassword(body) {
  const email = text(body.email).toLowerCase();
  const code = text(body.code);
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  assertEmail(email);
  if (!/^\d{6}$/.test(code)) {
    throw new AppError(400, 'Mã gồm 6 chữ số.');
  }
  assertPassword(newPassword);

  const user = await users.findByEmail(email);
  if (!user) {
    throw new AppError(400, 'Mã không đúng hoặc đã hết hạn.');
  }

  const active = await resets.findActive(user.id);
  if (!active) {
    throw new AppError(400, 'Mã không đúng hoặc đã hết hạn.');
  }
  if (new Date(active.ExpiresAt).getTime() < Date.now()) {
    throw new AppError(400, 'Mã đã hết hạn. Bạn lấy mã mới giúp.');
  }
  const matches = await bcrypt.compare(code, active.CodeHash);
  if (!matches) {
    throw new AppError(400, 'Mã không đúng hoặc đã hết hạn.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.updatePassword(user.id, passwordHash);
  await resets.markUsed(active.Id);
  return { message: 'Đã đổi mật khẩu. Bạn đăng nhập lại được rồi.' };
}

export async function changePassword(userId, body) {
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword) {
    throw new AppError(400, 'Bạn nhập mật khẩu hiện tại giúp.');
  }
  assertPassword(newPassword);

  const user = await users.findById(userId);
  if (!user) {
    throw new AppError(401, 'Tài khoản không còn trên hệ thống.');
  }
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError(400, 'Mật khẩu hiện tại chưa đúng.');
  }
  if (currentPassword === newPassword) {
    throw new AppError(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.updatePassword(user.id, passwordHash);
  return { message: 'Đã đổi mật khẩu.' };
}
