import { AppError } from '../utils/errors.js';
import * as cart from '../repositories/cartRepository.js';
import * as catalog from '../repositories/catalogRepository.js';
import * as shopSettings from '../repositories/shopSettingsRepository.js';
import { applyStorefrontCartItem, applyStorefrontPrice } from '../utils/pricing.js';

const MAX_QTY = 20;

function summarize(items) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return { items, itemCount, total };
}

async function pricedCartItems(items) {
  const store = await shopSettings.getStorefrontVoucher();
  return items.map((item) => applyStorefrontCartItem(item, store));
}

async function pricedProduct(product) {
  const store = await shopSettings.getStorefrontVoucher();
  return applyStorefrontPrice(product, store);
}

function parseQuantity(value, { required = true } = {}) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
    if (!required && (value === undefined || value === null || value === '')) {
      return 1;
    }
    throw new AppError(400, `Số lượng từ 1 đến ${MAX_QTY}.`);
  }
  return quantity;
}

function parseSize(value, product) {
  const size = typeof value === 'string' ? value.trim() : '';
  if (!size) {
    throw new AppError(400, 'Bạn chọn size giúp.');
  }
  if (!product.sizes.includes(size)) {
    throw new AppError(400, 'Size này không có ở món đang chọn.');
  }
  return size;
}

function parseColor(value, product) {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!color) {
    throw new AppError(400, 'Bạn chọn màu giúp.');
  }
  const names = (product.colors || []).map((item) => item.name);
  if (!names.includes(color)) {
    throw new AppError(400, 'Màu này không có ở món đang chọn.');
  }
  return color;
}

function colorMeta(product, colorName) {
  return (product.colors || []).find((item) => item.name === colorName) || {
    name: colorName,
    hex: product.colorHex,
    imageUrl: product.imageUrl,
  };
}

export async function getCart(userId) {
  return summarize(await pricedCartItems(await cart.listByUser(userId)));
}

export async function addItem(userId, body) {
  const productId = Number(body.productId);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new AppError(400, 'Món này không hợp lệ.');
  }
  const product = await pricedProduct(await catalog.findProductById(productId));
  if (!product) {
    throw new AppError(404, 'Không thấy món này trong gian hàng.');
  }
  const size = parseSize(body.size, product);
  const color = parseColor(body.color ?? body.colorName, product);
  const quantity = parseQuantity(body.quantity, { required: false });

  const existing = await cart.findLine(userId, productId, size, color);
  if (existing) {
    const next = Math.min(MAX_QTY, existing.Quantity + quantity);
    await cart.updateQuantity(existing.Id, userId, next);
  } else {
    await cart.insertItem(userId, productId, size, color, quantity);
  }
  return summarize(await pricedCartItems(await cart.listByUser(userId)));
}

export async function updateItem(userId, itemId, body) {
  const id = Number(itemId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'Dòng giỏ không hợp lệ.');
  }
  const quantity = parseQuantity(body.quantity);
  const existing = await cart.findByIdForUser(id, userId);
  if (!existing) {
    throw new AppError(404, 'Không thấy dòng này trong giỏ.');
  }
  await cart.updateQuantity(id, userId, quantity);
  return summarize(await pricedCartItems(await cart.listByUser(userId)));
}

export async function removeItem(userId, itemId) {
  const id = Number(itemId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'Dòng giỏ không hợp lệ.');
  }
  const ok = await cart.removeItem(id, userId);
  if (!ok) {
    throw new AppError(404, 'Không thấy dòng này trong giỏ.');
  }
  return summarize(await pricedCartItems(await cart.listByUser(userId)));
}

export async function clearCart(userId) {
  await cart.clearByUser(userId);
  return summarize([]);
}

export async function mergeGuestItems(userId, body) {
  const raw = Array.isArray(body.items) ? body.items : [];
  if (raw.length > 40) {
    throw new AppError(400, 'Giỏ khách quá nhiều dòng.');
  }

  for (const entry of raw) {
    const productId = Number(entry.productId);
    if (!Number.isInteger(productId) || productId < 1) continue;
    const product = await pricedProduct(await catalog.findProductById(productId));
    if (!product) continue;
    let size;
    let color;
    try {
      size = parseSize(entry.size, product);
      color = parseColor(entry.color ?? entry.colorName ?? product.colorName, product);
    } catch {
      continue;
    }
    let quantity;
    try {
      quantity = parseQuantity(entry.quantity, { required: false });
    } catch {
      continue;
    }
    const existing = await cart.findLine(userId, productId, size, color);
    if (existing) {
      const next = Math.min(MAX_QTY, existing.Quantity + quantity);
      await cart.updateQuantity(existing.Id, userId, next);
    } else {
      await cart.insertItem(userId, productId, size, color, quantity);
    }
  }

  return summarize(await pricedCartItems(await cart.listByUser(userId)));
}

export async function hydrateGuestItems(rawItems) {
  const entries = Array.isArray(rawItems) ? rawItems : [];
  const store = await shopSettings.getStorefrontVoucher();
  const products = await catalog.findProductsByIds(entries.map((item) => item.productId));
  const byId = new Map(
    products.map((product) => [product.id, applyStorefrontPrice(product, store)]),
  );
  const items = [];

  for (const entry of entries) {
    const product = byId.get(Number(entry.productId));
    if (!product) continue;
    const size = typeof entry.size === 'string' ? entry.size.trim() : '';
    if (!product.sizes.includes(size)) continue;
    const color = typeof (entry.color ?? entry.colorName) === 'string'
      ? String(entry.color ?? entry.colorName).trim()
      : product.colorName;
    if (!(product.colors || []).some((item) => item.name === color)) continue;
    let quantity;
    try {
      quantity = parseQuantity(entry.quantity, { required: false });
    } catch {
      continue;
    }
    const meta = colorMeta(product, color);
    items.push({
      id: `local-${product.id}-${size}-${color}`,
      productId: product.id,
      size,
      color,
      quantity,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice || null,
      imageUrl: meta.imageUrl || product.imageUrl,
      colorName: color,
      colorHex: meta.hex || product.colorHex,
      lineTotal: quantity * product.price,
    });
  }

  return summarize(items);
}
