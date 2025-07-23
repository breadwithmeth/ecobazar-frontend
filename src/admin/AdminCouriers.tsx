import React, { useState, useEffect } from 'react';
import { apiGetCouriers, apiAssignCourier, apiGetCourierStats } from '../api';

interface Courier {
  id: number;
  telegram_user_id: string;
  name: string;
  phone_number: string;
  createdAt: string;
  stats: {
    totalDelivered: number;
    activeOrders: number;
    rating: number;
    lastDelivery: string | null;
  };
}

interface AdminCouriersProps {
  token: string;
}

const AdminCouriers: React.FC<AdminCouriersProps> = ({ token }) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [courierStats, setCourierStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    courierId: '',
    orderId: ''
  });

  // Загрузка списка курьеров
  useEffect(() => {
    loadCouriers();
  }, [token]);

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const data = await apiGetCouriers(token, { limit: 50 });
      setCouriers(data.couriers);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки курьеров');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики курьера
  const loadCourierStats = async (courierId: number) => {
    try {
      setStatsLoading(true);
      const data = await apiGetCourierStats(token, courierId);
      setCourierStats(data);
      setSelectedCourier(courierId);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки статистики');
    } finally {
      setStatsLoading(false);
    }
  };

  // Назначение курьера на заказ
  const handleAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.courierId || !assignForm.orderId) {
      setError('Заполните все поля');
      return;
    }

    try {
      await apiAssignCourier(
        token, 
        parseInt(assignForm.courierId),
        parseInt(assignForm.orderId)
      );
      setAssignForm({ courierId: '', orderId: '' });
      setError('');
      alert('Курьер успешно назначен!');
      loadCouriers(); // Обновляем список
    } catch (e: any) {
      setError(e.message || 'Ошибка назначения курьера');
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Загрузка курьеров...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Управление курьерами</h2>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          {error}
        </div>
      )}

      {/* Форма назначения курьера */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <h3>Назначить курьера на заказ</h3>
        <form onSubmit={handleAssignCourier} style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              Курьер:
            </label>
            <select
              value={assignForm.courierId}
              onChange={(e) => setAssignForm(prev => ({ ...prev, courierId: e.target.value }))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14
              }}
            >
              <option value="">Выберите курьера</option>
              {couriers.map(courier => (
                <option key={courier.id} value={courier.id}>
                  {courier.name} (Активных: {courier.stats.activeOrders})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              ID заказа:
            </label>
            <input
              type="number"
              value={assignForm.orderId}
              onChange={(e) => setAssignForm(prev => ({ ...prev, orderId: e.target.value }))}
              placeholder="Номер заказа"
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
                width: 120
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Назначить
          </button>
        </form>
      </div>

      {/* Список курьеров */}
      <div style={{ display: 'grid', gap: 16 }}>
        {couriers.map(courier => (
          <div
            key={courier.id}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 18 }}>
                  {courier.name}
                </h4>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Телефон: {courier.phone_number}
                </div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Telegram ID: {courier.telegram_user_id}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Зарегистрирован: {new Date(courier.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Статистика */}
                <div style={{ textAlign: 'right', fontSize: 14 }}>
                  <div style={{ color: '#4caf50', fontWeight: 600 }}>
                    Доставлено: {courier.stats.totalDelivered}
                  </div>
                  <div style={{ color: '#ff9800' }}>
                    Активных: {courier.stats.activeOrders}
                  </div>
                  <div style={{ color: '#2196f3' }}>
                    Рейтинг: {courier.stats.rating.toFixed(1)}⭐
                  </div>
                  {courier.stats.lastDelivery && (
                    <div style={{ color: '#666', fontSize: 12 }}>
                      Последняя доставка: {new Date(courier.stats.lastDelivery).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => loadCourierStats(courier.id)}
                  style={{
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Подробная статистика
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Детальная статистика курьера */}
      {selectedCourier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Статистика курьера</h3>
              <button
                onClick={() => setSelectedCourier(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>Загрузка...</div>
            ) : courierStats ? (
              <div>
                <h4>{courierStats.courier.name}</h4>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Всего заказов:</span>
                    <strong>{courierStats.stats.totalOrders}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Доставлено:</span>
                    <strong style={{ color: '#4caf50' }}>{courierStats.stats.deliveredOrders}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Активных:</span>
                    <strong style={{ color: '#ff9800' }}>{courierStats.stats.activeOrders}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Отменено:</span>
                    <strong style={{ color: '#f44336' }}>{courierStats.stats.cancelledOrders}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Среднее время доставки:</span>
                    <strong>{courierStats.stats.averageDeliveryTime} мин</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Рейтинг:</span>
                    <strong>{courierStats.stats.rating}⭐</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Эффективность:</span>
                    <strong>{courierStats.stats.efficiency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Доставок в месяце:</span>
                    <strong>{courierStats.stats.monthlyStats.delivered}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Заработок в месяце:</span>
                    <strong>{courierStats.stats.monthlyStats.earnings}₸</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {couriers.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Курьеры не найдены
        </div>
      )}
    </div>
  );
};

export default AdminCouriers;
