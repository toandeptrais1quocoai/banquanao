import { asyncHandler } from '../middleware/asyncHandler.js';
import * as orderService from '../services/orderService.js';

export const checkout = asyncHandler(async (req, res) => {
  res.status(201).json(await orderService.checkout(req.userId, req.body || {}));
});

export const listMyOrders = asyncHandler(async (req, res) => {
  res.json(await orderService.listMyOrders(req.userId));
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  res.json(await orderService.cancelMyOrder(req.userId, req.params.id));
});

export const getOrder = asyncHandler(async (req, res) => {
  res.json(await orderService.getOrder(req.params.id));
});
