import { AppError } from '../utils/errors.js';
import { buildVietQrUrl, getPaymentInfo } from '../config/payment.js';
import * as cart from '../repositories/cartRepository.js';
import * as catalog from '../repositories/catalogRepository.js';
import * as orders from '../repositories/orderRepository.js';
import * as users from '../repositories/userRepository.js';

const PHONE_PATTERN = /^(0|\+84)[0-9]{8,10}$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function enrichLines(entries) {
  const products = await catalog.findProductsByIds(entries.map((item) => item.productId));
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines = [];
  const needed = new Map();

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
    needed.set(product.id, (needed.get(product.id) || 0) + quantity);
    lines.push({
      productId: product.id,
      productName: product.name,
      size,
      color,
      unitPrice: product.price,
      unitCost: product.costPrice || 0,
      quantity,
    });
  }

  for (const [productId, quantity] of needed) {
    const product = byId.get(productId);
    if (product.stockQty < quantity) {
      throw new AppError(400, `“${product.name}” chỉ còn ${product.stockQty} sản phẩm trong kho.`);
    }
  }

  return lines;
}

async function resolveGuestItems(rawItems) {
  const entries = Array.isArray(rawItems) ? rawItems : [];
  if (!entries.length) {
    throw new AppError(400, 'Giỏ đang trống.');
  }
  if (entries.length > 40) {
    throw new AppError(400, 'Đơn quá nhiều dòng.');
  }
  return enrichLines(entries);
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
  if (paymentMethod !== 'COD' && paymentMethod !== 'QR') {
    throw new AppError(400, 'Hình thức thanh toán không hợp lệ.');
  }
  if (paymentMethod === 'QR' && !getPaymentInfo().enabled) {
    throw new AppError(503, 'Shop chưa cấu hình tài khoản nhận chuyển khoản QR.');
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
    lines = await enrichLines(chosen);
  } else {
    lines = await resolveGuestItems(body.items);
  }

  const total = lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  let created;
  try {
    created = await orders.createOrder(
      {
        userId: userId || null,
        fullName,
        phone,
        address,
        note: note || null,
        paymentMethod,
        status: 'pending',
        total,
        cartItemIds,
      },
      lines,
    );
  } catch (error) {
    if (error.status === 400) {
      throw new AppError(400, error.message);
    }
    throw error;
  }

  if (userId) {
    await users.updatePhone(userId, phone);
  }

  const transferCode = `NT${created.id}`;
  const payment = getPaymentInfo();
  const qrImageUrl =
    paymentMethod === 'QR'
      ? buildVietQrUrl({ amount: total, addInfo: transferCode })
      : null;

  return {
    order: {
      ...created,
      fullName,
      phone,
      address,
      note: note || null,
      paymentMethod,
      transferCode: paymentMethod === 'QR' ? transferCode : null,
      qrImageUrl,
      payment: paymentMethod === 'QR' ? { ...payment, qrImageUrl } : null,
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

const CUSTOMER_CANCELABLE = new Set(['awaiting_payment', 'pending']);

export async function listMyOrders(userId) {
  if (!userId) {
    throw new AppError(401, 'Bạn cần đăng nhập.');
  }
  const rows = await orders.listByUser(userId);
  return { orders: rows };
}

export async function cancelMyOrder(userId, id) {
  if (!userId) {
    throw new AppError(401, 'Bạn cần đăng nhập.');
  }
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    throw new AppError(400, 'Mã đơn không hợp lệ.');
  }
  const order = await orders.findById(orderId);
  if (!order || order.userId !== userId) {
    throw new AppError(404, 'Không thấy đơn này.');
  }
  if (order.status === 'cancelled') {
    return { order: { ...order, status: 'cancelled' } };
  }
  if (!CUSTOMER_CANCELABLE.has(order.status)) {
    throw new AppError(400, 'Shop đã xác nhận đơn, bạn không hủy được nữa.');
  }
  await orders.updateStatus(orderId, 'cancelled');
  const updated = await orders.findById(orderId);
  return { order: updated };
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
  if (order.paymentMethod === 'QR') {
    const transferCode = `NT${order.id}`;
    const payment = getPaymentInfo();
    const qrImageUrl = buildVietQrUrl({ amount: order.total, addInfo: transferCode });
    return {
      order: {
        ...order,
        transferCode,
        qrImageUrl,
        payment: payment.enabled ? { ...payment, qrImageUrl } : null,
      },
    };
  }
  return { order };
}
