import React, { useState, useEffect } from 'react';
import { apiGetAddresses, apiAddAddress } from '../api';
import BottomBar from '../components/BottomBar';
import { apiCreateOrder } from '../api';
import { Page } from '../types/navigation';

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
  
  // Состояния для создания нового адреса
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Состояния для типа доставки
  const [deliveryType, setDeliveryType] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Состояние для показа красивого уведомления
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiGetAddresses(token)
      .then(data => {
        setAddresses(data);
        setAddressId(data[0]?.id || null);
        // Если нет адресов, автоматически показываем форму создания
        if (data.length === 0) {
          setShowNewAddressForm(true);
        }
      })
      .catch(() => setAddresses([]));
  }, [token]);

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      setAddressError('Введите адрес');
      return;
    }

    setAddingAddress(true);
    setAddressError('');
    try {
      const addedAddress = await apiAddAddress(token!, newAddress.trim());
      setAddresses(prev => [...prev, addedAddress]);
      setAddressId(addedAddress.id);
      setNewAddress('');
      setShowNewAddressForm(false);
    } catch (err: any) {
      setAddressError(err.message || 'Ошибка добавления адреса');
    } finally {
      setAddingAddress(false);
    }
  };

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
                  {addresses.length === 0 && !showNewAddressForm ? (
                    <div style={{ 
                      background: '#fff3e0', 
                      border: '1px solid #ffa726', 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <div style={{ color: '#ef6c00', fontSize: 14, marginBottom: 8 }}>
                        📍 У вас нет сохраненных адресов
                      </div>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        style={{
                          background: '#ffa726',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + Добавить адрес
                      </button>
                    </div>
                  ) : addresses.length > 0 ? (
                    <>
                      <select
                        value={addressId ?? ''}
                        onChange={e => setAddressId(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, marginBottom: 8 }}
                      >
                        {addresses.map(addr => (
                          <option key={addr.id} value={addr.id}>{addr.address}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        style={{
                          background: '#f5f5f5',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          marginBottom: 8
                        }}
                      >
                        + Добавить новый адрес
                      </button>
                    </>
                  ) : null}
                  
                  {/* Форма добавления нового адреса */}
                  {showNewAddressForm && (
                    <div style={{ 
                      background: '#f8f9fa', 
                      border: '1px solid #e9ecef', 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                        Новый адрес доставки
                      </div>
                      
                      {addressError && (
                        <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>
                          {addressError}
                        </div>
                      )}
                      
                      <input
                        type="text"
                        placeholder="Введите полный адрес доставки"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          borderRadius: 6, 
                          border: '1px solid #ddd', 
                          fontSize: 14, 
                          marginBottom: 8,
                          boxSizing: 'border-box'
                        }}
                      />
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleAddAddress}
                          disabled={addingAddress || !newAddress.trim()}
                          style={{
                            background: addingAddress ? '#ccc' : '#6BCB3D',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: addingAddress ? 'wait' : 'pointer',
                            flex: 1,
                            opacity: !newAddress.trim() ? 0.6 : 1
                          }}
                        >
                          {addingAddress ? 'Добавление...' : 'Сохранить адрес'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowNewAddressForm(false);
                            setNewAddress('');
                            setAddressError('');
                          }}
                          style={{
                            background: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Выбор типа доставки */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Время доставки</div>
                  
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                      onClick={() => setDeliveryType('ASAP')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: `2px solid ${deliveryType === 'ASAP' ? '#6BCB3D' : '#e0e0e0'}`,
                        background: deliveryType === 'ASAP' ? '#f0f8e0' : '#fff',
                        color: deliveryType === 'ASAP' ? '#6BCB3D' : '#666',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      🚀 Как можно скорее
                    </button>
                    
                    <button
                      onClick={() => setDeliveryType('SCHEDULED')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: `2px solid ${deliveryType === 'SCHEDULED' ? '#6BCB3D' : '#e0e0e0'}`,
                        background: deliveryType === 'SCHEDULED' ? '#f0f8e0' : '#fff',
                        color: deliveryType === 'SCHEDULED' ? '#6BCB3D' : '#666',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      📅 Запланировать
                    </button>
                  </div>

                  {/* Форма для запланированной доставки */}
                  {deliveryType === 'SCHEDULED' && (
                    <div style={{ 
                      background: '#f8f9fa', 
                      border: '1px solid #e9ecef', 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#6BCB3D' }}>
                        📅 Выберите дату и время доставки
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={e => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ 
                              width: '100%', 
                              padding: '8px 12px', 
                              borderRadius: 6, 
                              border: '1px solid #ddd', 
                              fontSize: 14,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px 12px', 
                              borderRadius: 6, 
                              border: '1px solid #ddd', 
                              fontSize: 14,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ fontSize: 12, color: '#6c757d' }}>
                        💡 Доставка возможна с 9:00 до 21:00
                      </div>
                    </div>
                  )}

                  {deliveryType === 'ASAP' && (
                    <div style={{ 
                      background: '#e8f5e8', 
                      border: '1px solid #6BCB3D', 
                      borderRadius: 8, 
                      padding: 10, 
                      marginBottom: 8 
                    }}>
                      <div style={{ fontSize: 13, color: '#4a7c59', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⚡</span>
                        <span>Доставим в течение 1 часа</span>
                      </div>
                    </div>
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
                
                {/* Проверка валидности для запланированной доставки */}
                {deliveryType === 'SCHEDULED' && (!scheduledDate || !scheduledTime) && (
                  <div style={{ 
                    color: '#ff9800', 
                    fontSize: 13, 
                    marginBottom: 8, 
                    background: '#fff3e0', 
                    padding: 8, 
                    borderRadius: 6,
                    border: '1px solid #ffcc02'
                  }}>
                    ⚠️ Для запланированной доставки выберите дату и время
                  </div>
                )}
                
                {success ? (
                  <div style={{ color: '#6BCB3D', fontWeight: 700, fontSize: 16, margin: '14px 0', textAlign: 'center' }}>
                    🎉 Заказ успешно оформлен!
                    {deliveryType === 'ASAP' && (
                      <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4 }}>
                        Доставим в течение 1 часа ⚡
                      </div>
                    )}
                    {deliveryType === 'SCHEDULED' && scheduledDate && scheduledTime && (
                      <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4 }}>
                        Доставим {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ru-RU')} 📅
                      </div>
                    )}
                  </div>
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
                    disabled={loading || !addressId || cart.length === 0 || (deliveryType === 'SCHEDULED' && (!scheduledDate || !scheduledTime))}
                    onClick={async () => {
                      setError('');
                      setSuccess(false);
                      setLoading(true);
                      try {
                        const orderData: any = {
                          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
                          address: addresses.find(a => a.id === addressId)?.address || '',
                          deliveryType,
                          ...(comment.trim() ? { comment: comment.trim() } : {})
                        };

                        // Добавляем запланированную дату, если выбран соответствующий тип
                        if (deliveryType === 'SCHEDULED' && scheduledDate && scheduledTime) {
                          const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
                          orderData.scheduledDate = scheduledDateTime.toISOString();
                        }

                        await apiCreateOrder(token!, orderData);
                        setSuccess(true);
                        setShowSuccessNotification(true);
                        onCartChange([]);
                        // Сбрасываем форму
                        setScheduledDate('');
                        setScheduledTime('');
                        setDeliveryType('ASAP');
                        
                        // Скрываем уведомление через 4 секунды
                        setTimeout(() => {
                          setShowSuccessNotification(false);
                        }, 4000);
                      } catch (e: any) {
                        setError(e.message || 'Ошибка оформления заказа');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {loading 
                      ? 'Оформление...' 
                      : deliveryType === 'ASAP' 
                        ? '🚀 Оформить заказ (доставка в течении 1 часа)'
                        : '📅 Оформить запланированный заказ'
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Красивое уведомление об успешном заказе */}
      {showSuccessNotification && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 50%, #66BB6A 100%)',
          color: '#fff',
          padding: '32px 40px',
          borderRadius: 24,
          boxShadow: '0 25px 80px rgba(76, 175, 80, 0.4)',
          zIndex: 2000,
          textAlign: 'center',
          minWidth: 320,
          maxWidth: 400,
          animation: 'successAppear 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            Ура! Заказ оформлен!
          </div>
          <div style={{ fontSize: 16, opacity: 0.95, lineHeight: 1.4, marginBottom: 16 }}>
            {deliveryType === 'ASAP' 
              ? 'Мы уже готовим ваши вкусности!\nДоставим всё самое свежее в течение часа! 🚀'
              : `Отлично! Мы доставим ваш заказ\n${scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'в назначенное время'} 📅`
            }
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 12, 
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            💝 Спасибо за доверие! Вы делаете правильный выбор!
          </div>
          <div style={{ fontSize: 28, marginTop: 16 }}>🌟</div>
        </div>
      )}
      
      {/* CSS анимация для уведомления */}
      {showSuccessNotification && (
        <style>
          {`
            @keyframes successAppear {
              0% {
                transform: translate(-50%, -50%) scale(0.3) rotate(-15deg);
                opacity: 0;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
              }
              100% {
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
                opacity: 1;
              }
            }
          `}
        </style>
      )}
      
      <BottomBar
        page="cart"
        onNavigate={onBack}
        cartCount={cart.reduce((sum, i) => sum + i.qty, 0)}
      />
    </React.Fragment>
  );
}

export default CartPage;
