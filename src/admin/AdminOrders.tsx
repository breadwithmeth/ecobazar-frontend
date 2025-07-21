import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  phone: string;
}
interface Product {
  id: number;
  name: string;
  price: number;
}
interface OrderItem {
  product: Product;
  quantity: number;
}
interface Order {
  id: number;
  user: User;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

interface User {
  id: number;
  telegram_user_id?: string;
  phone_number?: string;
  role?: string;
  name: string;
}



interface StatusHistory {
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  userId: number;
  createdAt: string;
  items: OrderItem[];
  user: User;
  statuses: StatusHistory[];
  address: string;
}

interface Props {
  orders: Order[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onStatusChange: (orderId: number, status: string) => void;
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

const AdminOrders: React.FC<Props> = ({ orders, loading, error, onBack, onStatusChange }) => {
  const [dialogOrder, setDialogOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');

  return (
    <div>
      <h3>Управление заказами</h3>
      <div style={{ color: '#888', marginBottom: 12 }}>Список всех заказов (от новых к старым).</div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {loading ? (
        <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {orders.map(order => (
            <li key={order.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 12, cursor: 'pointer' }}
                onClick={() => { setDialogOrder(order); setNewStatus(order.status); }}>
              <div style={{ fontWeight: 600 }}>Заказ #{order.id} — {new Date(order.createdAt).toLocaleString()}</div>
            <div style={{ fontSize: 15, color: '#888' }}>
              Пользователь: {order.user.name || `id:${order.user.telegram_user_id}`} ({order.user.phone_number || '—'})
            </div>
            <div style={{ fontSize: 15, color: '#888' }}>
              Адрес: {order.address}
            </div>
            <div style={{ fontSize: 15, color: '#888' }}>
              Статус: {order.statuses && order.statuses.length > 0
                ? (statusLabels[order.statuses[order.statuses.length - 1].status] || order.statuses[order.statuses.length - 1].status)
                : statusLabels['NEW']}
            </div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>Товары:</div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {order.items.map((item, idx) => (
                  <li key={idx} style={{ fontSize: 15 }}>
                    {item.product.name} — {item.quantity} шт. × {item.product.price}₸
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {/* Диалог заказа */}
      {dialogOrder && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Заказ #{dialogOrder.id}</div>
            <div style={{ color: '#888', marginBottom: 8 }}>
              Пользователь: {dialogOrder.user.name || `id:${dialogOrder.user.telegram_user_id}`} ({dialogOrder.user.phone_number || '—'})
            </div>
            <div style={{ color: '#888', marginBottom: 8 }}>Создан: {new Date(dialogOrder.createdAt).toLocaleString()}</div>
            <div style={{ color: '#888', marginBottom: 8 }}>Адрес: {dialogOrder.address}</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Товары:</div>
            <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 10 }}>
              {dialogOrder.items.map((item, idx) => (
                <li key={idx} style={{ fontSize: 15 }}>
                  {item.product.name} — {item.quantity} шт. × {item.product.price}₸
                </li>
              ))}
            </ul>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Статус заказа:</div>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15, marginBottom: 12 }}>
              {statusOptions.map(st => (
                <option key={st} value={st}>{statusLabels[st] || st}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => { onStatusChange(dialogOrder.id, newStatus); setDialogOrder(null); }} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Сохранить</button>
              <button onClick={() => setDialogOrder(null)} style={{ background: '#eee', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginTop: 18 }}>← Назад</button>
    </div>
  );
};

export default AdminOrders;
