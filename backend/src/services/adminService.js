import bcrypt from 'bcryptjs';
import { AppError } from '../utils/errors.js';
import * as catalog from '../repositories/catalogRepository.js';
import * as admin from '../repositories/adminRepository.js';
import * as orders from '../repositories/orderRepository.js';
import * as users from '../repositories/userRepository.js';

const ORDER_STATUSES = new Set([
  'awaiting_payment',
  'pending',
  'confirmed',
  'shipping',
  'done',
  'cancelled',
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(0|\+84)[0-9]{8,10}$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function productToInput(product, overrides = {}) {
  return {
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    costPrice: product.costPrice || 0,
    importQty: product.importQty || 0,
    imageUrl: product.imageUrl,
    colorName: product.colorName,
    colorHex: product.colorHex || '#cccccc',
    colorOptions: product.colors || null,
    sizes: Array.isArray(product.sizes) ? product.sizes.join(',') : String(product.sizes || 'S,M,L,XL'),
    material: product.material || 'Cotton',
    isFeatured: Boolean(product.isFeatured),
    ...overrides,
  };
}

function parseProductBody(body, { existing } = {}) {
  const name = text(body.name);
  const description = text(body.description);
  const imageUrl = text(body.imageUrl) || '/images/ao-thun.jpg';
  const colorName = text(body.colorName) || 'Đa màu';
  let colorHex = text(body.colorHex) || '#cccccc';
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) colorHex = '#cccccc';
  const sizes = text(body.sizes) || 'S,M,L,XL';
  const material = text(body.material) || 'Cotton';
  const slug = text(body.slug);
  const categoryId = Number(body.categoryId);
  const price = Number(body.price);
  const originalPrice = body.originalPrice === '' || body.originalPrice == null
    ? null
    : Number(body.originalPrice);
  const costPrice = body.costPrice === '' || body.costPrice == null
    ? (existing ? existing.costPrice : Math.round(price * 0.65))
    : Number(body.costPrice);
  const importQty = body.importQty === '' || body.importQty == null
    ? (existing ? existing.importQty : 40)
    : Number(body.importQty);
  const isFeatured = Boolean(body.isFeatured);

  if (name.length < 2 || name.length > 160) {
    throw new AppError(400, 'Tên sản phẩm cần từ 2 đến 160 ký tự.');
  }
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw new AppError(400, 'Chọn danh mục hợp lệ.');
  }
  if (!Number.isInteger(price) || price < 1000) {
    throw new AppError(400, 'Giá bán chưa hợp lệ.');
  }
  if (!Number.isInteger(costPrice) || costPrice < 0) {
    throw new AppError(400, 'Giá vốn chưa hợp lệ.');
  }
  if (costPrice > price) {
    throw new AppError(400, 'Giá vốn không được lớn hơn giá bán.');
  }
  if (originalPrice != null && (!Number.isInteger(originalPrice) || originalPrice <= price)) {
    throw new AppError(400, 'Giá gốc phải lớn hơn giá bán.');
  }
  if (!Number.isInteger(importQty) || importQty < 0) {
    throw new AppError(400, 'Số lượng nhập chưa hợp lệ.');
  }
  if (description.length > 800) {
    throw new AppError(400, 'Mô tả tối đa 800 ký tự.');
  }

  let colorOptions = null;
  if (Array.isArray(body.colors) && body.colors.length) {
    colorOptions = body.colors
      .map((item) => ({
        name: text(item.name),
        hex: text(item.hex) || '#cccccc',
        imageUrl: text(item.imageUrl) || imageUrl,
      }))
      .filter((item) => item.name);
  }

  return {
    categoryId,
    name,
    slug: slug || undefined,
    description: description || name,
    price,
    originalPrice,
    costPrice,
    importQty,
    imageUrl,
    colorName,
    colorHex,
    colorOptions,
    sizes,
    material,
    isFeatured,
  };
}

function assertEmail(email) {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Email chưa đúng định dạng.');
  }
}

function assertPhone(phone) {
  if (!PHONE_PATTERN.test(phone)) {
    throw new AppError(400, 'Số điện thoại chưa đúng.');
  }
}

function assertPassword(password, { required = true } = {}) {
  if (!password) {
    if (required) throw new AppError(400, 'Bạn nhập mật khẩu giúp.');
    return;
  }
  if (password.length < 6) throw new AppError(400, 'Mật khẩu cần ít nhất 6 ký tự.');
  if (password.length > 72) throw new AppError(400, 'Mật khẩu tối đa 72 ký tự.');
}

export async function dashboard() {
  return admin.getStats();
}

export async function listProducts(category, search) {
  return catalog.listProducts(category || '', search || '');
}

export async function listCategories() {
  return catalog.listCategories();
}

export async function getProduct(id) {
  const product = await catalog.findProductById(Number(id));
  if (!product) throw new AppError(404, 'Không thấy sản phẩm.');
  return product;
}

export async function createProduct(body) {
  const input = parseProductBody(body || {});
  try {
    return await admin.createProduct(input);
  } catch (error) {
    if (String(error.message || '').includes('UQ_Products_Slug')) {
      throw new AppError(409, 'Slug sản phẩm đã tồn tại.');
    }
    throw error;
  }
}

export async function updateProduct(id, body) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new AppError(400, 'Mã sản phẩm không hợp lệ.');
  }
  const existing = await catalog.findProductById(productId);
  if (!existing) throw new AppError(404, 'Không thấy sản phẩm.');
  const input = parseProductBody(body || {}, { existing });
  const soldQty = await admin.getSoldQty(productId);
  if (input.importQty < soldQty) {
    throw new AppError(
      400,
      `Số lượng nhập phải ≥ số đã bán (${soldQty}). Tồn kho = nhập − đã bán.`,
    );
  }
  try {
    const updated = await admin.updateProduct(productId, input);
    if (!updated) throw new AppError(404, 'Không thấy sản phẩm.');
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (String(error.message || '').includes('UQ_Products_Slug')) {
      throw new AppError(409, 'Slug sản phẩm đã tồn tại.');
    }
    throw error;
  }
}

export async function updateInventory(id, body) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new AppError(400, 'Mã sản phẩm không hợp lệ.');
  }
  const existing = await catalog.findProductById(productId);
  if (!existing) throw new AppError(404, 'Không thấy sản phẩm.');

  const costPrice = Number(body?.costPrice);
  const importQty = Number(body?.importQty);
  if (!Number.isInteger(costPrice) || costPrice < 0) {
    throw new AppError(400, 'Giá vốn chưa hợp lệ.');
  }
  if (costPrice > existing.price) {
    throw new AppError(400, 'Giá vốn không được lớn hơn giá bán.');
  }
  if (!Number.isInteger(importQty) || importQty < 0) {
    throw new AppError(400, 'Số lượng nhập chưa hợp lệ.');
  }
  const soldQty = await admin.getSoldQty(productId);
  if (importQty < soldQty) {
    throw new AppError(
      400,
      `Số lượng nhập phải ≥ số đã bán (${soldQty}). Tồn kho = nhập − đã bán.`,
    );
  }

  const updated = await admin.updateProduct(
    productId,
    productToInput(existing, { costPrice, importQty }),
  );
  if (!updated) throw new AppError(404, 'Không thấy sản phẩm.');
  return updated;
}

export async function removeProduct(id) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new AppError(400, 'Mã sản phẩm không hợp lệ.');
  }
  const ok = await admin.deleteProduct(productId);
  if (!ok) throw new AppError(404, 'Không thấy sản phẩm.');
  return { ok: true };
}

export async function listOrders() {
  return admin.listOrders();
}

export async function getOrder(id) {
  const order = await orders.findById(Number(id));
  if (!order) throw new AppError(404, 'Không thấy đơn hàng.');
  return order;
}

export async function updateOrderStatus(id, body) {
  const orderId = Number(id);
  const status = text(body?.status).toLowerCase();
  if (!ORDER_STATUSES.has(status)) {
    throw new AppError(400, 'Trạng thái đơn không hợp lệ.');
  }
  const current = await admin.getOrderStatus(orderId);
  if (!current) throw new AppError(404, 'Không thấy đơn hàng.');

  // Tồn kho = nhập − đã bán (đơn hủy không tính đã bán), không trừ/cộng tay.
  const updated = await admin.updateOrderStatus(orderId, status);
  if (!updated) throw new AppError(404, 'Không thấy đơn hàng.');
  return updated;
}

export async function listCustomers() {
  return admin.listCustomers();
}

export async function getCustomer(id) {
  const customer = await admin.findCustomerById(Number(id));
  if (!customer) throw new AppError(404, 'Không thấy khách hàng.');
  return customer;
}

export async function createCustomer(body) {
  const fullName = text(body?.fullName).replace(/\s+/g, ' ');
  const email = text(body?.email).toLowerCase();
  const phone = text(body?.phone).replace(/\s+/g, '');
  const password = typeof body?.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 80) {
    throw new AppError(400, 'Tên cần từ 2 đến 80 ký tự.');
  }
  assertEmail(email);
  assertPhone(phone);
  assertPassword(password, { required: true });

  const existing = await users.findByEmail(email);
  if (existing) throw new AppError(409, 'Email này đã có tài khoản.');

  const passwordHash = await bcrypt.hash(password, 10);
  return admin.createCustomer({ fullName, email, phone, passwordHash });
}

export async function updateCustomer(id, body) {
  const customerId = Number(id);
  if (!Number.isInteger(customerId) || customerId < 1) {
    throw new AppError(400, 'Mã khách không hợp lệ.');
  }
  const fullName = text(body?.fullName).replace(/\s+/g, ' ');
  const email = text(body?.email).toLowerCase();
  const phone = text(body?.phone).replace(/\s+/g, '');
  const password = typeof body?.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 80) {
    throw new AppError(400, 'Tên cần từ 2 đến 80 ký tự.');
  }
  assertEmail(email);
  assertPhone(phone);
  assertPassword(password, { required: false });

  const existing = await users.findByEmail(email);
  if (existing && existing.id !== customerId) {
    throw new AppError(409, 'Email này đã có tài khoản.');
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const updated = await admin.updateCustomer(customerId, {
    fullName,
    email,
    phone,
    passwordHash,
  });
  if (!updated) throw new AppError(404, 'Không thấy khách hàng.');
  return updated;
}

export async function removeCustomer(id) {
  const customerId = Number(id);
  if (!Number.isInteger(customerId) || customerId < 1) {
    throw new AppError(400, 'Mã khách không hợp lệ.');
  }
  const ok = await admin.deleteCustomer(customerId);
  if (!ok) throw new AppError(404, 'Không thấy khách hàng.');
  return { ok: true };
}
