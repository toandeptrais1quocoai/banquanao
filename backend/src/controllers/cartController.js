import { asyncHandler } from '../middleware/asyncHandler.js';
import * as cartService from '../services/cartService.js';

export const getCart = asyncHandler(async (req, res) => {
  res.json(await cartService.getCart(req.userId));
});

export const addItem = asyncHandler(async (req, res) => {
  res.status(201).json(await cartService.addItem(req.userId, req.body || {}));
});

export const updateItem = asyncHandler(async (req, res) => {
  res.json(await cartService.updateItem(req.userId, req.params.id, req.body || {}));
});

export const removeItem = asyncHandler(async (req, res) => {
  res.json(await cartService.removeItem(req.userId, req.params.id));
});

export const clearCart = asyncHandler(async (req, res) => {
  res.json(await cartService.clearCart(req.userId));
});

export const mergeCart = asyncHandler(async (req, res) => {
  res.json(await cartService.mergeGuestItems(req.userId, req.body || {}));
});

export const hydrateCart = asyncHandler(async (req, res) => {
  res.json(await cartService.hydrateGuestItems(req.body?.items));
});
