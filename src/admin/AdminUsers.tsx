import React, { useState, useEffect, useCallback } from 'react';
import { apiGetAllUsers, apiChangeUserRole } from '../api';

interface User {
  id: number;
  telegram_user_id: string;
  name: string | null;
  phone_number: string | null;
  role: 'CUSTOMER' | 'COURIER' | 'ADMIN';
  _count: {
    orders: number;
    deliveredOrders: number;
  };
  stats: {
    totalOrders: number;
    deliveredOrders?: number;
    activeOrders?: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const AdminUsers: React.FC<{ onBack: () => void; token?: string }> = ({ onBack, token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  // Фильтры и поиск
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Состояние для модального окна изменения роли
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'CUSTOMER' | 'COURIER' | 'ADMIN'>('CUSTOMER');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        sortBy,
        sortOrder
      };

      const response = await apiGetAllUsers(token, params) as any;
      
      // Проверяем структуру ответа - API возвращает объект с success, data и meta
      if (response && response.success && response.data && response.meta) {
        setUsers(response.data);
        setPagination(response.meta);
      } else if (response && Array.isArray(response)) {
        // Если API вернул массив напрямую (старый формат)
        setUsers(response);
        setPagination({
          total: response.length,
          page: 1,
          limit: 20,
          totalPages: 1
        });
      } else {
        console.error('Unexpected API response structure:', response);
        setError('Ошибка загрузки пользователей: неожиданная структура ответа');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, searchTerm, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [token, loadUsers]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setIsChangingRole(true);
    setError(null); // Очищаем предыдущие ошибки
    setSuccessMessage(null); // Очищаем предыдущие успешные сообщения
    try {
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      const response = await apiChangeUserRole(token, selectedUser.id, newRole) as ApiResponse;
      
      if (response.success) {
        setSelectedUser(null);
        
        // Создаем детальное сообщение об успехе на основе ответа API
        const userData = response.data?.user;
        const oldRole = response.data?.oldRole;
        const updatedRole = response.data?.newRole;
        
        const successMsg = `✅ Роль пользователя ${userData?.name || `ID ${userData?.id}`} успешно изменена с "${getRoleName(oldRole)}" на "${getRoleName(updatedRole)}"`;
        setSuccessMessage(successMsg);
        
        // Автоматически скрываем сообщение через 5 секунд
        setTimeout(() => setSuccessMessage(null), 5000);
        
        loadUsers(); // Перезагружаем список пользователей
      } else {
        setError(response.message || 'Ошибка изменения роли');
      }
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Ошибка изменения роли');
    } finally {
      setIsChangingRole(false);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#ff6b6b';
      case 'COURIER': return '#4ecdc4';
      case 'CUSTOMER': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор';
      case 'COURIER': return 'Курьер';
      case 'CUSTOMER': return 'Клиент';
      default: return role;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button 
          onClick={onBack}
          style={{ 
            background: '#eee', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontWeight: 600, 
            cursor: 'pointer',
            marginRight: 16
          }}
        >
          ← Назад
        </button>
        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          Управление пользователями
        </h3>
      </div>

      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c00', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16,
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16,
          border: '1px solid #c3e6cb'
        }}>
          {successMessage}
        </div>
      )}

      {/* Поиск и фильтры */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 20,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'end'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
              Поиск по имени, телефону или Telegram ID
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Введите поисковый запрос..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Поиск
          </button>
        </form>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Роль
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14,
              minWidth: 120
            }}
          >
            <option value="">Все роли</option>
            <option value="ADMIN">Администраторы</option>
            <option value="COURIER">Курьеры</option>
            <option value="CUSTOMER">Клиенты</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Сортировка
          </label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14,
              minWidth: 150
            }}
          >
            <option value="id-desc">По ID (новые)</option>
            <option value="id-asc">По ID (старые)</option>
            <option value="name-asc">По имени (А-Я)</option>
            <option value="name-desc">По имени (Я-А)</option>
          </select>
        </div>
      </div>

      {/* Статистика */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          background: 'white', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #eee',
          minWidth: 150
        }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#007bff' }}>
            {pagination.total}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>Всего пользователей</div>
        </div>
      </div>

      {/* Отладочная информация */}
      <div style={{ marginBottom: 16, padding: 12, background: '#f0f0f0', borderRadius: 4, fontSize: 12 }}>
        Отладка: Loading={loading.toString()}, Users count={users.length}, Token={token ? 'есть' : 'нет'}
      </div>

      {/* Подсказка о прокрутке */}
      {users.length > 0 && (
        <div style={{ marginBottom: 16, padding: 8, background: '#e3f2fd', borderRadius: 4, fontSize: 12, color: '#1976d2' }}>
          💡 Подсказка: Если не видите все столбцы, прокрутите таблицу влево-вправо
        </div>
      )}

      {/* Таблица пользователей */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Загрузка пользователей...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Пользователи не найдены
        </div>
      ) : (
        <div style={{ 
          background: 'white', 
          borderRadius: 8, 
          border: '1px solid #eee',
          overflow: 'auto',
          maxWidth: '100%'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '60px' }}>ID</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '120px' }}>Имя</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '120px' }}>Телефон</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '100px' }}>Telegram ID</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '100px' }}>Роль</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '120px' }}>Статистика</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee', minWidth: '140px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 12, minWidth: '60px' }}>{user.id}</td>
                  <td style={{ padding: 12, fontWeight: 500, minWidth: '120px' }}>
                    {user.name || <span style={{ color: '#999', fontStyle: 'italic' }}>Не указано</span>}
                  </td>
                  <td style={{ padding: 12, minWidth: '120px' }}>
                    {user.phone_number || <span style={{ color: '#999', fontStyle: 'italic' }}>Не указано</span>}
                  </td>
                  <td style={{ padding: 12, fontFamily: 'monospace', minWidth: '100px' }}>
                    {user.telegram_user_id}
                  </td>
                  <td style={{ padding: 12, minWidth: '100px' }}>
                    <span style={{
                      background: getRoleColor(user.role),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 14, minWidth: '120px' }}>
                    <div>Заказов: {user._count.orders}</div>
                    {user.role === 'COURIER' && (
                      <>
                        <div style={{ color: '#28a745' }}>
                          Доставлено: {user._count.deliveredOrders}
                        </div>
                        <div style={{ color: '#ffc107' }}>
                          Активных: {user._count.orders - user._count.deliveredOrders}
                        </div>
                      </>
                    )}
                  </td>
                  <td style={{ padding: 12, minWidth: '140px' }}>
                    <button
                      onClick={() => openRoleModal(user)}
                      disabled={isChangingRole}
                      style={{
                        background: isChangingRole ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: isChangingRole ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        whiteSpace: 'nowrap',
                        opacity: isChangingRole ? 0.7 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {isChangingRole ? '⏳ Обновление...' : '🔄 Изменить роль'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 8, 
          marginTop: 20 
        }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{
              background: pagination.page > 1 ? '#007bff' : '#e9ecef',
              color: pagination.page > 1 ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: 4,
              padding: '8px 12px',
              cursor: pagination.page > 1 ? 'pointer' : 'default'
            }}
          >
            ← Предыдущая
          </button>
          
          <span style={{ margin: '0 16px', color: '#666' }}>
            Страница {pagination.page} из {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            style={{
              background: pagination.page < pagination.totalPages ? '#007bff' : '#e9ecef',
              color: pagination.page < pagination.totalPages ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: 4,
              padding: '8px 12px',
              cursor: pagination.page < pagination.totalPages ? 'pointer' : 'default'
            }}
          >
            Следующая →
          </button>
        </div>
      )}

      {/* Модальное окно изменения роли */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            minWidth: 400,
            maxWidth: 500
          }}>
            <h4 style={{ margin: '0 0 16px 0' }}>
              Изменить роль пользователя
            </h4>
            
            <div style={{ marginBottom: 16 }}>
              <strong>{selectedUser.name || 'Пользователь без имени'}</strong>
              <div style={{ color: '#666', fontSize: 14 }}>
                ID: {selectedUser.id} | Телефон: {selectedUser.phone_number || 'Не указан'}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>
                Telegram ID: {selectedUser.telegram_user_id}
              </div>
              <div style={{ 
                marginTop: 8, 
                padding: 8, 
                background: '#f8f9fa', 
                borderRadius: 4,
                fontSize: 14 
              }}>
                <strong>Текущая роль:</strong>{' '}
                <span style={{
                  background: getRoleColor(selectedUser.role),
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  {getRoleName(selectedUser.role)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Новая роль:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'CUSTOMER' | 'COURIER' | 'ADMIN')}
                disabled={isChangingRole}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  opacity: isChangingRole ? 0.6 : 1
                }}
              >
                <option value="CUSTOMER">Клиент</option>
                <option value="COURIER">Курьер</option>
                <option value="ADMIN">Администратор</option>
              </select>
              
              {newRole === 'ADMIN' && newRole !== selectedUser.role && (
                <div style={{
                  marginTop: 8,
                  padding: 8,
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: 4,
                  color: '#856404',
                  fontSize: 12
                }}>
                  ⚠️ Внимание: Вы назначаете роль администратора. Пользователь получит полный доступ к админ-панели.
                </div>
              )}
              
              {newRole !== selectedUser.role && (
                <div style={{
                  marginTop: 8,
                  padding: 8,
                  background: '#e3f2fd',
                  border: '1px solid #bbdefb',
                  borderRadius: 4,
                  color: '#1976d2',
                  fontSize: 12
                }}>
                  📝 Изменение роли с "{getRoleName(selectedUser.role)}" на "{getRoleName(newRole)}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedUser(null)}
                disabled={isChangingRole}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleRoleChange}
                disabled={isChangingRole || newRole === selectedUser.role}
                style={{
                  background: (isChangingRole || newRole === selectedUser.role) ? '#e9ecef' : '#007bff',
                  color: (isChangingRole || newRole === selectedUser.role) ? '#6c757d' : 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  cursor: (isChangingRole || newRole === selectedUser.role) ? 'default' : 'pointer'
                }}
              >
                {isChangingRole ? 'Изменение...' : 'Изменить роль'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
