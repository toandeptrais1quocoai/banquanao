import { asyncHandler } from '../middleware/asyncHandler.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.body || {}));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body || {}));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await authService.me(req.userId) });
});

export const mailStatus = asyncHandler(async (req, res) => {
  res.json(authService.mailStatus());
});

export const forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.forgotPassword(req.body || {}));
});

export const resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(req.body || {}));
});

export const changePassword = asyncHandler(async (req, res) => {
  res.json(await authService.changePassword(req.userId, req.body || {}));
});
