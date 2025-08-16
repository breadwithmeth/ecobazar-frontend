import React, { useState, useEffect } from 'react';
import { apiGetAdminOrderReport, apiGetSecurityStats } from '../api';

interface AdminAnalyticsProps {
  token: string;
}

type GroupBy = 'day' | 'month';
type OrderStatus = 'NEW' | 'WAITING_PAYMENT' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
type DeliveryType = 'ASAP' | 'SCHEDULED';

interface AdminOrdersReportTotals {
  orders: number;
  revenue: number;
  items: number;
  aov: number; // average order value
}

interface AdminOrdersReport {
  range?: { from: string; to: string };
  filters?: { groupBy?: GroupBy };
  totals: AdminOrdersReportTotals;
  byStatus?: Array<{ status: OrderStatus; count: number; revenue?: number }>;
  byStore?: Array<{ storeId: number; storeName?: string; orders: number; items?: number; revenue: number }>;
  byCourier?: Array<{ courierId: number | null; courierName?: string; orders: number; revenue: number }>;
  daily?: Array<{ date: string; orders: number; revenue: number; items?: number }>; // date = YYYY-MM-DD или YYYY-MM
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ token }) => {
  const [ordersReport, setOrdersReport] = useState<AdminOrdersReport | null>(null);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Вычисляем дефолтные даты (последние 30 дней)
  const now = new Date();
  const toDefault = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fromDefault = new Date(toDefault.getTime() - 29 * 24 * 60 * 60 * 1000); // включая сегодняшний день

  const [reportParams, setReportParams] = useState({
    fromDate: fromDefault.toISOString().slice(0, 10), // YYYY-MM-DD
    toDate: toDefault.toISOString().slice(0, 10),
    storeId: '' as string,
    courierId: '' as string,
    status: '' as '' | OrderStatus,
    deliveryType: '' as '' | DeliveryType,
    groupBy: 'day' as GroupBy,
  });

  // Загрузка отчета по заказам (новый эндпоинт)
  const loadOrdersReport = async () => {
    try {
      setLoading(true);
      // Преобразуем даты UI в ISO (00:00 и 23:59:59.999)
      const fromIso = new Date(`${reportParams.fromDate}T00:00:00.000Z`).toISOString();
      const toIso = new Date(`${reportParams.toDate}T23:59:59.999Z`).toISOString();
      const data = await apiGetAdminOrderReport(token, {
        from: fromIso,
        to: toIso,
        groupBy: reportParams.groupBy,
        storeId: reportParams.storeId ? Number(reportParams.storeId) : undefined,
        courierId: reportParams.courierId ? Number(reportParams.courierId) : undefined,
        status: reportParams.status || undefined,
        deliveryType: reportParams.deliveryType || undefined,
      });
  setOrdersReport(data as AdminOrdersReport);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики безопасности
  const loadSecurityStats = async () => {
    try {
      const data = await apiGetSecurityStats(token);
      setSecurityStats(data);
    } catch (e: any) {
      console.error('Ошибка загрузки статистики безопасности:', e);
    }
  };

  useEffect(() => {
    loadOrdersReport();
    loadSecurityStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatPeriodLabel = (value: string) => {
    // value: YYYY-MM-DD (day) или YYYY-MM (month)
    if (reportParams.groupBy === 'day') return formatDate(value);
    try {
      const d = new Date(value + '-01T00:00:00Z');
      return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    } catch {
      return value;
    }
  };

  return (
    <div style={{ padding: 20 }}>
  <h2>Аналитика и отчеты</h2>

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

      {/* Параметры отчета */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <h3>Параметры отчета по заказам</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Дата начала:</label>
            <input
              type="date"
              value={reportParams.fromDate}
              onChange={(e) => setReportParams(prev => ({ ...prev, fromDate: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Дата окончания:</label>
            <input
              type="date"
              value={reportParams.toDate}
              onChange={(e) => setReportParams(prev => ({ ...prev, toDate: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>groupBy:</label>
            <select
              value={reportParams.groupBy}
              onChange={(e) => setReportParams(prev => ({ ...prev, groupBy: e.target.value as GroupBy }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
            >
              <option value="day">day</option>
              <option value="month">month</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>storeId:</label>
            <input
              type="number"
              placeholder="например 5"
              value={reportParams.storeId}
              onChange={(e) => setReportParams(prev => ({ ...prev, storeId: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, width: 120 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>courierId:</label>
            <input
              type="number"
              placeholder="например 12"
              value={reportParams.courierId}
              onChange={(e) => setReportParams(prev => ({ ...prev, courierId: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, width: 120 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>status:</label>
            <select
              value={reportParams.status}
              onChange={(e) => setReportParams(prev => ({ ...prev, status: e.target.value as any }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
            >
              <option value="">Все</option>
              <option value="NEW">NEW</option>
              <option value="WAITING_PAYMENT">WAITING_PAYMENT</option>
              <option value="PREPARING">PREPARING</option>
              <option value="DELIVERING">DELIVERING</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>deliveryType:</label>
            <select
              value={reportParams.deliveryType}
              onChange={(e) => setReportParams(prev => ({ ...prev, deliveryType: e.target.value as any }))}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
            >
              <option value="">Все</option>
              <option value="ASAP">ASAP</option>
              <option value="SCHEDULED">SCHEDULED</option>
            </select>
          </div>
          <button
            onClick={loadOrdersReport}
            disabled={loading}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {loading ? 'Загрузка...' : 'Обновить отчет'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Отчет по заказам */}
        {ordersReport && (
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 20
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>📊 Отчет по заказам</h3>
            
            {/* Основные показатели */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, marginBottom: 12 }}>Основные показатели</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Всего заказов:</span>
                  <strong style={{ color: '#2196f3' }}>{ordersReport.totals?.orders ?? 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Общая выручка:</span>
                  <strong style={{ color: '#4caf50' }}>
                    {formatCurrency(ordersReport.totals?.revenue ?? 0)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Средний чек:</span>
                  <strong>{formatCurrency(ordersReport.totals?.aov ?? 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Товарных позиций всего:</span>
                  <strong>{ordersReport.totals?.items ?? 0}</strong>
                </div>
              </div>
            </div>

            {/* Разбивка по статусам */}
            {ordersReport.byStatus && ordersReport.byStatus.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>По статусам</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ordersReport.byStatus.map((row, idx) => (
                    <div key={row.status + idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx < (ordersReport.byStatus?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none', padding: '6px 0' }}>
                      <span style={{ fontSize: 14 }}>{row.status}</span>
                      <span style={{ fontWeight: 600 }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Разбивка по магазинам */}
            {ordersReport.byStore && ordersReport.byStore.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>По магазинам</h4>
                <div style={{ maxHeight: 220, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Магазин</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Заказы</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Товары</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Выручка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersReport.byStore.map((s, idx) => (
                        <tr key={s.storeId}>
                          <td style={{ padding: '8px 12px', borderBottom: idx < ordersReport.byStore!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{s.storeName || `Store #${s.storeId}`}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: idx < ordersReport.byStore!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{s.orders}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: idx < ordersReport.byStore!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{s.items ?? 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: idx < ordersReport.byStore!.length - 1 ? '1px solid #f0f0f0' : 'none', fontWeight: 600, color: '#4caf50' }}>{formatCurrency(s.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Разбивка по курьерам */}
            {ordersReport.byCourier && ordersReport.byCourier.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>По курьерам</h4>
                <div style={{ maxHeight: 220, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Курьер</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Заказы</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Выручка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersReport.byCourier.map((c, idx) => (
                        <tr key={c.courierId}>
                          <td style={{ padding: '8px 12px', borderBottom: idx < ordersReport.byCourier!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{c.courierName || `Courier #${c.courierId}`}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: idx < ordersReport.byCourier!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>{c.orders}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: idx < ordersReport.byCourier!.length - 1 ? '1px solid #f0f0f0' : 'none', fontWeight: 600, color: '#4caf50' }}>{formatCurrency(c.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Статистика безопасности */}
        {securityStats && (
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 20
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>🔒 Безопасность системы</h3>

            {/* Общая информация */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: securityStats.summary.securityLevel === 'NORMAL' ? '#e8f5e8' : '#fff3cd'
              }}>
                <span>Уровень безопасности:</span>
                <strong style={{ 
                  color: securityStats.summary.securityLevel === 'NORMAL' ? '#4caf50' : '#ff9800' 
                }}>
                  {securityStats.summary.securityLevel === 'NORMAL' ? 'Нормальный' : 'Повышенный'}
                </strong>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Всего угроз:</span>
                  <strong style={{ color: '#f44336' }}>{securityStats.summary.totalThreats}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Активных блокировок:</span>
                  <strong>{securityStats.summary.activeBans}</strong>
                </div>
              </div>
            </div>

            {/* Нарушения лимитов */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, marginBottom: 12 }}>Rate Limit нарушения</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>За 24 часа:</span>
                  <strong>{securityStats.rateLimitViolations.last24h}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>За час:</span>
                  <strong>{securityStats.rateLimitViolations.lastHour}</strong>
                </div>
              </div>
            </div>

            {/* Блокированные IP */}
            {securityStats.blockedIPs && securityStats.blockedIPs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>Заблокированные IP</h4>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                  {securityStats.blockedIPs.map((blocked: any, index: number) => (
                    <div key={index} style={{ 
                      fontSize: 12, 
                      padding: '6px 8px',
                      background: '#ffebee',
                      marginBottom: 4,
                      borderRadius: 4
                    }}>
                      <div style={{ fontWeight: 600 }}>{blocked.ip}</div>
                      <div style={{ color: '#666' }}>{blocked.reason}</div>
                      <div style={{ color: '#666' }}>
                        {formatDate(blocked.blockedAt)} • {blocked.attempts} попыток
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Подозрительная активность */}
            {securityStats.suspiciousActivity && securityStats.suspiciousActivity.length > 0 && (
              <div>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>Подозрительная активность</h4>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                  {securityStats.suspiciousActivity.slice(0, 3).map((activity: any, index: number) => (
                    <div key={index} style={{ 
                      fontSize: 12, 
                      padding: '6px 8px',
                      background: activity.severity === 'HIGH' ? '#ffebee' : '#fff3cd',
                      marginBottom: 4,
                      borderRadius: 4
                    }}>
                      <div style={{ fontWeight: 600 }}>{activity.ip}</div>
                      <div style={{ color: '#666' }}>{activity.reason}</div>
                      <div style={{ color: '#666' }}>
                        {formatDate(activity.timestamp)} • {activity.endpoint}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    {/* Динамика по периодам */}
    {ordersReport && ordersReport.daily && ordersReport.daily.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 20,
          marginTop: 20
        }}>
      <h3 style={{ margin: '0 0 16px 0' }}>📈 Динамика ({reportParams.groupBy})</h3>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
          Период
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    Заказы
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    Выручка
                  </th>
                </tr>
              </thead>
              <tbody>
        {ordersReport.daily.map((row, index: number) => (
          <tr key={row.date}>
                    <td style={{ 
                      padding: '8px 12px', 
            borderBottom: index < ordersReport.daily!.length - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}>
            {formatPeriodLabel(row.date)}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
            borderBottom: index < ordersReport.daily!.length - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}>
            {row.orders}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
            borderBottom: index < ordersReport.daily!.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontWeight: 600,
                      color: '#4caf50'
                    }}>
            {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
