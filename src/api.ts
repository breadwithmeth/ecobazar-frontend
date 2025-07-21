// Обновить цену товара (только ADMIN)
export async function apiUpdateProductPrice(token: string, productId: number, price: number) {
  const resp = await fetch(`${API_URL}/products/${productId}/price`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ price }),
  });
  if (!resp.ok) throw new Error('Ошибка обновления цены');
  return resp.json();
}
// Обновить профиль пользователя (имя, телефон)
export async function apiUpdateUser(token: string, data: { name: string; phone_number: string }) {
  const r = await fetch(`${API_URL}/user/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Ошибка обновления профиля');
  return r.json();
}
// Обновить статус заказа (только ADMIN)
export async function apiUpdateOrderStatus(token: string, orderId: number, status: string) {
  const resp = await fetch(`http://localhost:4000/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!resp.ok) throw new Error('Ошибка обновления статуса заказа');
  return resp.json();
}
// Получить все заказы (только ADMIN)
export async function apiGetAllOrders(token: string) {
  const resp = await fetch('http://localhost:4000/api/orders/all', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) throw new Error('Ошибка загрузки заказов');
  return resp.json();
}
// Добавить товар (только ADMIN)
export async function apiAddProduct(token: string, prod: { name: string; price: number; image?: string; storeId: number; categoryId?: number }) {
  const resp = await fetch('http://localhost:4000/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prod),
  });
  if (!resp.ok) throw new Error('Ошибка добавления товара');
  return resp.json();
}
export async function apiGetStores(token: string) {
  const r = await fetch(`${API_URL}/stores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Ошибка загрузки магазинов');
  return r.json();
}
const API_URL = 'http://localhost:4000/api';

export async function apiGetCategories(token: string) {
  const r = await fetch(`${API_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Ошибка загрузки категорий');
  return r.json();
}

export async function apiGetProducts(token: string) {
  const r = await fetch(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Ошибка загрузки товаров');
  return r.json();
}

export async function apiGetUser(token: string) {
  const r = await fetch(`${API_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Ошибка загрузки профиля');
  return r.json();
}

export async function apiGetAddresses(token: string) {
  const r = await fetch(`${API_URL}/user/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Ошибка загрузки адресов');
  return r.json();
}

export async function apiAddAddress(token: string, address: string) {
  const r = await fetch(`${API_URL}/user/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ address }),
  });
  if (!r.ok) throw new Error('Ошибка добавления адреса');
  return r.json();
}

export async function apiAuth(telegram_user_id: string) {
  const r = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_user_id }),
  });
  if (!r.ok) throw new Error('Ошибка авторизации');
  return r.json();
}

export async function apiCreateOrder(token: string, data: { items: { productId: number, quantity: number }[], address: string, comment?: string }) {
  const r = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Ошибка оформления заказа');
  return r.json();
}
