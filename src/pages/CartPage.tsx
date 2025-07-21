import React, { useState, useEffect } from 'react';
import { apiGetAddresses } from '../api';
import BottomBar from '../components/BottomBar';
import { apiCreateOrder } from '../api';

type Product = {
  id: number;
  name: string;
  price: number;
  storeId: number;
  store?: { id: number; name: string; address: string };
};

type CartItem = {
  id: number;
  qty: number;
};

type Page = 'catalog' | 'profile' | 'cart';
type Address = {
  id: number;
  address: string;
};

type CartPageProps = {
  cart: CartItem[];
  products: Product[];
  onCartChange: (cart: CartItem[]) => void;
  onBack: (page: Page) => void;
  token?: string;
};

const CartPage: React.FC<CartPageProps> = ({ cart, products, onCartChange, onBack, token }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiGetAddresses(token)
      .then(data => {
        setAddresses(data);
        setAddressId(data[0]?.id || null);
      })
      .catch(() => setAddresses([]));
  }, [token]);

  return (
    <React.Fragment>
      <div style={{ background: '#f7f7f7', minHeight: '100vh', width: '100vw', position: 'relative', padding: '0 0 80px 0', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div style={{ width: '100%', padding: 0, boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 700, fontSize: 28, color: '#222', margin: '0 0 18px 0', padding: '28px 0 10px 0', width: '100%', boxSizing: 'border-box' }}>Корзина</div>
          <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '18px 14px 14px 14px', marginBottom: 18, boxSizing: 'border-box', overflowX: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', margin: '32px 0' }}>Корзина пуста</div>
            ) : (
              <>
                {cart.map(item => {
                  const prod = products.find(p => p.id === item.id);
                  if (!prod) return null;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{prod.name}</div>
                        <div style={{ fontSize: 13, color: '#888' }}>{prod.price}₸ × {item.qty}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          style={{
                            background: '#fff',
                            color: '#6BCB3D',
                            border: '1.5px solid #6BCB3D',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 20,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            onCartChange(
                              item.qty > 1
                                ? cart.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i)
                                : cart.filter(i => i.id !== item.id)
                            );
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{item.qty}</span>
                        <button
                          style={{
                            background: '#6BCB3D',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 20,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            onCartChange(
                              cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                            );
                          }}
                        >
                          +
                        </button>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#6BCB3D', minWidth: 44, textAlign: 'right', marginLeft: 8 }}>{prod.price * item.qty}₸</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1.5px solid #eee', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                  <span>Итого</span>
                  <span>{cart.reduce((sum, i) => {
                    const prod = products.find(p => p.id === i.id);
                    return sum + (prod ? prod.price * i.qty : 0);
                  }, 0)}₸</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Адрес доставки</div>
                  {addresses.length === 0 ? (
                    <div style={{ color: '#888', fontSize: 15 }}>Нет добавленных адресов</div>
                  ) : (
                    <select
                      value={addressId ?? ''}
                      onChange={e => setAddressId(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, marginBottom: 8 }}
                    >
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>{addr.address}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ marginBottom: 10, width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                  <input
                    type="text"
                    placeholder="Комментарий к заказу (необязательно)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{ width: '100%', maxWidth: 420, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box' }}
                  />
                </div>
                {error && <div style={{ color: 'red', fontSize: 15, marginBottom: 8 }}>{error}</div>}
                {success ? (
                  <div style={{ color: '#6BCB3D', fontWeight: 700, fontSize: 16, margin: '14px 0', textAlign: 'center' }}>Заказ успешно оформлен!</div>
                ) : (
                  <button
                    style={{
                      marginTop: 8,
                      width: '100%',
                      background: '#6BCB3D',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 17,
                      padding: '14px 0',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(107,203,61,0.10)',
                    }}
                    disabled={loading || !addressId || cart.length === 0 || addresses.length === 0}
                    onClick={async () => {
                      setError('');
                      setSuccess(false);
                      setLoading(true);
                      try {
                        await apiCreateOrder(token!, {
                          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
                          address: addresses.find(a => a.id === addressId)?.address || '',
                          ...(comment.trim() ? { comment: comment.trim() } : {})
                        });
                        setSuccess(true);
                        onCartChange([]);
                      } catch (e: any) {
                        setError(e.message || 'Ошибка оформления заказа');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Оформить заказ
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <BottomBar
        page="cart"
        onNavigate={onBack}
        cartCount={cart.reduce((sum, i) => sum + i.qty, 0)}
      />
    </React.Fragment>
  );
}

export default CartPage;
