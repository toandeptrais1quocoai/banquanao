import { AppError } from '../utils/errors.js';
import * as catalog from '../repositories/catalogRepository.js';

export function listCategories() {
  return catalog.listCategories();
}

export function listProducts(category, search) {
  const slug = typeof category === 'string' ? category.trim() : '';
  const q = typeof search === 'string' ? search.trim().slice(0, 80) : '';
  return catalog.listProducts(slug, q);
}

export async function getProduct(slug) {
  const product = await catalog.findProductBySlug(slug);
  if (!product) {
    throw new AppError(404, 'Không thấy món này trong gian hàng.');
  }
  return product;
}
