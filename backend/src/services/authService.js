import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { AppError } from '../utils/errors.js';
import * as users from '../repositories/userRepository.js';
import * as resets from '../repositories/resetRepository.js';
import { sendPasswordOtp } from './mailService.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
  };
}

function sign(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
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

export async function register(body) {
  const fullName = text(body.fullName).replace(/\s+/g, ' ');
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 80) {
    throw new AppError(400, 'Tên cần từ 2 đến 80 ký tự.');
  }
  assertEmail(email);
  assertPassword(password);

  const existing = await users.findByEmail(email);
  if (existing) {
    throw new AppError(409, 'Email này đã có tài khoản.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await users.createUser({ fullName, email, passwordHash });
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

export async function forgotPassword(body) {
  const email = text(body.email).toLowerCase();
  assertEmail(email);

  const user = await users.findByEmail(email);
  if (!user) {
    throw new AppError(404, 'Email này chưa có tài khoản.');
  }

  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await resets.replaceCode(user.id, codeHash, expiresAt);

  await sendPasswordOtp({
    to: user.email,
    code,
    fullName: user.fullName,
  });

  return {
    message: 'Đã gửi mã OTP vào Gmail của bạn. Mã hết hạn sau 15 phút.',
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
