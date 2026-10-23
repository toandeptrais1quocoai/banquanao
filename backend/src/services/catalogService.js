import { AppError } from '../utils/errors.js';
import * as catalog from '../repositories/catalogRepository.js';
import * as shopSettings from '../repositories/shopSettingsRepository.js';
import { applyStorefrontPrice } from '../utils/pricing.js';

async function withStorefront(productOrList) {
  const store = await shopSettings.getStorefrontVoucher();
  if (Array.isArray(productOrList)) {
    return productOrList.map((item) => applyStorefrontPrice(item, store));
  }
  return applyStorefrontPrice(productOrList, store);
}

export function listCategories() {
  return catalog.listCategories();
}

export async function listProducts(category, search) {
  const slug = typeof category === 'string' ? category.trim() : '';
  const q = typeof search === 'string' ? search.trim().slice(0, 80) : '';
  const products = await catalog.listProducts(slug, q);
  return withStorefront(products);
}

export async function getProduct(slug) {
  const product = await catalog.findProductBySlug(slug);
  if (!product) {
    throw new AppError(404, 'Không thấy món này trong gian hàng.');
  }
  return withStorefront(product);
}

export async function getStorefrontBanner() {
  return shopSettings.getStorefrontVoucher();
}
