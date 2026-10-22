const TOKEN_KEY = 'nt_token';

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
    response = await fetch(path, {
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

export function forgotPassword(email) {
  return request('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(body) {
  return request('/api/auth/reset-password', { method: 'POST', body });
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

export function getOrder(id) {
  return request(`/api/orders/${encodeURIComponent(id)}`);
}
