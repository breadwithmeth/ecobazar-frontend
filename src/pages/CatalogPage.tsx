
import { useEffect, useState, useRef } from "react";
import { apiGetUser, apiGetCategories, apiGetProducts, apiGetMyOrders } from '../api';
import ProfilePage from './ProfilePage';
import CartPage from './CartPage';
import BottomBar from '../components/BottomBar';
import ProfileFillPage from './ProfileFillPage';
import AdminPage from './AdminPage';

interface OrderProduct {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface OrderStatus {
  id: number;
  orderId: number;
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  products?: OrderProduct[];
  status?: string;
  statuses?: OrderStatus[];
}

// Отображение статуса заказа на русском
function statusLabel(status: string) {
  switch (status) {
   
    case 'NEW': return 'Новый';
    case 'WAITING_PAYMENT': return 'Ожидает оплаты';
    case 'ASSEMBLY': return 'Сборка';
    case 'SHIPPING': return 'В пути';
    case 'DELIVERED': return 'Доставлен';
    default: return status;
  }
}



interface Product {
  id: number;
  name: string;
  price: number;
  storeId: number;
  image?: string | null;
  store?: { id: number; name: string; address: string };
}


const CART_KEY = 'ecobazar_cart';

interface CartItem {
  id: number;
  qty: number;
}

type Page = 'catalog' | 'profile' | 'cart' | 'admin';

const CatalogPage: React.FC<{ token: string }> = ({ token }) => {
  // Заказы пользователя
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    setOrdersLoading(true);
    apiGetMyOrders(token)
      .then((data: any) => {
        // Исключаем доставленные
        const allOrders = Array.isArray(data) ? data : data.orders;
        setOrders(allOrders.filter((o: Order) => o.status !== 'delivered'));
        setOrdersError('');
      })
      .catch((e: any) => setOrdersError(e.message))
      .finally(() => setOrdersLoading(false));
  }, [token]);
  const [page, setPage] = useState<Page>('catalog');
  const [showProfileFill, setShowProfileFill] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Проверка, является ли пользователь администратором
  const isAdmin = user && (user.role === 'ADMIN' || user.id === 1001);
  
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
    
    if (search) {
      filters.search = search;
    }
    
    if (filterCategory) {
      filters.categoryId = filterCategory;
    }
    
    // Добавляем сортировку по имени для удобства пользователей
    filters.sortBy = 'name';
    filters.sortOrder = 'asc';
    
    apiGetProducts(undefined, 1, 50, filters)
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts(data.products || []);
        }
        setError('');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, search, filterCategory]);

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 48 }}>Загрузка каталога...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 48 }}>{error}</div>;
  if (!products.length) return <div style={{ textAlign: 'center', marginTop: 48 }}>Нет товаров</div>;


  if (showProfileFill) {
    return <ProfileFillPage token={token} onDone={() => setShowProfileFill(false)} />;
  }
  if (page === 'admin' && isAdmin) {
    return <AdminPage onBack={() => setPage('catalog')} token={token} />;
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
          <span style={{ fontSize: 20, marginLeft: 'auto', color: '#6BCB3D', cursor: 'pointer' }}>☰</span>
        </div>
        <div style={{ maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%', padding: '0 0 0 0' }}>
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
            }}
          />



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
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#222' }}>Ваши заказы</div>
              {(orders || []).map((order: Order) => {
                // Найти последний статус по времени
                let lastStatus = order.status;
                if (Array.isArray(order.statuses) && order.statuses.length > 0) {
                  lastStatus = order.statuses.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].status;
                }
                return (
                  <div key={order.id} style={{
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 8,
                    marginBottom: 8,
                    fontSize: 15,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600 }}>Заказ #{order.id}</span>
                      <span style={{
                        background: '#f7f7f7',
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontSize: 13,
                        color: '#6BCB3D',
                        fontWeight: 600,
                      }}>{statusLabel(lastStatus || '')}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: 14, marginBottom: 2 }}>
                      {Array.isArray(order.products)
                        ? order.products.map((p: OrderProduct) => `${p.name} ×${p.qty}`).join(', ')
                        : null}
                    </div>
                    <div style={{ color: '#222', fontWeight: 600, fontSize: 15 }}>
                      {Array.isArray(order.products)
                        ? order.products.reduce((sum: number, p: OrderProduct) => sum + p.price * p.qty, 0)
                        : 0}₸
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Список товаров */}
        <div style={{ padding: '20px 2px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Загрузка...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#f44336' }}>{error}</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Товары не найдены</div>
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
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{p.store ? p.store.name : ''}</div>
                  <div style={{ fontWeight: 700, color: '#6BCB3D', fontSize: 16, marginBottom: 8 }}>{p.price}₸</div>
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
