import { useEffect, useState } from "react";
import { apiGetUser, apiGetStores, apiAssignStoreOwner } from '../api';

interface Store {
  id: number;
  name: string;
  address: string;
  description: string | null;
  ownerId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  phone_number: string | null;
  role: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: number;
  userId: number;
  address: string;
  createdAt: string;
  totalAmount: number;
  currentStatus: string;
  deliveryType?: 'ASAP' | 'SCHEDULED';
  scheduledDate?: string;
  items: OrderItem[];
  user: {
    id: number;
    name: string;
    phone_number: string;
  };
}

// Функция для отображения статуса заказа на русском для продавца
function sellerStatusLabel(status: string) {
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

// Функция для отображения типа доставки для продавца
function sellerDeliveryTypeLabel(deliveryType?: string, scheduledDate?: string) {
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

interface SellerPageProps {
  onBack: () => void;
  token: string;
}

const SellerPage: React.FC<SellerPageProps> = ({ onBack, token }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningStore, setAssigningStore] = useState<number | null>(null);
  
  // Состояния для заказов
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState<'stores' | 'orders'>('stores');

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем информацию о текущем пользователе
      const userResponse = await apiGetUser(token);
      if (userResponse.success && userResponse.data) {
        setCurrentUser(userResponse.data);
      }

      // Получаем список всех магазинов (функция нужна в api.ts)
      // const storesResponse = await apiGetStores(token);
      // if (storesResponse.success && storesResponse.data) {
      //   setStores(storesResponse.data);
      // }
      
    } catch (err) {
      console.error('Ошибка загрузки данных продавца:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      
      // TODO: Добавить API для получения заказов продавца
      // const ordersResponse = await apiGetSellerOrders(token);
      // if (ordersResponse.success) {
      //   setOrders(ordersResponse.data);
      // }
      
      // Заглушка для демонстрации интерфейса
      setOrders([]);
      
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
      setError('Не удалось загрузить заказы');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAssignStore = async (storeId: number) => {
    if (!currentUser) return;
    
    try {
      setAssigningStore(storeId);
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен не найден');
      }
      
      const response = await apiAssignStoreOwner(token, storeId, currentUser.id);
      
      // Обновляем список магазинов
      await loadData();
      alert('Магазин успешно назначен!');
      
    } catch (err) {
      console.error('Ошибка назначения магазина:', err);
      alert('Ошибка при назначении магазина: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setAssigningStore(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #ffffff30',
          borderTop: '4px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: 420,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1px solid #eee'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              marginRight: 12
            }}
          >
            ←
          </button>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: '#333'
          }}>
            🏪 Панель продавца
          </h1>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#c00'
          }}>
            {error}
          </div>
        )}

        {/* Информация о пользователе */}
        {currentUser && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Информация о продавце</h3>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Имя:</strong> {currentUser.name}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Телефон:</strong> {currentUser.phone_number || 'Не указан'}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Роль:</strong> {currentUser.role}
            </p>
          </div>
        )}

        {/* Табы для навигации */}
        <div style={{
          display: 'flex',
          marginBottom: 20,
          borderBottom: '1px solid #eee'
        }}>
          <button
            onClick={() => setCurrentTab('stores')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: currentTab === 'stores' ? '2px solid #673AB7' : '2px solid transparent',
              color: currentTab === 'stores' ? '#673AB7' : '#666',
              fontWeight: currentTab === 'stores' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏪 Магазины
          </button>
          <button
            onClick={() => {
              setCurrentTab('orders');
              if (orders.length === 0) {
                loadOrders();
              }
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: currentTab === 'orders' ? '2px solid #673AB7' : '2px solid transparent',
              color: currentTab === 'orders' ? '#673AB7' : '#666',
              fontWeight: currentTab === 'orders' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📦 Заказы
          </button>
        </div>

        {/* Контент табов */}
        {currentTab === 'stores' ? (
          /* Управление магазинами */
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Управление магазинами</h3>
            
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ margin: 0, color: '#856404' }}>
                <strong>Примечание:</strong> Функция получения списка магазинов будет добавлена в API.
                Сейчас доступно только назначение магазина через ID.
              </p>
            </div>

            {/* Форма для назначения магазина по ID (для тестирования) */}
            <div style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Назначить магазин (тест)</h4>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                Для тестирования можно назначить магазин с ID=2
              </p>
              <button
                onClick={() => handleAssignStore(2)}
                disabled={assigningStore === 2}
                style={{
                  background: assigningStore === 2 ? '#ccc' : '#673AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: assigningStore === 2 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {assigningStore === 2 ? 'Назначение...' : 'Назначить магазин ID=2'}
              </button>
            </div>
          </div>
        ) : (
          /* Управление заказами */
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Заказы магазина</h3>
            
            {ordersLoading ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#666'
              }}>
                <div style={{ marginBottom: 16, fontSize: 18 }}>⏳</div>
                <div>Загрузка заказов...</div>
              </div>
            ) : orders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#666',
                background: '#f8f9fa',
                borderRadius: 8
              }}>
                <div style={{ marginBottom: 16, fontSize: 32 }}>📦</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Заказов нет</div>
                <div style={{ fontSize: 14 }}>
                  У вас пока нет заказов для обработки
                </div>
              </div>
            ) : (
              <div>
                {orders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                          Заказ #{order.id}
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: order.currentStatus === 'NEW' ? '#e3f2fd' : 
                                   order.currentStatus === 'PREPARING' ? '#fff3e0' : '#f1f8e9',
                        color: order.currentStatus === 'NEW' ? '#1976d2' : 
                               order.currentStatus === 'PREPARING' ? '#f57c00' : '#388e3c'
                      }}>
                        {sellerStatusLabel(order.currentStatus)}
                      </div>
                    </div>

                    <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                      Клиент: {order.user.name} • {order.totalAmount}₸
                    </div>

                    {/* Тип доставки */}
                    {order.deliveryType && (
                      <div style={{ 
                        fontSize: 13, 
                        color: '#673AB7', 
                        fontWeight: 600,
                        marginBottom: 8
                      }}>
                        {sellerDeliveryTypeLabel(order.deliveryType, order.scheduledDate)}
                      </div>
                    )}

                    <div style={{ fontSize: 14, color: '#666' }}>
                      Товаров: {order.items.length} шт.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                borderRadius: 16,
                padding: 24,
                maxWidth: 400,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>
                Заказ #{selectedOrder.id}
              </h2>

              <div style={{ marginBottom: 16 }}>
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
                  <strong>Статус:</strong> {sellerStatusLabel(selectedOrder.currentStatus)}
                </div>
                {selectedOrder.deliveryType && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Тип доставки:</strong> <span style={{ color: '#673AB7', fontWeight: 600 }}>
                      {sellerDeliveryTypeLabel(selectedOrder.deliveryType, selectedOrder.scheduledDate)}
                    </span>
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
                    borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {item.quantity} × {item.product.price}₸
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#673AB7' }}>
                      {item.quantity * item.product.price}₸
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 0',
                borderTop: '2px solid #eee',
                fontWeight: 600,
                fontSize: 18
              }}>
                <span>Общая сумма:</span>
                <span style={{ color: '#673AB7' }}>{selectedOrder.totalAmount}₸</span>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: '100%',
                  background: '#673AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPage;
