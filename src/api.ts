const API_URL = process.env.REACT_APP_API_URL;

// Типы для API v2.0
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  timestamp: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Обработчик ошибок API v2.0
async function handleApiResponse<T>(response: Response): Promise<T> {
  console.log('handleApiResponse called with status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response text:', errorText);
    try {
      const errorData: ApiError = JSON.parse(errorText);
      console.log('Parsed error data:', errorData);
      throw new Error(errorData.error.message || 'Ошибка API');
    } catch (parseError) {
      console.log('Failed to parse error JSON:', parseError);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }
  
  const responseText = await response.text();
  console.log('Success response text:', responseText);
  
  try {
    const responseData: ApiResponse<T> = JSON.parse(responseText);
    console.log('Parsed response data:', responseData);
    return responseData.data;
  } catch (parseError) {
    console.log('Failed to parse success JSON:', parseError);
    // Возможно, ответ приходит напрямую без wrapper
    try {
      const directData = JSON.parse(responseText);
      console.log('Direct data:', directData);
      return directData;
    } catch (directParseError) {
      console.log('Failed to parse direct JSON:', directParseError);
      throw new Error('Ошибка парсинга ответа API');
    }
  }
}

// Обновить продукт (только ADMIN)
export async function apiUpdateProduct(
  token: string, 
  productId: number, 
  data: { 
    name?: string; 
    price?: number; 
    image?: string; 
    description?: string;
    storeId?: number;
    categoryId?: number;
    unit?: string; // добавлено ранее
    isVisible?: boolean; // добавлено
  }
) {
  const resp = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleApiResponse(resp);
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
  return handleApiResponse(r);
}

// Обновить статус заказа (только ADMIN)
export async function apiUpdateOrderStatus(token: string, orderId: number, status: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED') {
  const resp = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return handleApiResponse(resp);
}

// Получить все заказы (только ADMIN)
// Получить все заказы (для админа)
export async function apiGetAllOrders(token: string, page = 1, limit = 50) {
  const resp = await fetch(`${API_URL}/orders/admin/all?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleApiResponse<{ orders: any[]; pagination: Pagination }>(resp);
}

// Получить заказы текущего пользователя
export async function apiGetMyOrders(
  token: string,
  page = 1,
  limit = 10,
  status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (status) params.append('status', status);

  const resp = await fetch(`${API_URL}/orders?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleApiResponse<{ orders: any[]; pagination: Pagination }>(resp);
}

// Получить заказы пользователя
export async function apiGetUserOrders(
  token: string,
  page = 1,
  limit = 20,
  filters?: {
    status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
  }
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_URL}/orders/my?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse<{ orders: any[]; pagination: Pagination }>(response);
}
// Добавить товар (только ADMIN)
export async function apiAddProduct(token: string, prod: { name: string; price: number; image?: string; storeId: number; categoryId?: number; description?: string }) {
  const resp = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prod),
  });
  return handleApiResponse(resp);
}

export async function apiGetStores(token: string, page = 1, limit = 50, search?: string) {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const url = `${API_URL}/stores?page=${page}&limit=${limit}${searchParam}`;
  
  console.log('🔍 Fetching stores from:', url);
  console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('📡 Stores API response status:', r.status, r.statusText);
    console.log('📡 Response headers:', Object.fromEntries(r.headers.entries()));
    
    if (!r.ok) {
      console.error('❌ Stores API error response:', r.status, r.statusText);
      const errorText = await r.text();
      console.error('❌ Error details:', errorText);
      throw new Error(`Stores API error: ${r.status} ${r.statusText}`);
    }
    
    const responseData = await r.json();
    console.log('📦 Raw stores response:', responseData);
    
    // Новый формат API: { success: true, data: [...], meta: {...} }
    if (responseData && responseData.success && responseData.data) {
      console.log('✅ New API format - stores data:', responseData.data);
      console.log('✅ Meta data:', responseData.meta);
      return {
        success: true,
        data: responseData.data,
        meta: responseData.meta
      };
    }
    
    // API возвращает массив магазинов напрямую (старый формат)
    if (Array.isArray(responseData)) {
      console.log('✅ Direct array format - stores data:', responseData);
      return { 
        success: true,
        data: responseData, 
        meta: { total: responseData.length, page, limit, totalPages: 1, hasNext: false, hasPrev: false } 
      };
    }
    
    // Если это объект с data (промежуточный формат)
    if (responseData && responseData.data) {
      console.log('✅ Object with data format - stores data:', responseData.data);
      return responseData;
    }
    
    console.error('❌ Unexpected response format:', responseData);
    throw new Error('Unexpected response format from stores API');
  } catch (error) {
    console.error('❌ Exception in apiGetStores:', error);
    throw error;
  }
}

export async function apiUpdateStore(token: string, storeId: number, storeData: {
  name?: string;
  address?: string;
  ownerId?: number;
}) {
  console.log('🔄 Updating store:', storeId, 'with data:', storeData);
  
  try {
    const response = await fetch(`${API_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(storeData),
    });

    console.log('📡 Update store API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update store error:', errorText);
      throw new Error(`Ошибка обновления магазина: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Store updated successfully:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('❌ Exception in apiUpdateStore:', error);
    throw error;
  }
}

export async function apiGetCategories(token: string) {
  console.log('apiGetCategories called');
  try {
    // Сначала пытаемся получить категории из отдельного эндпоинта
    const r = await fetch(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (r.ok) {
      const data = await r.json();
      console.log('Categories from /categories endpoint:', data);
      // Если есть отдельный эндпоинт, возвращаем данные
      return data.data || data;
    }
  } catch (error) {
    console.log('Отдельный эндпоинт категорий недоступен, извлекаем из продуктов');
  }

  // Если отдельного эндпоинта нет, извлекаем категории из продуктов
  console.log('Fetching categories from products...');
  const productsResponse = await fetch(`${API_URL}/products?limit=1000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!productsResponse.ok) {
    throw new Error('Ошибка загрузки продуктов для извлечения категорий');
  }
  
  const productsData = await productsResponse.json();
  console.log('Products data for categories:', productsData);
  const products = productsData.data?.products || [];
  console.log('Products array:', products);
  
  // Извлекаем уникальные категории
  const categoriesMap = new Map();
  products.forEach((product: any) => {
    if (product.category) {
      categoriesMap.set(product.category.id, {
        id: product.category.id,
        name: product.category.name
      });
    }
  });
  
  const uniqueCategories = Array.from(categoriesMap.values());
  console.log('Extracted unique categories:', uniqueCategories);
  return uniqueCategories;
}

export async function apiGetProducts(token?: string, page = 1, limit = 50, filters?: {
  search?: string;
  categoryId?: number;
  storeId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.storeId) params.append('storeId', filters.storeId.toString());
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const headers: any = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const r = await fetch(`${API_URL}/products/all?${params.toString()}`, {
    headers,
  });
  
  const response = await handleApiResponse<any>(r);
  
  // Для совместимости возвращаем структуру с пагинацией
  if (response && response.data && Array.isArray(response.data.products)) {
    return {
      products: response.data.products,
      pagination: {
        total: response.data.total || response.data.products.length,
        page: 1,
        limit: response.data.products.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    };
  }
  
  // Обратная совместимость со старой структурой
  if (response && Array.isArray(response.data)) {
    return {
      products: response.data,
      pagination: {
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    };
  }
  
  return response;
}

export async function apiGetProduct(id: number, token?: string) {
  const headers: any = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const r = await fetch(`${API_URL}/products/${id}`, {
    headers,
  });
  return handleApiResponse<{
    id: number;
    name: string;
    price: number;
    image: string;
    description?: string;
    store: {
      id: number;
      name: string;
      location: string;
      description?: string;
    };
    category: {
      id: number;
      name: string;
    };
    stock: {
      quantity: number;
    };
    createdAt: string;
    updatedAt: string;
  }>(r);
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

export async function apiAuth(userId: string) {
  console.log('apiAuth called with userId:', userId);
  const url = `${API_URL}/auth`;
  console.log('Auth URL:', url);
  
  const body = JSON.stringify({ telegram_user_id: userId });
  console.log('Auth body:', body);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body,
  });
  
  console.log('Auth response status:', response.status);
  const result = await handleApiResponse<{ token: string; user: any }>(response);
  console.log('Auth result:', result);
  return result;
}

export async function apiCreateOrder(
  token: string,
  data: {
    items: Array<{ productId: number; quantity: number }>;
    address: string;
    comment?: string;
  }
) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Создать пользователя (ADMIN)
export async function apiCreateUser(
  token: string,
  userData: {
    telegramUserId: string;
    name: string;
    role: 'CUSTOMER' | 'ADMIN' | 'COURIER' | 'SELLER';
  }
) {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  return handleApiResponse(response);
}

// ================================
// НОВЫЕ АДМИНИСТРАТИВНЫЕ API v2.0
// ================================

// Создать продукт (ADMIN)
export async function apiCreateProduct(
  token: string,
  productData: {
    name: string;
    price: number;
    storeId: number;
    categoryId?: number;
    image?: string;
    description?: string;
    unit?: string; // добавлено ранее
    isVisible?: boolean; // добавлено (опционально)
  }
) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  return handleApiResponse(response);
}

// Удалить продукт (ADMIN)
export async function apiDeleteProduct(token: string, productId: number) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

// Получить все заказы администратором
export async function apiGetAdminOrders(
  token: string,
  params?: {
    page?: number;
    limit?: number;
    status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  console.log('apiGetAdminOrders called with token:', token ? 'present' : 'missing');
  console.log('API_URL:', API_URL);
  
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.userId) searchParams.append('userId', params.userId.toString());
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const url = `${API_URL}/orders/admin/all?${searchParams}`;
  console.log('Making request to:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  
  const result = await handleApiResponse<{ orders: any[]; pagination: any }>(response);
  console.log('handleApiResponse result:', result);
  
  // Если API возвращает данные в новом формате (data: [...]), преобразуем к старому формату
  if (Array.isArray(result)) {
    console.log('Converting array result to {orders: [...]} format');
    return { orders: result, pagination: {} };
  }
  
  return result;
}

// Обновить статус заказа (ADMIN)
export async function apiUpdateOrderStatusAdmin(
  token: string,
  orderId: number,
  status: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'
) {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return handleApiResponse(response);
}

// Создать категорию (ADMIN)
export async function apiCreateCategory(token: string, name: string) {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return handleApiResponse(response);
}

export async function apiUpdateCategory(token: string, id: number, name: string) {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return handleApiResponse(response);
}

export async function apiDeleteCategory(token: string, id: number) {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleApiResponse(response);
}

// Управление складом (ADMIN)
export async function apiUpdateStock(
  token: string,
  productId: number,
  data: {
    quantity: number;
    type: 'INCOME' | 'OUTCOME' | 'CORRECTION';
    comment?: string;
  }
) {
  const response = await fetch(`${API_URL}/stock/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

export async function apiGetStockHistory(
  token: string,
  productId?: number,
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(productId && { productId: productId.toString() })
  });
  
  const response = await fetch(`${API_URL}/stock/history?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleApiResponse(response);
}

export async function apiGetProductStock(token: string, productId: number) {
  const response = await fetch(`${API_URL}/stock/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleApiResponse(response);
}

// Получить список курьеров (ADMIN)
export async function apiGetCouriers(
  token: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`${API_URL}/courier/list?${searchParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse<{ couriers: any[]; pagination: any }>(response);
}

// Получить статистику курьера (ADMIN)
export async function apiGetCourierStats(token: string, courierId: number) {
  const response = await fetch(`${API_URL}/courier/${courierId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

// Получить отчет по продажам (ADMIN)
export async function apiGetSalesReport(
  token: string,
  params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    dateFrom?: string;
    dateTo?: string;
    storeId?: number;
    categoryId?: number;
  }
) {
  const searchParams = new URLSearchParams();
  if (params?.period) searchParams.append('period', params.period);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.storeId) searchParams.append('storeId', params.storeId.toString());
  if (params?.categoryId) searchParams.append('categoryId', params.categoryId.toString());

  const response = await fetch(`${API_URL}/admin/reports/sales?${searchParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

// Получить отчет по заказам (ADMIN) с фильтрами и агрегациями
export async function apiGetAdminOrderReport(
  token: string,
  params?: {
    from?: string; // ISO datetime
    to?: string; // ISO datetime
    storeId?: number;
    courierId?: number;
    status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    deliveryType?: 'ASAP' | 'SCHEDULED';
    groupBy?: 'day' | 'month';
  }
) {
  const sp = new URLSearchParams();
  if (params?.from) sp.append('from', params.from);
  if (params?.to) sp.append('to', params.to);
  if (params?.storeId) sp.append('storeId', String(params.storeId));
  if (params?.courierId) sp.append('courierId', String(params.courierId));
  if (params?.status) sp.append('status', params.status);
  if (params?.deliveryType) sp.append('deliveryType', params.deliveryType);
  if (params?.groupBy) sp.append('groupBy', params.groupBy);

  const url = `${API_URL}/orders/admin/report${sp.toString() ? `?${sp.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

// Изменить роль пользователя (ADMIN)
export async function apiChangeUserRole(
  token: string,
  userId: number,
  role: 'CUSTOMER' | 'COURIER' | 'ADMIN' | 'SELLER'
) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  return handleApiResponse(response);
}

// Назначить курьера на заказ (ADMIN)
export async function apiAssignCourier(
  token: string,
  courierId: number,
  orderId: number
) {
  console.log('apiAssignCourier called:', { courierId, orderId });
  
  const response = await fetch(`${API_URL}/courier/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courierId, orderId }),
  });
  console.log('Assign courier response status:', response.status);
  return handleApiResponse(response);
}

// Получить список курьеров для назначения (ADMIN)
export async function apiGetCouriersList(
  token: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  console.log('🚚 apiGetCouriersList called with:', { token: token ? 'present' : 'missing', params });
  
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const url = `${API_URL}/courier/list?${searchParams}`;
  console.log('🚚 Making request to:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('🚚 Get couriers list response status:', response.status);
  console.log('🚚 Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('🚚 Error response text:', errorText);
    throw new Error(`Couriers API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await handleApiResponse<any>(response);
  console.log('🚚 Couriers list result:', result);
  console.log('🚚 Result type:', typeof result);
  console.log('🚚 Result keys:', result ? Object.keys(result) : 'null');
  
  // Проверяем разные возможные форматы ответа API
  if (result && result.couriers) {
    console.log('🚚 Found couriers in result.couriers:', result.couriers.length);
    return { couriers: result.couriers, pagination: result.pagination || {} };
  } else if (Array.isArray(result)) {
    console.log('🚚 Result is array, converting to {couriers: [...]} format');
    return { couriers: result, pagination: {} };
  } else if (result && result.data) {
    console.log('🚚 Found data in result.data:', result.data);
    if (result.data.couriers) {
      return { couriers: result.data.couriers, pagination: result.data.pagination || {} };
    } else if (Array.isArray(result.data)) {
      return { couriers: result.data, pagination: {} };
    }
  }
  
  console.warn('🚚 Unexpected couriers API response format:', result);
  return { couriers: [], pagination: {} };
}

// Получить список всех пользователей (ADMIN)
export async function apiGetAllUsers(token: string, params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.role) searchParams.append('role', params.role);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const url = `${API_URL}/user/admin/all${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  console.log('Getting all users from:', url);
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Get all users response status:', response.status);
  return handleApiResponse(response);
}

// Получить статистику безопасности (ADMIN)
export async function apiGetSecurityStats(token: string) {
  const response = await fetch(`${API_URL}/security-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

// ================================
// КУРЬЕРСКИЕ API
// ================================

// Получить заказы курьера
export async function apiGetCourierOrders(
  token: string,
  page = 1,
  limit = 10,
  status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (status) params.append('status', status);

  const response = await fetch(`${API_URL}/courier/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleApiResponse<{ orders: any[]; meta: any }>(response);
}

// Обновить статус заказа курьером
export async function apiUpdateOrderStatusByCourier(
  token: string,
  orderId: number,
  status: 'DELIVERING' | 'DELIVERED' | 'CANCELLED'
) {
  const response = await fetch(`${API_URL}/courier/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return handleApiResponse(response);
}

// Assign store owner API function
export async function apiAssignStoreOwner(
  token: string,
  storeId: number,
  ownerId: number
) {
  console.log('🔐 Assigning store owner with token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('🏪 Store ID:', storeId, 'Owner ID:', ownerId);
  
  const response = await fetch(`${API_URL}/stores/${storeId}/assign-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ownerId }),
  });
  
  console.log('📡 Assign owner response status:', response.status);
  return handleApiResponse(response);
}
