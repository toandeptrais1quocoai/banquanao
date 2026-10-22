import { asyncHandler } from '../middleware/asyncHandler.js';
import * as orderService from '../services/orderService.js';

export const checkout = asyncHandler(async (req, res) => {
  res.status(201).json(await orderService.checkout(req.userId, req.body || {}));
});

export const getOrder = asyncHandler(async (req, res) => {
  res.json(await orderService.getOrder(req.params.id));
});
