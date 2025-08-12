import { useEffect, useState, useRef, useCallback } from "react";
import { apiGetUser, apiGetCategories, apiGetProducts, apiGetMyOrders } from '../api';
import ProfilePage from './ProfilePage';
import CartPage from './CartPage';
import BottomBar from '../components/BottomBar';
import ProfileFillPage from './ProfileFillPage';
import AdminPage from './AdminPage';
import CourierPage from './CourierPage';
import SellerPage from './SellerPage';
import { Page } from '../types/navigation';

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number | null;
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
  };
}

interface Order {
  id: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
  totalAmount: number;
  status: string | null;
  statusUpdatedAt: string;
  itemsCount: number;
  deliveryType?: 'ASAP' | 'SCHEDULED';
  scheduledDate?: string;
}

// Отображение статуса заказа на русском
function statusLabel(status: string) {
  switch (status) {
   
    case 'NEW': return 'Новый';
    case 'WAITING_PAYMENT': return 'Ожидает оплаты';
    case 'PREPARING': return 'Готовится';
    case 'DELIVERING': return 'Доставляется';
    case 'DELIVERED': return 'Доставлен';
    case 'CANCELLED': return 'Отменён';
    default: return status;
  }
}

// Функция для отображения типа доставки
function deliveryTypeLabel(deliveryType?: string, scheduledDate?: string) {
  if (!deliveryType) return '';
  
  switch (deliveryType) {
    case 'ASAP': return '🚀 Как можно скорее';
    case 'SCHEDULED': 
      if (scheduledDate) {
        const date = new Date(scheduledDate);
        return `📅 Запланирована на ${date.toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }
      return '📅 Запланированная доставка';
    default: return deliveryType;
  }
}

// Функция для расчета общей стоимости заказа
function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
}

// Функция для расчета оставшегося времени доставки ASAP
function calculateDeliveryTimeRemaining(createdAt: string): { timeLeft: string; isExpired: boolean } {
  const orderTime = new Date(createdAt);
  const deliveryTime = new Date(orderTime.getTime() + 60 * 60 * 1000); // +1 час
  const now = new Date();
  const timeRemaining = deliveryTime.getTime() - now.getTime();
  
  if (timeRemaining <= 0) {
    return { timeLeft: "Время доставки истекло", isExpired: true };
  }
  
  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return { timeLeft: `${hours}ч ${remainingMinutes}м`, isExpired: false };
  } else {
    return { timeLeft: `${remainingMinutes}м`, isExpired: false };
  }
}

// Кастомный хук для интервала
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Функция для сравнения массивов заказов
function ordersEqual(orders1: Order[], orders2: Order[]): boolean {
  if (orders1.length !== orders2.length) return false;
  
  for (let i = 0; i < orders1.length; i++) {
    const o1 = orders1[i];
    const o2 = orders2[i];
    
    if (
      o1.id !== o2.id ||
      o1.status !== o2.status ||
      o1.totalAmount !== o2.totalAmount ||
      o1.itemsCount !== o2.itemsCount ||
      o1.items.length !== o2.items.length
    ) {
      return false;
    }
  }
  
  return true;
}



interface Product {
  id: number;
  name: string;
  price: number;
  storeId: number;
  image?: string | null;
  store?: { id: number; name: string; address: string };
  unit?: string; // добавлено
}


const CART_KEY = 'ecobazar_cart';

interface CartItem {
  id: number;
  qty: number;
}

const CatalogPage: React.FC<{ token: string }> = ({ token }) => {
  // helper форматирования цены, чтобы убрать переносы
  const formatPrice = (value: number) => {
    try {
      return value.toLocaleString('ru-RU');
    } catch {
      return String(value);
    }
  };

  // Добавляем CSS анимацию для спиннера
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: translateY(-50%) rotate(0deg); }
      100% { transform: translateY(-50%) rotate(360deg); }
    }
  `;
  
  // Вставляем стили в документ
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = spinnerStyle;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Заказы пользователя
  const [orders, setOrders] = useState<Order[]>([]);
  // Показывать только заказы за последние 12 часов
  const recentOrders = orders.filter(order => {
    const created = new Date(order.createdAt).getTime();
    return Date.now() - created <= 12 * 60 * 60 * 1000;
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  
  // Состояние для обновления таймеров ASAP заказов
  const [timerTick, setTimerTick] = useState(0);

  // Функция для загрузки заказов
  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setOrdersLoading(true);
    } else {
      setBackgroundRefreshing(true);
    }
    
    try {
      const response: any = await apiGetMyOrders(token);
      // Новый формат API: {success, data, meta}
      const ordersData = response.success ? response.data : response;
      const allOrders = Array.isArray(ordersData) ? ordersData : [];
      // Исключаем доставленные и отменённые заказы
      const filteredOrders = allOrders.filter((o: Order) => 
        o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
      );
      
      // Обновляем состояние только если заказы изменились
      setOrders(prevOrders => {
        if (ordersEqual(prevOrders, filteredOrders)) {
          return prevOrders; // Не обновляем если ничего не изменилось
        }
        return filteredOrders;
      });
      
      setOrdersError('');
    } catch (e: any) {
      setOrdersError(e.message);
    } finally {
      if (showLoading) {
        setOrdersLoading(false);
      } else {
        setBackgroundRefreshing(false);
      }
    }
  }, [token]);

  // Первоначальная загрузка заказов
  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  // Автоматическое обновление каждые 3 секунды (без показа loading)
  useInterval(() => {
    if (!ordersLoading) { // Не обновляем если уже идет загрузка
      loadOrders(false);
    }
  }, 3000);
  
  // Обновление таймеров ASAP заказов каждую минуту
  useInterval(() => {
    setTimerTick(prev => prev + 1);
  }, 60000);
  const [page, setPage] = useState<Page>('catalog');
  const [showProfileFill, setShowProfileFill] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Проверка ролей пользователя
  const isAdmin = user && (user.role === 'ADMIN' || user.id === 1001);
  const isCourier = user && user.role === 'COURIER';
  const isSeller = user && user.role === 'SELLER';
  
  // Проверка профиля пользователя при загрузке
  useEffect(() => {
    apiGetUser(token)
      .then(userData => {
        setUser(userData);
        if (!userData.name || !userData.phone_number) {
          setShowProfileFill(true);
        }
      })
      .catch(() => {});
  }, [token]);
  // const [cartOpen, setCartOpen] = useState(false); // удалено как неиспользуемое
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Категории из API
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Корзина
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Сохранять корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Поиск
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce для поиска - задержка 500мс
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);
  
  // Добавляем категорию "Без категории" для товаров с categoryId: null
  const allCategories = [
    ...(categories || []),
    { id: 0, name: 'Без категории' } // Специальная категория для товаров без категории
  ];
  // активная категория для фильтрации
  const [filterCategory, setFilterCategory] = useState<number | null>(null); // для фильтрации API
  // ref для горизонтального скролла категорий
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  // refs для кнопок категорий
  const categoryBtnRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const [showHeader, setShowHeader] = useState(true);
  const lastScroll = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGetCategories(token)
      .then(data => {
        setCategories(data);
      })
      .catch(e => {
        setError(e.message);
      });
  }, [token]);
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainer.current;
      const scrollY = container?.scrollTop || window.scrollY;
      // header show/hide
      if (scrollY > lastScroll.current && scrollY > 40) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScroll.current = scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    
    const filters: any = {};
    
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    
    if (filterCategory) {
      filters.categoryId = filterCategory;
    }
    
    // Добавляем сортировку по имени для удобства пользователей
    filters.sortBy = 'name';
    filters.sortOrder = 'asc';
    
    apiGetProducts(undefined, 1, 50, filters)
      .then((data) => {
        // нормализуем список и подставляем unit по умолчанию
        const rawList = Array.isArray(data) ? data : (data.products || []);
        const normalized = rawList.map((p: any) => ({
          ...p,
          unit: (p.unit === null || p.unit === undefined || p.unit === '') ? 'шт' : p.unit
        }));
        setProducts(normalized);
        setError('');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, debouncedSearch, filterCategory]);

  // Центрировать выбранную категорию в списке
  useEffect(() => {
    if (!filterCategory) return;
    const btn = categoryBtnRefs.current[filterCategory];
    const scroll = categoriesScrollRef.current;
    if (btn && scroll) {
      const btnRect = btn.getBoundingClientRect();
      const scrollRect = scroll.getBoundingClientRect();
      const offset = btnRect.left - scrollRect.left - scrollRect.width / 2 + btnRect.width / 2;
      scroll.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [filterCategory]);

  // Ранние возвраты только для критических ошибок загрузки
  if (error && !products.length && !loading) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 48 }}>{error}</div>;
  }


  if (showProfileFill) {
    return <ProfileFillPage token={token} onDone={() => setShowProfileFill(false)} />;
  }
  if (page === 'admin' && isAdmin) {
    return <AdminPage onBack={() => setPage('catalog')} token={token} />;
  }
  if (page === 'courier' && isCourier) {
    return <CourierPage onBack={() => setPage('catalog')} token={token} />;
  }
  if (page === 'seller' && isSeller) {
    return <SellerPage onBack={() => setPage('catalog')} token={token} />;
  }
  if (page === 'profile') {
    return <ProfilePage token={token} onNavigate={setPage} />;
  }
  if (page === 'cart') {
    return (
      <CartPage
        cart={cart}
        products={products}
        onCartChange={setCart}
        onBack={setPage}
        token={token}
      />
    );
  }

  return (
    <div style={{ background: '#f7f7f7', minHeight: '100vh', position: 'relative', padding: '8px 0' }}>
      {/* Модальное окно с детальной информацией о заказе */}
      {selectedOrder && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 20,
              maxWidth: 400,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Заказ #{selectedOrder.id}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Статус:</strong> {statusLabel(selectedOrder.status || 'NEW')}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Адрес доставки:</strong> {selectedOrder.address}
              </div>
              {selectedOrder.deliveryType && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Тип доставки:</strong> <span style={{ color: '#6BCB3D' }}>{deliveryTypeLabel(selectedOrder.deliveryType, selectedOrder.scheduledDate)}</span>
                  {selectedOrder.deliveryType === 'ASAP' && (() => {
                    const { timeLeft, isExpired } = calculateDeliveryTimeRemaining(selectedOrder.createdAt);
                    return (
                      <div style={{ 
                        color: isExpired ? '#f44336' : '#FF9800', 
                        fontWeight: 600,
                        fontSize: 14,
                        marginTop: 4,
                        padding: '6px 12px',
                        background: isExpired ? '#ffebee' : '#fff3e0',
                        borderRadius: 8,
                        border: `1px solid ${isExpired ? '#ffcdd2' : '#ffe0b2'}`,
                        display: 'inline-block'
                      }}>
                        ⏱️ {timeLeft}
                        {!isExpired && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>до доставки</div>}
                      </div>
                    );
                  })()}
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <strong>Дата создания:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>Товары:</strong>
              {selectedOrder.items.map((item, index) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>Количество: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#6BCB3D' }}>
                    {(item.price || item.product.price) ? `${(item.price || item.product.price) * item.quantity}₸` : 'Цена не указана'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              borderTop: '1px solid #f0f0f0', 
              paddingTop: 16, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <strong style={{ fontSize: 18 }}>Итого:</strong>
              <strong style={{ fontSize: 18, color: '#6BCB3D' }}>
                {selectedOrder.totalAmount || calculateOrderTotal(selectedOrder.items)}₸
              </strong>
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky header вне скроллируемой области */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#f7f7f7',
          transition: 'transform 0.25s',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          boxShadow: showHeader ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
        //   maxWidth: 420,
          margin: '0 auto',
          padding: '0 18px 0 18px',
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '26px 0 12px 0', maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Каталог</span>
          {isAdmin && (
            <button 
              onClick={() => setPage('admin')}
              style={{ 
                background: '#FF5722', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '6px 12px', 
                fontSize: 12, 
                fontWeight: 600, 
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              🔧 Админ
            </button>
          )}
          {isCourier && (
            <button 
              onClick={() => setPage('courier')}
              style={{ 
                background: '#FF9800', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '6px 12px', 
                fontSize: 12, 
                fontWeight: 600, 
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              🚚 Курьер
            </button>
          )}
          {isSeller && (
            <button 
              onClick={() => setPage('seller')}
              style={{ 
                background: '#673AB7', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '6px 12px', 
                fontSize: 12, 
                fontWeight: 600, 
                cursor: 'pointer',
                marginLeft: 8
              }}
            >
              🏪 Продавец
            </button>
          )}
          <span style={{ fontSize: 20, marginLeft: 'auto', color: '#6BCB3D', cursor: 'pointer' }}>☰</span>
        </div>
        <div style={{ maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%', padding: '0 0 0 0' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Поиск"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 12,
                border: '1px solid #e0e0e0',
                marginBottom: 12,
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
                paddingRight: search !== debouncedSearch ? '45px' : '18px',
              }}
            />
            {search !== debouncedSearch && (
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                border: '2px solid #6BCB3D',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            )}
          </div>



      <div
        ref={categoriesScrollRef}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 8,
          paddingLeft: 2,
          paddingRight: 2,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Кнопка "Все товары" */}
        <button
          key="all"
          type="button"
          onClick={() => {
            setFilterCategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            background: filterCategory === null ? '#6BCB3D' : '#fff',
            color: filterCategory === null ? '#fff' : '#222',
            border: 'none',
            borderRadius: 16,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 15,
            boxShadow: filterCategory === null ? '0 2px 8px rgba(107,203,61,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Все товары
        </button>
        
        {allCategories.map(cat => (
          <button
            key={cat.id}
            type="button"
            ref={el => { categoryBtnRefs.current[cat.id] = el; }}
            onClick={() => {
              setFilterCategory(cat.id);
            }}
            style={{
              background: filterCategory === cat.id ? '#6BCB3D' : '#fff',
              color: filterCategory === cat.id ? '#fff' : '#222',
              border: 'none',
              borderRadius: 16,
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: filterCategory === cat.id ? '0 2px 8px rgba(107,203,61,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  </div>

      {/* Скроллируемая область с отступом сверху под header */}
      <div
        ref={scrollContainer}
        style={{ paddingTop: 160, paddingBottom: 72, overflowY: 'auto', overflowX: 'hidden', maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%', paddingLeft: 8, paddingRight: 8 }}>
        {/* Список заказов пользователя */}
        <div style={{ marginBottom: 18 }}>
          {ordersLoading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 15 }}>Загрузка заказов...</div>
          ) : ordersError ? (
            <div style={{ color: 'red', textAlign: 'center', fontSize: 15 }}>{ordersError}</div>
          ) : !Array.isArray(orders) || orders.length === 0 ? null : (
            <div style={{
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '14px 12px 10px 12px',
              marginBottom: 8,
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#222', display: 'flex', alignItems: 'center', gap: 8 }}>
                Ваши заказы
                {backgroundRefreshing && (
                  <div style={{
                    width: 12,
                    height: 12,
                    border: '2px solid #6BCB3D',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                )}
              </div>
          {(recentOrders || []).map((order: Order) => (
                <div 
                  key={order.id} 
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 8,
                    marginBottom: 8,
                    fontSize: 15,
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onClick={() => setSelectedOrder(order)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f9f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>Заказ #{order.id}</span>
                    <span style={{
                      background: '#f7f7f7',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: 13,
                      color: '#6BCB3D',
                      fontWeight: 600,
                    }}>{statusLabel(order.status || 'NEW')}</span>
                  </div>
                  <div style={{ color: '#888', fontSize: 14, marginBottom: 2 }}>
                    {order.items?.map((item: OrderItem) => 
                      `${item.product.name} ×${item.quantity}`
                    ).join(', ')}
                  </div>
                  {order.deliveryType && (
                    <div style={{ color: '#6BCB3D', fontSize: 13, marginBottom: 2, fontWeight: 500 }}>
                      {deliveryTypeLabel(order.deliveryType, order.scheduledDate)}
                      {order.deliveryType === 'ASAP' && (() => {
                        const { timeLeft, isExpired } = calculateDeliveryTimeRemaining(order.createdAt);
                        return (
                          <span style={{ 
                            color: isExpired ? '#f44336' : '#FF9800', 
                            fontWeight: 600,
                            marginLeft: 8,
                            fontSize: 12
                          }}>
                            ⏱️ {timeLeft}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  <div style={{ color: '#222', fontWeight: 600, fontSize: 15 }}>
                    {order.totalAmount || calculateOrderTotal(order.items)}₸
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Список товаров */}
        <div style={{ padding: '20px 2px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <div style={{ marginBottom: 16, fontSize: 18 }}>⏳</div>
              <div>Загрузка товаров...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#f44336' }}>
              <div style={{ marginBottom: 16, fontSize: 18 }}>❌</div>
              <div>{error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 16,
                  background: '#6BCB3D',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Попробовать снова
              </button>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <div style={{ marginBottom: 16, fontSize: 32 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Товары не найдены</div>
              <div style={{ fontSize: 14, color: '#888' }}>
                {search ? `По запросу "${search}" ничего не найдено` : 
                 filterCategory ? 'В данной категории нет товаров' : 
                 'Нет доступных товаров'}
              </div>
              {(search || filterCategory) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterCategory(null);
                  }}
                  style={{
                    marginTop: 16,
                    background: '#6BCB3D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {products.map(p => (
                <div key={p.id} style={{
                  background: '#fff',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  padding: '18px 14px 16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  position: 'relative',
                  marginBottom: 2,
                }}>
                  <div style={{ width: '100%', height: 90, background: '#f2f2f2', borderRadius: 12, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    ) : (
                      <span style={{ fontSize: 38 }}>🛒</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{p.store ? p.store.name : ''}</div>
                  <div style={{ fontWeight: 700, color: '#6BCB3D', fontSize: 16, marginBottom: 8, lineHeight: 1 }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(p.price)}₸</span>
                    <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4, opacity: 0.9 }}>{p.unit || 'шт'}</span>
                  </div>
                  {/* Блок управления количеством товара в корзине */}
                  {(() => {
                    const cartItem = cart.find(i => i.id === p.id);
                    const maxQty = typeof (p as any).stock === 'number' ? (p as any).stock : Infinity;
                    if (cartItem) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', alignSelf: 'flex-end' }}>
                          <button
                            type="button"
                            style={{
                              background: '#fff',
                              color: '#6BCB3D',
                              border: '1px solid #6BCB3D',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 18,
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setCart(prev => {
                                const idx = prev.findIndex(i => i.id === p.id);
                                if (idx >= 0) {
                                  if (prev[idx].qty > 1) {
                                    return prev.map(i => i.id === p.id ? { ...i, qty: i.qty - 1 } : i);
                                  } else {
                                    return prev.filter(i => i.id !== p.id);
                                  }
                                }
                                return prev;
                              });
                            }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>{cartItem.qty}</span>
                          <button
                            type="button"
                            style={{
                              background: '#6BCB3D',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 18,
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: cartItem.qty >= maxQty ? 'not-allowed' : 'pointer',
                              opacity: cartItem.qty >= maxQty ? 0.5 : 1,
                            }}
                            onClick={() => {
                              if (cartItem.qty >= maxQty) return;
                              setCart(prev => {
                                const idx = prev.findIndex(i => i.id === p.id);
                                if (idx >= 0) {
                                  return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
                                } else {
                                  return [...prev, { id: p.id, qty: 1 }];
                                }
                              });
                            }}
                            disabled={cartItem.qty >= maxQty}
                          >
                            +
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          style={{
                            background: '#6BCB3D',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 15,
                            padding: '8px 16px',
                            marginTop: 'auto',
                            cursor: maxQty <= 0 ? 'not-allowed' : 'pointer',
                            alignSelf: 'flex-end',
                            opacity: maxQty <= 0 ? 0.5 : 1,
                          }}
                          onClick={() => {
                            if (maxQty <= 0) return;
                            setCart(prev => {
                              const idx = prev.findIndex(i => i.id === p.id);
                              if (idx >= 0) {
                                return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
                              } else {
                                return [...prev, { id: p.id, qty: 1 }];
                              }
                            });
                          }}
                          disabled={maxQty <= 0}
                        >
                          +
                        </button>
                      );
                    }
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      


      <BottomBar
        page={page}
        onNavigate={setPage}
        cartCount={cart.reduce((sum, i) => sum + i.qty, 0)}
      />


    </div>
  );
};


export default CatalogPage;
