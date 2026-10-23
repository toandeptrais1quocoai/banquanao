const TOKEN_KEY = 'nt_token';
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Bạn chạy backend giúp.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra.');
  }
  return data;
}

export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function register(body) {
  return request('/api/auth/register', { method: 'POST', body });
}

export function me() {
  return request('/api/auth/me');
}

export function mailStatus() {
  return request('/api/auth/mail-status');
}

export function forgotPassword(email) {
  return request('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(body) {
  return request('/api/auth/reset-password', { method: 'POST', body });
}

export function changePassword(body) {
  return request('/api/auth/change-password', { method: 'POST', body });
}

export function categories() {
  return request('/api/categories');
}

export function products(category, search) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('q', search);
  const query = params.toString();
  return request(`/api/products${query ? `?${query}` : ''}`);
}

export function product(slug) {
  return request(`/api/products/${encodeURIComponent(slug)}`);
}

export function getCart() {
  return request('/api/cart');
}

export function addCartItem(body) {
  return request('/api/cart/items', { method: 'POST', body });
}

export function updateCartItem(id, quantity) {
  return request(`/api/cart/items/${id}`, { method: 'PATCH', body: { quantity } });
}

export function removeCartItem(id) {
  return request(`/api/cart/items/${id}`, { method: 'DELETE' });
}

export function clearCart() {
  return request('/api/cart', { method: 'DELETE' });
}

export function mergeCart(items) {
  return request('/api/cart/merge', { method: 'POST', body: { items } });
}

export function hydrateCart(items) {
  return request('/api/cart/hydrate', { method: 'POST', body: { items } });
}

export function checkout(body) {
  return request('/api/orders', { method: 'POST', body });
}

export function previewVoucher(code, subtotal) {
  return request('/api/orders/preview-voucher', {
    method: 'POST',
    body: { code, subtotal },
  });
}

export function myOrders() {
  return request('/api/orders');
}

export function getOrder(id) {
  return request(`/api/orders/${encodeURIComponent(id)}`);
}

export function cancelOrder(id) {
  return request(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
}

export function chat(message, history = []) {
  return request('/api/chat', { method: 'POST', body: { message, history } });
}

export function getPayment(amount, addInfo) {
  const params = new URLSearchParams();
  if (amount != null) params.set('amount', String(amount));
  if (addInfo) params.set('addInfo', addInfo);
  const query = params.toString();
  return request(`/api/payment${query ? `?${query}` : ''}`);
}

export function adminStats() {
  return request('/api/admin/stats');
}

export function adminCategories() {
  return request('/api/admin/categories');
}

export function adminProducts(category, search) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('q', search);
  const query = params.toString();
  return request(`/api/admin/products${query ? `?${query}` : ''}`);
}

export function adminProduct(id) {
  return request(`/api/admin/products/${encodeURIComponent(id)}`);
}

export function adminCreateProduct(body) {
  return request('/api/admin/products', { method: 'POST', body });
}

export function adminUpdateProduct(id, body) {
  return request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function adminUpdateInventory(id, body) {
  return request(`/api/admin/products/${encodeURIComponent(id)}/inventory`, {
    method: 'PATCH',
    body,
  });
}

export function adminDeleteProduct(id) {
  return request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function adminOrders() {
  return request('/api/admin/orders');
}

export function adminOrder(id) {
  return request(`/api/admin/orders/${encodeURIComponent(id)}`);
}

export function adminUpdateOrderStatus(id, status) {
  return request(`/api/admin/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function adminCustomers() {
  return request('/api/admin/customers');
}

export function adminCustomer(id) {
  return request(`/api/admin/customers/${encodeURIComponent(id)}`);
}

export function adminCreateCustomer(body) {
  return request('/api/admin/customers', { method: 'POST', body });
}

export function adminUpdateCustomer(id, body) {
  return request(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function adminDeleteCustomer(id) {
  return request(`/api/admin/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function adminVouchers() {
  return request('/api/admin/vouchers');
}

export function adminCreateVoucher(body) {
  return request('/api/admin/vouchers', { method: 'POST', body });
}

export function adminUpdateVoucher(id, body) {
  return request(`/api/admin/vouchers/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function adminDeleteVoucher(id) {
  return request(`/api/admin/vouchers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function adminApplyVoucher(body) {
  return request('/api/admin/vouchers/apply', { method: 'POST', body });
}

export function adminGetStorefrontVoucher() {
  return request('/api/admin/storefront-voucher');
}

export function adminSetStorefrontVoucher(body) {
  return request('/api/admin/storefront-voucher', { method: 'PUT', body });
}

export function storefrontVoucher() {
  return request('/api/storefront-voucher');
}
