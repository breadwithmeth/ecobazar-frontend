import { useEffect, useState } from "react";
import { apiGetCourierOrders, apiUpdateOrderStatusByCourier } from '../api';

interface CourierOrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
}

interface CourierOrderStatus {
  id: number;
  status: string;
  createdAt: string;
}

interface CourierUser {
  id: number;
  name: string;
  phone_number: string;
}

interface CourierOrder {
  id: number;
  address: string;
  user: CourierUser;
  items: CourierOrderItem[];
  statuses: CourierOrderStatus[];
  currentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  deliveryType?: 'ASAP' | 'SCHEDULED';
  scheduledDate?: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Отображение статуса заказа на русском для курьера
function courierStatusLabel(status: string) {
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

// Функция для отображения типа доставки для курьера
function courierDeliveryTypeLabel(deliveryType?: string, scheduledDate?: string) {
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

const CourierPage: React.FC<{ 
  token: string; 
  onBack: () => void;
}> = ({ token, onBack }) => {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED' | ''>('');
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadOrders = async (page = 1, status?: 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED') => {
    setLoading(true);
    try {
      const response = await apiGetCourierOrders(token, page, 10, status);
      setOrders(response.orders || []);
      setMeta(response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 });
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1, statusFilter || undefined);
  }, [token, statusFilter]);

  const handleStatusUpdate = async (orderId: number, newStatus: 'DELIVERING' | 'DELIVERED' | 'CANCELLED') => {
    if (updatingOrderId) return; // Предотвращаем множественные клики
    
    setUpdatingOrderId(orderId);
    try {
      await apiUpdateOrderStatusByCourier(token, orderId, newStatus);
      // Обновляем список заказов
      await loadOrders(meta.page, statusFilter || undefined);
      setSelectedOrder(null);
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Обратная совместимость
  const handleDelivered = (orderId: number) => handleStatusUpdate(orderId, 'DELIVERED');

  const activeOrders = orders.filter(order => 
    order.currentStatus === 'DELIVERING' || order.currentStatus === 'WAITING_PAYMENT' || order.currentStatus === 'PREPARING'
  );
  const completedOrders = orders.filter(order => 
    order.currentStatus === 'DELIVERED' || order.currentStatus === 'CANCELLED'
  );

  return (
    <div style={{ background: '#f7f7f7', minHeight: '100vh', padding: '20px 16px' }}>
      {/* Модальное окно с деталями заказа */}
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
                <strong>Статус:</strong> {courierStatusLabel(selectedOrder.currentStatus)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Клиент:</strong> {selectedOrder.user.name}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Телефон:</strong> {selectedOrder.user.phone_number}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Адрес доставки:</strong> {selectedOrder.address}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Дата создания:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {selectedOrder.deliveryType && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Тип доставки:</strong> <span style={{ color: '#6BCB3D', fontWeight: 600 }}>
                    {courierDeliveryTypeLabel(selectedOrder.deliveryType, selectedOrder.scheduledDate)}
                  </span>
                </div>
              )}
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
                    {item.price * item.quantity}₸
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              borderTop: '1px solid #f0f0f0', 
              paddingTop: 16, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <strong style={{ fontSize: 18 }}>Итого:</strong>
              <strong style={{ fontSize: 18, color: '#6BCB3D' }}>{selectedOrder.totalAmount}₸</strong>
            </div>

            {/* Кнопки действий в зависимости от статуса */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {selectedOrder.currentStatus === 'WAITING_PAYMENT' && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERING')}
                  disabled={updatingOrderId === selectedOrder.id}
                  style={{
                    flex: 1,
                    background: updatingOrderId === selectedOrder.id ? '#ccc' : '#FF9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: updatingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatingOrderId === selectedOrder.id ? 'Обновление...' : '🚚 Начать доставку'}
                </button>
              )}
              
              {selectedOrder.currentStatus === 'PREPARING' && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERING')}
                  disabled={updatingOrderId === selectedOrder.id}
                  style={{
                    flex: 1,
                    background: updatingOrderId === selectedOrder.id ? '#ccc' : '#FF9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: updatingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatingOrderId === selectedOrder.id ? 'Обновление...' : '🚚 Начать доставку'}
                </button>
              )}
              
              {selectedOrder.currentStatus === 'DELIVERING' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                    disabled={updatingOrderId === selectedOrder.id}
                    style={{
                      flex: 1,
                      background: updatingOrderId === selectedOrder.id ? '#ccc' : '#6BCB3D',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: updatingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updatingOrderId === selectedOrder.id ? 'Обновление...' : '✅ Доставлен'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                    disabled={updatingOrderId === selectedOrder.id}
                    style={{
                      flex: 1,
                      background: updatingOrderId === selectedOrder.id ? '#ccc' : '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: updatingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updatingOrderId === selectedOrder.id ? 'Обновление...' : '❌ Отменить'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 24, 
              cursor: 'pointer', 
              marginRight: 12,
              color: '#6BCB3D'
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#222' }}>
            🚚 Панель курьера
          </h1>
        </div>

        {/* Фильтры статуса */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 20, 
          overflowX: 'auto',
          paddingBottom: 8 
        }}>
          {[
            { value: '', label: 'Все заказы' },
            { value: 'NEW', label: 'Новые' },
            { value: 'WAITING_PAYMENT', label: 'Ожидают оплаты' },
            { value: 'PREPARING', label: 'Готовятся' },
            { value: 'DELIVERING', label: 'Доставляются' },
            { value: 'DELIVERED', label: 'Доставлены' },
            { value: 'CANCELLED', label: 'Отменённые' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              style={{
                background: statusFilter === filter.value ? '#6BCB3D' : '#fff',
                color: statusFilter === filter.value ? '#fff' : '#222',
                border: '1px solid #e0e0e0',
                borderRadius: 16,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Статистика */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 12, 
          marginBottom: 20 
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 24, color: '#FF9800', marginBottom: 4 }}>📦</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>{activeOrders.length}</div>
            <div style={{ fontSize: 14, color: '#888' }}>Активных</div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 24, color: '#4CAF50', marginBottom: 4 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>{completedOrders.length}</div>
            <div style={{ fontSize: 14, color: '#888' }}>Доставлено</div>
          </div>
        </div>

        {/* Список заказов */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <div style={{ marginBottom: 16, fontSize: 18 }}>⏳</div>
            <div>Загрузка заказов...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#f44336' }}>
            <div style={{ marginBottom: 16, fontSize: 18 }}>❌</div>
            <div>{error}</div>
            <button
              onClick={() => loadOrders(meta.page, statusFilter || undefined)}
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
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <div style={{ marginBottom: 16, fontSize: 32 }}>📭</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Заказов нет</div>
            <div style={{ fontSize: 14, color: '#888' }}>
              {statusFilter ? `Нет заказов со статусом "${courierStatusLabel(statusFilter)}"` : 'У вас пока нет назначенных заказов'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: order.currentStatus === 'DELIVERING' ? '2px solid #FF9800' : '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 4 }}>
                      Заказ #{order.id}
                    </div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                      👤 {order.user.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                      📞 {order.user.phone_number}
                    </div>
                  </div>
                  <div style={{
                    background: order.currentStatus === 'DELIVERING' ? '#FF9800' : 
                               order.currentStatus === 'DELIVERED' ? '#4CAF50' : 
                               order.currentStatus === 'PREPARING' ? '#2196F3' : '#f7f7f7',
                    color: order.currentStatus === 'DELIVERING' || order.currentStatus === 'DELIVERED' || order.currentStatus === 'PREPARING' ? '#fff' : '#222',
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {courierStatusLabel(order.currentStatus)}
                  </div>
                </div>

                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  📍 {order.address}
                </div>

                <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                  Товаров: {order.items.length} • {order.totalAmount}₸
                </div>

                {/* Тип доставки */}
                {order.deliveryType && (
                  <div style={{ 
                    fontSize: 13, 
                    color: '#6BCB3D', 
                    fontWeight: 600, 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {courierDeliveryTypeLabel(order.deliveryType, order.scheduledDate)}
                  </div>
                )}

                {order.currentStatus === 'DELIVERING' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelivered(order.id);
                    }}
                    disabled={updatingOrderId === order.id}
                    style={{
                      width: '100%',
                      background: updatingOrderId === order.id ? '#ccc' : '#6BCB3D',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updatingOrderId === order.id ? 'Обновление...' : '✅ Отметить как доставленный'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {meta.totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 12, 
            marginTop: 20,
            padding: 16,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <button
              onClick={() => loadOrders(meta.page - 1, statusFilter || undefined)}
              disabled={meta.page <= 1}
              style={{
                background: meta.page <= 1 ? '#f5f5f5' : '#6BCB3D',
                color: meta.page <= 1 ? '#999' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ←
            </button>
            <span style={{ fontSize: 14, color: '#666' }}>
              Страница {meta.page} из {meta.totalPages}
            </span>
            <button
              onClick={() => loadOrders(meta.page + 1, statusFilter || undefined)}
              disabled={meta.page >= meta.totalPages}
              style={{
                background: meta.page >= meta.totalPages ? '#f5f5f5' : '#6BCB3D',
                color: meta.page >= meta.totalPages ? '#999' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourierPage;
