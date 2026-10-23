import { asyncHandler } from '../middleware/asyncHandler.js';
import * as adminService from '../services/adminService.js';
import * as voucherService from '../services/voucherService.js';

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ stats: await adminService.dashboard() });
});

export const listProducts = asyncHandler(async (req, res) => {
  res.json({
    products: await adminService.listProducts(req.query.category, req.query.q),
  });
});

export const listCategories = asyncHandler(async (req, res) => {
  res.json({ categories: await adminService.listCategories() });
});

export const getProduct = asyncHandler(async (req, res) => {
  res.json({ product: await adminService.getProduct(req.params.id) });
});

export const createProduct = asyncHandler(async (req, res) => {
  res.status(201).json({ product: await adminService.createProduct(req.body) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  res.json({ product: await adminService.updateProduct(req.params.id, req.body) });
});

export const updateInventory = asyncHandler(async (req, res) => {
  res.json({ product: await adminService.updateInventory(req.params.id, req.body) });
});

export const removeProduct = asyncHandler(async (req, res) => {
  res.json(await adminService.removeProduct(req.params.id));
});

export const listOrders = asyncHandler(async (req, res) => {
  res.json({ orders: await adminService.listOrders() });
});

export const getOrder = asyncHandler(async (req, res) => {
  res.json({ order: await adminService.getOrder(req.params.id) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  res.json({ order: await adminService.updateOrderStatus(req.params.id, req.body) });
});

export const listCustomers = asyncHandler(async (req, res) => {
  res.json({ customers: await adminService.listCustomers() });
});

export const getCustomer = asyncHandler(async (req, res) => {
  res.json({ customer: await adminService.getCustomer(req.params.id) });
});

export const createCustomer = asyncHandler(async (req, res) => {
  res.status(201).json({ customer: await adminService.createCustomer(req.body) });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  res.json({ customer: await adminService.updateCustomer(req.params.id, req.body) });
});

export const removeCustomer = asyncHandler(async (req, res) => {
  res.json(await adminService.removeCustomer(req.params.id));
});

export const listVouchers = asyncHandler(async (req, res) => {
  res.json({ vouchers: await voucherService.listVouchers() });
});

export const createVoucher = asyncHandler(async (req, res) => {
  res.status(201).json({ voucher: await voucherService.createVoucher(req.body || {}) });
});

export const updateVoucher = asyncHandler(async (req, res) => {
  res.json({ voucher: await voucherService.updateVoucher(req.params.id, req.body || {}) });
});

export const removeVoucher = asyncHandler(async (req, res) => {
  res.json(await voucherService.removeVoucher(req.params.id));
});

export const applyVoucher = asyncHandler(async (req, res) => {
  res.json(await voucherService.applyVoucher(req.body || {}));
});

export const previewVoucher = asyncHandler(async (req, res) => {
  res.json(
    await voucherService.previewVoucher(req.body?.code, req.body?.subtotal),
  );
});

export const getStorefrontVoucher = asyncHandler(async (req, res) => {
  res.json({ storefront: await voucherService.getStorefrontVoucher() });
});

export const setStorefrontVoucher = asyncHandler(async (req, res) => {
  res.json({ storefront: await voucherService.setStorefrontVoucher(req.body || {}) });
});
