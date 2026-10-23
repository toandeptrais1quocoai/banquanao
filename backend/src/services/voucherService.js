import { AppError } from '../utils/errors.js';
import * as vouchers from '../repositories/voucherRepository.js';
import * as orders from '../repositories/orderRepository.js';
import * as shopSettings from '../repositories/shopSettingsRepository.js';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCode(code) {
  return text(code).toUpperCase().replace(/\s+/g, '');
}

function parseVoucherBody(body, { partial = false } = {}) {
  const code = normalizeCode(body?.code);
  const type = text(body?.type).toLowerCase();
  const value = Number(body?.value);
  const minOrderTotal = Number(body?.minOrderTotal ?? 0);
  const maxDiscount =
    body?.maxDiscount === '' || body?.maxDiscount == null ? null : Number(body.maxDiscount);
  const maxUses = body?.maxUses === '' || body?.maxUses == null ? null : Number(body.maxUses);
  const active = body?.active === undefined ? true : Boolean(body.active);
  const note = text(body?.note).slice(0, 200);

  if (!partial || body?.code !== undefined) {
    if (!code || code.length < 3 || code.length > 40) {
      throw new AppError(400, 'Mã voucher cần 3–40 ký tự.');
    }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      throw new AppError(400, 'Mã chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.');
    }
  }
  if (!partial || body?.type !== undefined) {
    if (type !== 'percent' && type !== 'fixed') {
      throw new AppError(400, 'Loại voucher: percent hoặc fixed.');
    }
  }
  if (!partial || body?.value !== undefined) {
    if (!Number.isInteger(value) || value < 1) {
      throw new AppError(400, 'Giá trị voucher không hợp lệ.');
    }
    if (type === 'percent' && value > 100) {
      throw new AppError(400, 'Phần trăm tối đa 100.');
    }
  }
  if (!Number.isInteger(minOrderTotal) || minOrderTotal < 0) {
    throw new AppError(400, 'Đơn tối thiểu không hợp lệ.');
  }
  if (maxDiscount != null && (!Number.isInteger(maxDiscount) || maxDiscount < 1)) {
    throw new AppError(400, 'Giảm tối đa không hợp lệ.');
  }
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    throw new AppError(400, 'Số lần dùng tối đa không hợp lệ.');
  }

  return {
    code,
    type,
    value,
    minOrderTotal,
    maxDiscount,
    maxUses,
    active,
    note: note || null,
  };
}

function assertUsable(voucher, subtotal) {
  if (!voucher || !voucher.active) {
    throw new AppError(400, 'Mã voucher không còn hiệu lực.');
  }
  if (voucher.maxUses != null && voucher.usedCount >= voucher.maxUses) {
    throw new AppError(400, 'Mã voucher đã hết lượt sử dụng.');
  }
  if (subtotal < (voucher.minOrderTotal || 0)) {
    throw new AppError(
      400,
      `Đơn tối thiểu ${Number(voucher.minOrderTotal).toLocaleString('vi-VN')}đ mới dùng mã này.`,
    );
  }
  const discount = vouchers.calcDiscount(subtotal, voucher);
  if (discount < 1) {
    throw new AppError(400, 'Mã voucher không giảm được trên đơn này.');
  }
  return discount;
}

function orderSubtotal(order) {
  if (order.subtotal != null && Number(order.subtotal) > 0) {
    return Number(order.subtotal);
  }
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }
  return Number(order.total || 0) + Number(order.discountAmount || 0);
}

export async function listVouchers() {
  return vouchers.listVouchers();
}

export async function createVoucher(body) {
  const input = parseVoucherBody(body);
  const existing = await vouchers.findByCode(input.code);
  if (existing) throw new AppError(409, 'Mã voucher này đã tồn tại.');
  return vouchers.createVoucher(input);
}

export async function updateVoucher(id, body) {
  const current = await vouchers.findById(Number(id));
  if (!current) throw new AppError(404, 'Không thấy voucher.');
  const input = parseVoucherBody(
    {
      code: body?.code ?? current.code,
      type: body?.type ?? current.type,
      value: body?.value ?? current.value,
      minOrderTotal: body?.minOrderTotal ?? current.minOrderTotal,
      maxDiscount: body?.maxDiscount !== undefined ? body.maxDiscount : current.maxDiscount,
      maxUses: body?.maxUses !== undefined ? body.maxUses : current.maxUses,
      active: body?.active !== undefined ? body.active : current.active,
      note: body?.note !== undefined ? body.note : current.note,
    },
    { partial: true },
  );
  if (input.code !== current.code) {
    const clash = await vouchers.findByCode(input.code);
    if (clash) throw new AppError(409, 'Mã voucher này đã tồn tại.');
  }
  return vouchers.updateVoucher(current.id, input);
}

export async function removeVoucher(id) {
  const current = await vouchers.findById(Number(id));
  if (!current) throw new AppError(404, 'Không thấy voucher.');
  await vouchers.removeVoucher(current.id);
  return { ok: true };
}

export async function previewVoucher(code, subtotal) {
  const voucher = await vouchers.findByCode(normalizeCode(code));
  if (!voucher) throw new AppError(404, 'Không tìm thấy mã voucher.');
  const amount = Number(subtotal) || 0;
  const discount = assertUsable(voucher, amount);
  return {
    voucher: {
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
    },
    subtotal: amount,
    discountAmount: discount,
    total: amount - discount,
  };
}

async function applyOnOrderRecord(order, voucher) {
  const subtotal = orderSubtotal(order);
  const discount = assertUsable(voucher, subtotal);
  const total = subtotal - discount;
  const updated = await vouchers.applyToOrder(order.id, {
    subtotal,
    discountAmount: discount,
    voucherCode: voucher.code,
    total,
  });
  return updated;
}

export async function applyVoucher({ code, orderId, scope }) {
  const voucher = await vouchers.findByCode(normalizeCode(code));
  if (!voucher) throw new AppError(404, 'Không tìm thấy mã voucher.');

  const target = text(scope).toLowerCase() || (orderId ? 'one' : 'all');

  if (target === 'one' || orderId) {
    const id = Number(orderId);
    if (!Number.isInteger(id) || id < 1) {
      throw new AppError(400, 'Chọn một đơn hàng để áp dụng.');
    }
    const order = await orders.findById(id);
    if (!order) throw new AppError(404, 'Không thấy đơn hàng.');
    if (order.status === 'cancelled') {
      throw new AppError(400, 'Không áp dụng voucher cho đơn đã hủy.');
    }
    if (order.voucherCode) {
      throw new AppError(400, `Đơn #${id} đã có mã ${order.voucherCode}.`);
    }
    if (voucher.maxUses != null && voucher.usedCount >= voucher.maxUses) {
      throw new AppError(400, 'Mã voucher đã hết lượt sử dụng.');
    }
    const applied = await applyOnOrderRecord(order, voucher);
    await vouchers.bumpUsedCount(voucher.id, 1);
    const fresh = await orders.findById(id);
    return { applied: 1, orders: [fresh], result: applied };
  }

  if (target !== 'all') {
    throw new AppError(400, 'Phạm vi áp dụng: one hoặc all.');
  }

  const ids = await vouchers.listEligibleOrderIds();
  if (!ids.length) {
    throw new AppError(400, 'Không còn đơn nào chưa có voucher để áp dụng.');
  }

  let remaining =
    voucher.maxUses == null ? ids.length : Math.max(0, voucher.maxUses - voucher.usedCount);
  if (remaining < 1) {
    throw new AppError(400, 'Mã voucher đã hết lượt sử dụng.');
  }

  const appliedOrders = [];
  for (const id of ids) {
    if (remaining < 1) break;
    const order = await orders.findById(id);
    if (!order || order.voucherCode || order.status === 'cancelled') continue;
    try {
      await applyOnOrderRecord(order, voucher);
      await vouchers.bumpUsedCount(voucher.id, 1);
      voucher.usedCount += 1;
      remaining -= 1;
      appliedOrders.push(await orders.findById(id));
    } catch {
      // bỏ qua đơn không đủ điều kiện minOrder
    }
  }

  if (!appliedOrders.length) {
    throw new AppError(400, 'Không áp dụng được đơn nào (kiểm tra đơn tối thiểu / đã có mã).');
  }

  return { applied: appliedOrders.length, orders: appliedOrders };
}

export async function getStorefrontVoucher() {
  return shopSettings.getStorefrontVoucher();
}

export async function setStorefrontVoucher(body) {
  const active = Boolean(body?.active);
  let code = normalizeCode(body?.code);
  const percent = Number(body?.percent);

  if (active) {
    if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
      throw new AppError(400, 'Phần trăm voucher toàn shop từ 1 đến 99.');
    }
    if (!code) {
      code = `SHOP${percent}`;
    }
    if (code.length < 3 || code.length > 40 || !/^[A-Z0-9_-]+$/.test(code)) {
      throw new AppError(400, 'Mã hiển thị trên web cần 3–40 ký tự (chữ/số).');
    }
  }

  return shopSettings.setStorefrontVoucher({
    active,
    code: active ? code : null,
    percent: active ? percent : null,
  });
}

/** Dùng lúc checkout khách. */
export async function resolveCheckoutVoucher(code, subtotal) {
  if (!code) {
    return { discountAmount: 0, voucherCode: null, voucherId: null };
  }
  const voucher = await vouchers.findByCode(normalizeCode(code));
  if (!voucher) throw new AppError(400, 'Mã voucher không đúng.');
  const discount = assertUsable(voucher, subtotal);
  return {
    discountAmount: discount,
    voucherCode: voucher.code,
    voucherId: voucher.id,
  };
}

export { calcDiscount } from '../repositories/voucherRepository.js';
