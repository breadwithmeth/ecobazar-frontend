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

interface Store {
  id: number;
  name: string;
}

interface ConfirmedByUser {
  id: number;
  name: string | null;
}

interface StoreConfirmation {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'PARTIAL' | 'REJECTED';
  confirmedQuantity: number;
  confirmedAt: string;
  notes: string | null;
  store: Store;
  confirmedBy: ConfirmedByUser;
}

interface Courier {
  id: number;
  telegram_user_id: string;
  name: string;
  phone_number: string;
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
  storeConfirmation?: StoreConfirmation;
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
  deliveryType?: 'ASAP' | 'SCHEDULED';
  scheduledDate?: string;
}

interface Props {
  orders: Order[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onStatusChange: (orderId: number, status: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED') => void;
  onAssignCourier: (orderId: number, courierId: number) => void;
  onRefresh: () => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  totalOrders?: number;
  token?: string;
}



const statusOptions = [
  'NEW',
  'WAITING_PAYMENT',
  'PREPARING',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
];

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  WAITING_PAYMENT: 'Ожидает оплаты',
  PREPARING: 'Готовится',
  DELIVERING: 'Доставляется',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

const confirmationStatusLabels: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  PARTIAL: 'Частично подтверждено',
  REJECTED: 'Отклонено',
};

const getConfirmationStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return '#4CAF50'; // зеленый
    case 'PARTIAL':
      return '#FF9800'; // оранжевый
    case 'REJECTED':
      return '#F44336'; // красный
    case 'PENDING':
    default:
      return '#757575'; // серый
  }
};

// Функция для отображения типа доставки
const getDeliveryTypeLabel = (deliveryType?: string, scheduledDate?: string) => {
  if (!deliveryType) return 'Не указано';
  
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
};

const AdminOrders: React.FC<Props> = ({ 
  orders, 
  loading, 
  error, 
  onBack, 
  onStatusChange, 
  onAssignCourier, 
  onRefresh, 
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  totalOrders = 0,
  token 
}) => {
  const [dialogOrder, setDialogOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [showCourierDialog, setShowCourierDialog] = useState(false);

  console.log('AdminOrders props:', { orders, loading, error });

  // Функция для загрузки курьеров
  const loadCouriers = () => {
    if (token) {
      console.log('Loading couriers with token:', token ? 'present' : 'missing');
      setCouriersLoading(true);
      apiGetCouriersList(token, { limit: 50 })
        .then(data => {
          console.log('Couriers API response:', data);
          console.log('Couriers array:', data.couriers);
          console.log('Couriers length:', data.couriers ? data.couriers.length : 'undefined');
          setCouriers(data.couriers || []);
        })
        .catch(e => {
          console.error('Error loading couriers:', e);
          console.error('Error details:', e.message);
          setCouriers([]);
        })
        .finally(() => {
          setCouriersLoading(false);
          console.log('Couriers loading finished');
        });
    }
  };

  // Загрузка списка курьеров при монтировании
  useEffect(() => {
    loadCouriers();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Управление заказами</h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          style={{ 
            background: loading ? '#ccc' : '#6BCB3D', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontSize: 14, 
            fontWeight: 600, 
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          🔄 {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>
      <div style={{ color: '#888', marginBottom: 12 }}>
        Заказы отсортированы от новых к старым. Нажмите на заказ для просмотра деталей.
        {totalOrders > 0 && (
          <div style={{ marginTop: 4, fontSize: 14 }}>
            Показано заказов: {orders.length} из {totalOrders} (страница {currentPage} из {totalPages})
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
          Debug: totalPages={totalPages}, currentPage={currentPage}, orders.length={orders.length}
        </div>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {loading ? (
        <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
      ) : (
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {orders && orders.length > 0 ? orders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(order => {
            const currentStatus = order.currentStatus || (order.statuses && order.statuses.length > 0 
              ? order.statuses[order.statuses.length - 1].status 
              : 'NEW');
            const totalAmount = order.totalAmount || (order.items && order.items.length > 0 
              ? order.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
              : 0);
            
            // Подсчет статистики подтверждений
            const confirmationStats = order.items?.reduce((stats, item) => {
              if (item.storeConfirmation) {
                stats[item.storeConfirmation.status] = (stats[item.storeConfirmation.status] || 0) + 1;
              } else {
                stats.NO_CONFIRMATION = (stats.NO_CONFIRMATION || 0) + 1;
              }
              return stats;
            }, {} as Record<string, number>) || {};
            
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
                  Курьер: {order.courier ? `${order.courier.name} (${order.courier.phone_number})` : 'Не назначен'}
                </div>
                <div style={{ fontSize: 15, color: '#888' }}>
                  Общая сумма: {totalAmount}₸ ({order.itemsCount} поз.)
                </div>
                <div style={{ fontSize: 15, color: '#6BCB3D', fontWeight: 500 }}>
                  Тип доставки: {getDeliveryTypeLabel(order.deliveryType, order.scheduledDate)}
                </div>
                
                {/* Статистика подтверждений */}
                {Object.keys(confirmationStats).length > 0 && (
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                    Подтверждения: {' '}
                    {confirmationStats.CONFIRMED && (
                      <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                        ✓{confirmationStats.CONFIRMED}
                      </span>
                    )}
                    {confirmationStats.PARTIAL && (
                      <span style={{ color: '#FF9800', fontWeight: 600, marginLeft: 8 }}>
                        ◐{confirmationStats.PARTIAL}
                      </span>
                    )}
                    {confirmationStats.REJECTED && (
                      <span style={{ color: '#F44336', fontWeight: 600, marginLeft: 8 }}>
                        ✗{confirmationStats.REJECTED}
                      </span>
                    )}
                    {confirmationStats.PENDING && (
                      <span style={{ color: '#757575', fontWeight: 600, marginLeft: 8 }}>
                        ⏳{confirmationStats.PENDING}
                      </span>
                    )}
                    {confirmationStats.NO_CONFIRMATION && (
                      <span style={{ color: '#757575', fontWeight: 600, marginLeft: 8 }}>
                        ❓{confirmationStats.NO_CONFIRMATION}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ fontWeight: 600, marginTop: 6 }}>Товары:</div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {order.items && order.items.map((item) => (
                    <li key={item.id} style={{ fontSize: 15, marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {item.product.name} — {item.quantity} шт. × {item.product.price}₸
                        </span>
                        {item.storeConfirmation && (
                          <span
                            style={{
                              fontSize: 12,
                              padding: '2px 6px',
                              borderRadius: 4,
                              color: '#fff',
                              background: getConfirmationStatusColor(item.storeConfirmation.status),
                              marginLeft: 8
                            }}
                          >
                            {confirmationStatusLabels[item.storeConfirmation.status]}
                          </span>
                        )}
                      </div>
                      {item.storeConfirmation && item.storeConfirmation.status === 'PARTIAL' && (
                        <div style={{ fontSize: 12, color: '#FF9800', marginTop: 2 }}>
                          Подтверждено: {item.storeConfirmation.confirmedQuantity} из {item.quantity} шт.
                        </div>
                      )}
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

      {/* Пагинация - временно всегда показываем для тестирования */}
      {onPageChange && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 20,
          marginBottom: 20,
          padding: '16px 0',
          borderTop: '1px solid #eee',
          background: '#f9f9f9',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 12, color: '#666', marginRight: 12 }}>
            Тест пагинации: {totalPages} страниц, текущая {currentPage}
          </div>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            style={{
              background: (currentPage <= 1 || loading) ? '#e9ecef' : '#007bff',
              color: (currentPage <= 1 || loading) ? '#6c757d' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              cursor: (currentPage <= 1 || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Предыдущая
          </button>
          
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {/* Показываем кнопки страниц */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  style={{
                    background: pageNum === currentPage ? '#6BCB3D' : '#fff',
                    color: pageNum === currentPage ? '#fff' : '#333',
                    border: `1px solid ${pageNum === currentPage ? '#6BCB3D' : '#ddd'}`,
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 14,
                    fontWeight: pageNum === currentPage ? 600 : 400,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    minWidth: 32,
                    transition: 'all 0.2s'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            style={{
              background: (currentPage >= totalPages || loading) ? '#e9ecef' : '#007bff',
              color: (currentPage >= totalPages || loading) ? '#6c757d' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
              cursor: (currentPage >= totalPages || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Следующая →
          </button>
        </div>
      )}

      {/* Дополнительная информация о пагинации */}
      {onPageChange && (
        <div style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#666',
          marginBottom: 16
        }}>
          Страница {currentPage} из {totalPages} • Всего заказов: {totalOrders}
        </div>
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
              Курьер: {dialogOrder.courier ? `${dialogOrder.courier.name} (${dialogOrder.courier.phone_number})` : 'Не назначен'}
            </div>
            <div style={{ color: '#6BCB3D', marginBottom: 8, fontWeight: 500 }}>
              Тип доставки: {getDeliveryTypeLabel(dialogOrder.deliveryType, dialogOrder.scheduledDate)}
            </div>
            {dialogOrder.courierId && (
              <div style={{ color: '#888', marginBottom: 8 }}>Курьер ID: {dialogOrder.courierId}</div>
            )}
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Товары ({dialogOrder.itemsCount} поз.):</div>
            <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 10 }}>
              {dialogOrder.items && dialogOrder.items.map((item) => (
                <li key={item.id} style={{ fontSize: 15, marginBottom: 8, border: '1px solid #e0e0e0', borderRadius: 6, padding: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {item.product.name} — {item.quantity} шт. × {item.product.price}₸ = {item.quantity * item.product.price}₸
                  </div>
                  {item.product.image && (
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Изображение: {item.product.image}</div>
                  )}
                  
                  {/* Информация о подтверждении магазином */}
                  {item.storeConfirmation ? (
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: 8, 
                      borderRadius: 4, 
                      marginTop: 6,
                      border: `1px solid ${getConfirmationStatusColor(item.storeConfirmation.status)}33`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        marginBottom: 4 
                      }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Статус магазина:</span>
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: '#fff',
                            background: getConfirmationStatusColor(item.storeConfirmation.status)
                          }}
                        >
                          {confirmationStatusLabels[item.storeConfirmation.status]}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                        Магазин: {item.storeConfirmation.store.name}
                      </div>
                      
                      {item.storeConfirmation.status !== 'PENDING' && (
                        <>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                            Подтвердил: {item.storeConfirmation.confirmedBy.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                            Дата подтверждения: {new Date(item.storeConfirmation.confirmedAt).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                            Подтверждено количество: {item.storeConfirmation.confirmedQuantity} из {item.quantity} шт.
                          </div>
                          {item.storeConfirmation.notes && (
                            <div style={{ fontSize: 12, color: '#666' }}>
                              Примечания: {item.storeConfirmation.notes}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#fff3cd', 
                      padding: 8, 
                      borderRadius: 4, 
                      marginTop: 6,
                      border: '1px solid #ffeaa7'
                    }}>
                      <span style={{ fontSize: 12, color: '#856404' }}>
                        ⚠️ Ожидает подтверждения от магазина
                      </span>
                    </div>
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
                onClick={() => { onStatusChange(dialogOrder.id, newStatus as any); setDialogOrder(null); }} 
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
            
            {/* Отладочная информация */}
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              Debug: Loading={couriersLoading ? 'true' : 'false'}, 
              Couriers count={couriers.length}, 
              Token={token ? 'present' : 'missing'}
            </div>
            
            {couriersLoading ? (
              <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Загрузка курьеров...</div>
            ) : couriers.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>
                Курьеры не найдены
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Проверьте консоль для деталей ошибки
                </div>
                <button 
                  onClick={loadCouriers}
                  style={{ 
                    marginTop: 12, 
                    background: '#6BCB3D', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '6px 12px', 
                    fontSize: 14, 
                    cursor: 'pointer' 
                  }}
                >
                  🔄 Перезагрузить
                </button>
              </div>
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
                      <div style={{ fontSize: 14, color: '#666' }}>{courier.phone_number}</div>
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
