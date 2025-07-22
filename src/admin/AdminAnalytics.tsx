import React, { useState, useEffect } from 'react';
import { apiGetSalesReport, apiGetSecurityStats } from '../api';

interface AdminAnalyticsProps {
  token: string;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ token }) => {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportParams, setReportParams] = useState({
    period: 'month' as 'day' | 'week' | 'month' | 'year',
    dateFrom: '',
    dateTo: ''
  });

  // Загрузка отчета по продажам
  const loadSalesReport = async () => {
    try {
      setLoading(true);
      const data = await apiGetSalesReport(token, reportParams);
      setSalesReport(data);
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
    loadSalesReport();
    loadSecurityStats();
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
        <h3>Параметры отчета по продажам</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              Период:
            </label>
            <select
              value={reportParams.period}
              onChange={(e) => setReportParams(prev => ({ 
                ...prev, 
                period: e.target.value as any 
              }))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14
              }}
            >
              <option value="day">День</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="year">Год</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              Дата начала:
            </label>
            <input
              type="date"
              value={reportParams.dateFrom}
              onChange={(e) => setReportParams(prev => ({ 
                ...prev, 
                dateFrom: e.target.value 
              }))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              Дата окончания:
            </label>
            <input
              type="date"
              value={reportParams.dateTo}
              onChange={(e) => setReportParams(prev => ({ 
                ...prev, 
                dateTo: e.target.value 
              }))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14
              }}
            />
          </div>
          <button
            onClick={loadSalesReport}
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
        {/* Отчет по продажам */}
        {salesReport && (
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 20
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>📊 Отчет по продажам</h3>
            
            {/* Основные показатели */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, marginBottom: 12 }}>Основные показатели</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Всего заказов:</span>
                  <strong style={{ color: '#2196f3' }}>{salesReport.summary.totalOrders}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Общая выручка:</span>
                  <strong style={{ color: '#4caf50' }}>
                    {formatCurrency(salesReport.summary.totalRevenue)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Средний чек:</span>
                  <strong>{formatCurrency(salesReport.summary.averageOrderValue)}</strong>
                </div>
              </div>
            </div>

            {/* Тренды */}
            {salesReport.trends && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>Тренды</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Рост заказов:</span>
                    <strong style={{ 
                      color: salesReport.trends.ordersGrowth.startsWith('+') ? '#4caf50' : '#f44336' 
                    }}>
                      {salesReport.trends.ordersGrowth}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Рост выручки:</span>
                    <strong style={{ 
                      color: salesReport.trends.revenueGrowth.startsWith('+') ? '#4caf50' : '#f44336' 
                    }}>
                      {salesReport.trends.revenueGrowth}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Топ товаров */}
            {salesReport.topProducts && salesReport.topProducts.length > 0 && (
              <div>
                <h4 style={{ fontSize: 16, marginBottom: 12 }}>Топ товаров</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {salesReport.topProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{product.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Продаж: {product.sales}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#4caf50' }}>
                          {formatCurrency(product.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
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

      {/* Дневная статистика продаж */}
      {salesReport && salesReport.dailyStats && salesReport.dailyStats.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 20,
          marginTop: 20
        }}>
          <h3 style={{ margin: '0 0 16px 0' }}>📈 Дневная динамика</h3>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                    Дата
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
                {salesReport.dailyStats.map((day: any, index: number) => (
                  <tr key={day.date}>
                    <td style={{ 
                      padding: '8px 12px', 
                      borderBottom: index < salesReport.dailyStats.length - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}>
                      {formatDate(day.date)}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      borderBottom: index < salesReport.dailyStats.length - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}>
                      {day.orders}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      borderBottom: index < salesReport.dailyStats.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontWeight: 600,
                      color: '#4caf50'
                    }}>
                      {formatCurrency(day.revenue)}
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
