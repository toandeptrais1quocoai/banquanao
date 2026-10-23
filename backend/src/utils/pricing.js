/** Gia ban = gia goc - gia goc x (percent/100). */
export function saleFromBase(base, percent) {
  const origin = Math.max(0, Number(base) || 0);
  const pct = Number(percent) || 0;
  if (origin < 1 || pct < 1) return origin;
  return Math.max(0, Math.round(origin * (1 - pct / 100)));
}

export function productBasePrice(product) {
  const price = Number(product?.price) || 0;
  const original = Number(product?.originalPrice) || 0;
  if (original > price) return original;
  return price;
}

/**
 * Ap dung voucher toan shop len 1 san pham (catalog / cart / checkout).
 * Gia goc giu de gach ngang; gia ban = goc × (1 − %).
 */
export function applyStorefrontPrice(product, store) {
  if (!product) return product;
  if (!store?.active || !store.percent) return product;

  const base = productBasePrice(product);
  const price = saleFromBase(base, store.percent);
  return {
    ...product,
    price,
    originalPrice: base,
    discountPercent: store.percent,
    storeVoucherCode: store.code || null,
  };
}

export function applyStorefrontCartItem(item, store) {
  if (!item) return item;
  if (!store?.active || !store.percent) return item;
  const base =
    item.originalPrice && item.originalPrice > item.price
      ? Number(item.originalPrice)
      : Number(item.price) || 0;
  const price = saleFromBase(base, store.percent);
  return {
    ...item,
    price,
    originalPrice: base,
    discountPercent: store.percent,
    storeVoucherCode: store.code || null,
    lineTotal: (Number(item.quantity) || 0) * price,
  };
}
