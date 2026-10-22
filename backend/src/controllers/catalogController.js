import { asyncHandler } from '../middleware/asyncHandler.js';
import * as catalogService from '../services/catalogService.js';

export const categories = asyncHandler(async (req, res) => {
  res.json({ categories: await catalogService.listCategories() });
});

export const products = asyncHandler(async (req, res) => {
  res.json({
    products: await catalogService.listProducts(req.query.category, req.query.q),
  });
});

export const product = asyncHandler(async (req, res) => {
  res.json({ product: await catalogService.getProduct(req.params.slug) });
});
