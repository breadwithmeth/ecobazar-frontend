import React, { useState, useEffect } from 'react';
import { apiGetCouriersList } from '../api';

interface User {
  id: number;
  name: string | null;
  phone_number?: string;
  telegram_user_id?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string | null;
}

interface Courier {
  id: number;
  telegram_user_id: string;
  name: string;
  phone: string;
  stats?: {
    totalDelivered: number;
    activeOrders: number;
    rating: number;
    lastDelivery: string;
  };
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number | null;
  product: Product;
}

interface StatusHistory {
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  userId: number;
  address: string | null;
  createdAt: string;
  courierId: number | null;
  courier?: Courier;
  items: OrderItem[];
  user: User;
  statuses: StatusHistory[];
  totalAmount: number;
  currentStatus: string | null;
  itemsCount: number;
}

interface Props {
  orders?: Order[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onStatusChange: (orderId: number, status: string) => void;
  onAssignCourier: (orderId: number, courierId: number) => void;
  token: string;
}



const statusOptions = [
  'NEW',
  'WAITING_PAYMENT',
  'ASSEMBLY',
  'SHIPPING',
  'DELIVERED',
];

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  WAITING_PAYMENT: 'Ожидает оплаты',
  ASSEMBLY: 'Сборка',
  SHIPPING: 'Доставка',
  DELIVERED: 'Доставлен',
};

const AdminOrders: React.FC<Props> = ({ orders, loading, error, onBack, onStatusChange, onAssignCourier, token }) => {
  const [dialogOrder, setDialogOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [showCourierDialog, setShowCourierDialog] = useState(false);

  console.log('AdminOrders props:', { orders, loading, error });

  // Загрузка списка курьеров
  useEffect(() => {
    if (token) {
      setCouriersLoading(true);
      apiGetCouriersList(token, { limit: 50 })
        .then(data => {
          console.log('Couriers loaded:', data);
          setCouriers(data.couriers || []);
        })
        .catch(e => {
          console.error('Error loading couriers:', e);
          setCouriers([]);
        })
        .finally(() => setCouriersLoading(false));
    }
  }, [token]);

  const handleAssignCourier = () => {
    if (dialogOrder && selectedCourierId) {
      onAssignCourier(dialogOrder.id, selectedCourierId);
      setShowCourierDialog(false);
      setSelectedCourierId(null);
      setDialogOrder(null);
    }
  };

  return (
    <div>
      <h3>Управление заказами</h3>
      <div style={{ color: '#888', marginBottom: 12 }}>Список всех заказов (от новых к старым).</div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {loading ? (
        <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {orders && orders.length > 0 ? orders.map(order => {
            const currentStatus = order.currentStatus || (order.statuses && order.statuses.length > 0 
              ? order.statuses[order.statuses.length - 1].status 
              : 'NEW');
            const totalAmount = order.totalAmount || (order.items && order.items.length > 0 
              ? order.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
              : 0);
            
            return (
              <li key={order.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => { setDialogOrder(order); setNewStatus(currentStatus); }}>
                <div style={{ fontWeight: 600 }}>Заказ #{order.id} — {new Date(order.createdAt).toLocaleString()}</div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Пользователь: {order.user.name || `id:${order.user.telegram_user_id}`} ({order.user.phone_number || '—'})
                </div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Адрес: {order.address || 'Не указан'}
                </div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Статус: {statusLabels[currentStatus] || currentStatus}
                </div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Курьер: {order.courier ? `${order.courier.name} (${order.courier.phone})` : 'Не назначен'}
                </div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Общая сумма: {totalAmount}₸ ({order.itemsCount} поз.)
                </div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>Товары:</div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {order.items && order.items.map((item) => (
                    <li key={item.id} style={{ fontSize: 15 }}>
                      {item.product.name} — {item.quantity} шт. × {item.product.price}₸
                    </li>
                  ))}
                </ul>
              </li>
            );
          }) : (
            <li style={{ padding: 20, textAlign: 'center', color: '#888' }}>
              {orders ? 'Заказы не найдены' : 'Загрузка заказов...'}
            </li>
          )}
        </ul>
      )}
      {/* Диалог заказа */}
      {dialogOrder && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Заказ #{dialogOrder.id}</div>
            <div style={{ color: '#888', marginBottom: 8 }}>
              Пользователь: {dialogOrder.user.name || `id:${dialogOrder.user.telegram_user_id}`} ({dialogOrder.user.phone_number || '—'})
            </div>
            <div style={{ color: '#888', marginBottom: 8 }}>Создан: {new Date(dialogOrder.createdAt).toLocaleString()}</div>
            <div style={{ color: '#888', marginBottom: 8 }}>Адрес: {dialogOrder.address || 'Не указан'}</div>
            <div style={{ color: '#888', marginBottom: 8 }}>
              Общая сумма: {dialogOrder.totalAmount || (dialogOrder.items && dialogOrder.items.length > 0 
                ? dialogOrder.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) 
                : 0)}₸
            </div>
            <div style={{ color: '#888', marginBottom: 8 }}>
              Курьер: {dialogOrder.courier ? `${dialogOrder.courier.name} (${dialogOrder.courier.phone})` : 'Не назначен'}
            </div>
            {dialogOrder.courierId && (
              <div style={{ color: '#888', marginBottom: 8 }}>Курьер ID: {dialogOrder.courierId}</div>
            )}
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Товары ({dialogOrder.itemsCount} поз.):</div>
            <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 10 }}>
              {dialogOrder.items && dialogOrder.items.map((item) => (
                <li key={item.id} style={{ fontSize: 15, marginBottom: 4 }}>
                  {item.product.name} — {item.quantity} шт. × {item.product.price}₸ = {item.quantity * item.product.price}₸
                  {item.product.image && (
                    <div style={{ fontSize: 12, color: '#888' }}>Изображение: {item.product.image}</div>
                  )}
                </li>
              ))}
            </ul>
            
            {dialogOrder.statuses && dialogOrder.statuses.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>История статусов:</div>
                <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 10 }}>
                  {dialogOrder.statuses.map((status, idx) => (
                    <li key={idx} style={{ fontSize: 14, color: '#666' }}>
                      {statusLabels[status.status] || status.status} — {new Date(status.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Изменить статус заказа:</div>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15, marginBottom: 12, width: '100%' }}>
              {statusOptions.map(st => (
                <option key={st} value={st}>{statusLabels[st] || st}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button 
                onClick={() => { onStatusChange(dialogOrder.id, newStatus); setDialogOrder(null); }} 
                style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer', flex: 1 }}
              >
                Изменить статус
              </button>
              <button 
                onClick={() => setShowCourierDialog(true)} 
                style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer', flex: 1 }}
                disabled={couriersLoading}
              >
                {couriersLoading ? 'Загрузка...' : 'Назначить курьера'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setDialogOrder(null)} style={{ background: '#eee', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer', flex: 1 }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Диалог выбора курьера */}
      {showCourierDialog && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Назначить курьера</div>
            <div style={{ color: '#888', marginBottom: 16 }}>Заказ #{dialogOrder?.id}</div>
            
            {couriersLoading ? (
              <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Загрузка курьеров...</div>
            ) : couriers.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Курьеры не найдены</div>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Выберите курьера:</div>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                  {couriers.map(courier => (
                    <div 
                      key={courier.id}
                      onClick={() => setSelectedCourierId(courier.id)}
                      style={{ 
                        padding: '12px 16px', 
                        border: `2px solid ${selectedCourierId === courier.id ? '#6BCB3D' : '#e0e0e0'}`, 
                        borderRadius: 8, 
                        marginBottom: 8, 
                        cursor: 'pointer',
                        background: selectedCourierId === courier.id ? '#f0f8e0' : '#fff'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{courier.name}</div>
                      <div style={{ fontSize: 14, color: '#666' }}>{courier.phone}</div>
                      {courier.stats && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          Доставлено: {courier.stats.totalDelivered} | Активных: {courier.stats.activeOrders} | Рейтинг: {courier.stats.rating}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleAssignCourier} 
                disabled={!selectedCourierId || couriersLoading}
                style={{ 
                  background: selectedCourierId ? '#6BCB3D' : '#ccc', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  fontSize: 16, 
                  padding: '8px 16px', 
                  cursor: selectedCourierId ? 'pointer' : 'not-allowed', 
                  flex: 1 
                }}
              >
                Назначить
              </button>
              <button 
                onClick={() => { setShowCourierDialog(false); setSelectedCourierId(null); }} 
                style={{ background: '#eee', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer', flex: 1 }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginTop: 18 }}>← Назад</button>
    </div>
  );
};

export default AdminOrders;
