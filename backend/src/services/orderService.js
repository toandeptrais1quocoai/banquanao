import { AppError } from '../utils/errors.js';
import * as cart from '../repositories/cartRepository.js';
import * as catalog from '../repositories/catalogRepository.js';
import * as orders from '../repositories/orderRepository.js';

const PHONE_PATTERN = /^(0|\+84)[0-9]{8,10}$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildOrderLines(entries) {
  return entries.map((item) => ({
    productId: item.productId,
    productName: item.name || item.productName,
    size: item.size,
    color: item.color || item.colorName || '',
    unitPrice: item.price || item.unitPrice,
    quantity: item.quantity,
  }));
}

async function resolveGuestItems(rawItems) {
  const entries = Array.isArray(rawItems) ? rawItems : [];
  if (!entries.length) {
    throw new AppError(400, 'Giỏ đang trống.');
  }
  if (entries.length > 40) {
    throw new AppError(400, 'Đơn quá nhiều dòng.');
  }

  const products = await catalog.findProductsByIds(entries.map((item) => item.productId));
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines = [];

  for (const entry of entries) {
    const product = byId.get(Number(entry.productId));
    if (!product) {
      throw new AppError(400, 'Có món trong giỏ không còn bán.');
    }
    const size = text(entry.size);
    if (!product.sizes.includes(size)) {
      throw new AppError(400, `Size ${size || '(trống)'} không khớp món ${product.name}.`);
    }
    const color = text(entry.color || entry.colorName);
    if (!(product.colors || []).some((item) => item.name === color)) {
      throw new AppError(400, `Màu ${color || '(trống)'} không khớp món ${product.name}.`);
    }
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new AppError(400, 'Số lượng không hợp lệ.');
    }
    lines.push({
      productId: product.id,
      productName: product.name,
      size,
      color,
      unitPrice: product.price,
      quantity,
    });
  }

  return lines;
}

export async function checkout(userId, body) {
  const fullName = text(body.fullName).replace(/\s+/g, ' ');
  const phone = text(body.phone).replace(/\s+/g, '');
  const address = text(body.address);
  const note = text(body.note);
  const paymentMethod = text(body.paymentMethod) || 'COD';

  if (fullName.length < 2 || fullName.length > 80) {
    throw new AppError(400, 'Họ tên cần từ 2 đến 80 ký tự.');
  }
  if (!PHONE_PATTERN.test(phone)) {
    throw new AppError(400, 'Số điện thoại chưa đúng.');
  }
  if (address.length < 8 || address.length > 300) {
    throw new AppError(400, 'Địa chỉ cần từ 8 đến 300 ký tự.');
  }
  if (note.length > 400) {
    throw new AppError(400, 'Ghi chú tối đa 400 ký tự.');
  }
  if (paymentMethod !== 'COD') {
    throw new AppError(400, 'Hiện chỉ nhận thanh toán khi nhận hàng (COD).');
  }

  let lines;
  let cartItemIds = [];
  if (userId) {
    const cartItems = await cart.listByUser(userId);
    if (!cartItems.length) {
      throw new AppError(400, 'Giỏ đang trống.');
    }
    const selectedIds = Array.isArray(body.itemIds)
      ? body.itemIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : [];
    const chosen = selectedIds.length
      ? cartItems.filter((item) => selectedIds.includes(item.id))
      : cartItems;
    if (!chosen.length) {
      throw new AppError(400, 'Bạn chọn ít nhất một món trong giỏ.');
    }
    cartItemIds = chosen.map((item) => item.id);
    lines = buildOrderLines(chosen);
  } else {
    lines = await resolveGuestItems(body.items);
  }

  const total = lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const created = await orders.createOrder(
    {
      userId: userId || null,
      fullName,
      phone,
      address,
      note: note || null,
      paymentMethod,
      total,
      cartItemIds,
    },
    lines,
  );

  return {
    order: {
      ...created,
      fullName,
      phone,
      address,
      note: note || null,
      paymentMethod,
      itemCount: lines.reduce((sum, item) => sum + item.quantity, 0),
      items: lines.map((item, index) => ({
        id: index + 1,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
      })),
    },
  };
}

export async function getOrder(id) {
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    throw new AppError(400, 'Mã đơn không hợp lệ.');
  }
  const order = await orders.findById(orderId);
  if (!order) {
    throw new AppError(404, 'Không thấy đơn này.');
  }
  return { order };
}
