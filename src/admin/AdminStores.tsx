import React, { useState, useEffect } from 'react';
import { apiGetStores, apiAssignStoreOwner, apiUpdateStore } from '../api';

interface StoreOwner {
  id: number;
  name: string;
  telegram_user_id: string | null;
  phone_number: string | null;
  role: string;
}

interface StoreProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

interface Store {
  id: number;
  name: string;
  address: string;
  ownerId: number | null;
  owner?: StoreOwner | null;
  products?: StoreProduct[];
  _count?: {
    products: number;
  };
}

interface Props {
  onBack: () => void;
  token: string;
}

const AdminStores: React.FC<Props> = ({ onBack, token }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [ownerIdInput, setOwnerIdInput] = useState('');
  const [assigningOwner, setAssigningOwner] = useState(false);
  
  // Состояния для редактирования магазина
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreAddress, setEditStoreAddress] = useState('');
  const [editStoreOwnerId, setEditStoreOwnerId] = useState('');
  const [updatingStore, setUpdatingStore] = useState(false);

  // Загрузка магазинов
  const loadStores = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Loading stores with token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      const response = await apiGetStores(token, page, 10, search);
      console.log('API Response:', response);
      
      if (response && response.success && response.data) {
        // Данные магазинов находятся в response.data (массив)
        setStores(response.data);
        // Метаданные находятся в response.meta
        setTotalPages(response.meta?.totalPages || 1);
        setCurrentPage(page);
      } else {
        setStores([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Ошибка загрузки магазинов:', err);
      setError('Не удалось загрузить магазины');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Назначение владельца магазина
  const handleAssignOwner = async () => {
    if (!selectedStoreId || !ownerIdInput.trim()) return;

    // Проверяем наличие токена
    if (!token || token.trim() === '') {
      alert('Ошибка: токен авторизации не найден');
      return;
    }

    try {
      setAssigningOwner(true);
      const ownerId = parseInt(ownerIdInput.trim());
      console.log('🔄 Assigning owner:', ownerId, 'to store:', selectedStoreId);
      console.log('🔐 Token available:', token ? 'YES' : 'NO');
      
      await apiAssignStoreOwner(token, selectedStoreId, ownerId);
      
      // Перезагружаем список магазинов
      await loadStores(currentPage, searchQuery);
      
      // Сбрасываем форму
      setSelectedStoreId(null);
      setOwnerIdInput('');
      alert('Владелец успешно назначен!');
      
    } catch (err) {
      console.error('Ошибка назначения владельца:', err);
      alert('Ошибка при назначении владельца: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setAssigningOwner(false);
    }
  };

  // Поиск магазинов
  const handleSearch = () => {
    setCurrentPage(1);
    loadStores(1, searchQuery);
  };

  // Открытие формы редактирования магазина
  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditStoreAddress(store.address);
    setEditStoreOwnerId(store.ownerId ? store.ownerId.toString() : '');
  };

  // Обновление информации о магазине
  const handleUpdateStore = async () => {
    if (!editingStore || !editStoreName.trim() || !editStoreAddress.trim()) {
      alert('Заполните название и адрес магазина');
      return;
    }

    if (!token || token.trim() === '') {
      alert('Ошибка: токен авторизации не найден');
      return;
    }

    try {
      setUpdatingStore(true);
      
      const updateData: { name: string; address: string; ownerId?: number } = {
        name: editStoreName.trim(),
        address: editStoreAddress.trim()
      };

      // Добавляем ownerId только если он указан
      if (editStoreOwnerId.trim()) {
        const ownerId = parseInt(editStoreOwnerId.trim());
        if (!isNaN(ownerId)) {
          updateData.ownerId = ownerId;
        }
      }

      console.log('🔄 Updating store with data:', updateData);
      
      await apiUpdateStore(token, editingStore.id, updateData);
      
      // Перезагружаем список магазинов
      await loadStores(currentPage, searchQuery);
      
      // Сбрасываем форму
      setEditingStore(null);
      setEditStoreName('');
      setEditStoreAddress('');
      setEditStoreOwnerId('');
      
      alert('Информация о магазине успешно обновлена!');
      
    } catch (err) {
      console.error('Ошибка обновления магазина:', err);
      alert('Ошибка при обновлении магазина: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setUpdatingStore(false);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    loadStores();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
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
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Управление магазинами</h2>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или адресу..."
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            style={{
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Поиск
          </button>
        </div>
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

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          color: '#888'
        }}>
          Загрузка магазинов...
        </div>
      ) : (
        <>
          {/* Список магазинов */}
          <div style={{ marginBottom: 20 }}>
            {stores.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#888',
                background: '#f8f9fa',
                borderRadius: 8
              }}>
                Магазины не найдены
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {stores.map(store => (
                  <div
                    key={store.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600, color: '#333' }}>
                          {store.name}
                        </h3>
                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: 14 }}>
                          📍 {store.address}
                        </p>
                        {store._count && (
                          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                            📦 Товаров: {store._count.products}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          ID: {store.id}
                        </span>
                      </div>
                    </div>

                    {/* Информация о владельце */}
                    {store.owner ? (
                      <div style={{
                        background: '#f0f8ff',
                        border: '1px solid #b3d9ff',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 16, marginRight: 6 }}>👤</span>
                          <strong style={{ color: '#333' }}>Владелец:</strong>
                        </div>
                        <div style={{ marginLeft: 22 }}>
                          <p style={{ margin: '2px 0', color: '#555', fontSize: 14 }}>
                            <strong>{store.owner.name}</strong> (ID: {store.owner.id})
                          </p>
                          {store.owner.phone_number && (
                            <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>
                              📞 {store.owner.phone_number}
                            </p>
                          )}
                          <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>
                            🏷️ {store.owner.role}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12
                      }}>
                        <p style={{ margin: 0, color: '#856404', fontSize: 14 }}>
                          ⚠️ Владелец не назначен
                        </p>
                      </div>
                    )}

                    {/* Список товаров */}
                    {store.products && store.products.length > 0 && (
                      <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 16, marginRight: 6 }}>📦</span>
                          <strong style={{ color: '#333' }}>Товары (показано {Math.min(store.products.length, 5)} из {store._count?.products || store.products.length}):</strong>
                        </div>
                        <div style={{ marginLeft: 22 }}>
                          {store.products.slice(0, 5).map(product => (
                            <div key={product.id} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '4px 0',
                              borderBottom: '1px solid #eee'
                            }}>
                              <span style={{ color: '#555', fontSize: 13 }}>
                                {product.name}
                              </span>
                              <span style={{ color: '#28a745', fontSize: 13, fontWeight: 500 }}>
                                {product.price}₽
                              </span>
                            </div>
                          ))}
                          {store.products.length > 5 && (
                            <div style={{ 
                              padding: '4px 0',
                              color: '#666',
                              fontSize: 12,
                              fontStyle: 'italic'
                            }}>
                              ... и еще {store.products.length - 5} товаров
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Кнопки управления магазином */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEditStore(store)}
                        style={{
                          background: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✏️ Редактировать
                      </button>
                      
                      <button
                        onClick={() => setSelectedStoreId(store.id)}
                        style={{
                          background: store.owner ? '#6c757d' : '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {store.owner ? '🔄 Изменить владельца' : '👤 Назначить владельца'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20
            }}>
              <button
                onClick={() => currentPage > 1 && loadStores(currentPage - 1, searchQuery)}
                disabled={currentPage <= 1}
                style={{
                  background: currentPage <= 1 ? '#e9ecef' : '#007bff',
                  color: currentPage <= 1 ? '#6c757d' : '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontSize: 13,
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Пред
              </button>
              
              <span style={{ fontSize: 14, color: '#666' }}>
                Страница {currentPage} из {totalPages}
              </span>
              
              <button
                onClick={() => currentPage < totalPages && loadStores(currentPage + 1, searchQuery)}
                disabled={currentPage >= totalPages}
                style={{
                  background: currentPage >= totalPages ? '#e9ecef' : '#007bff',
                  color: currentPage >= totalPages ? '#6c757d' : '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontSize: 13,
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                След →
              </button>
            </div>
          )}
        </>
      )}

      {/* Модальное окно редактирования магазина */}
      {editingStore && (
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
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>
              ✏️ Редактировать магазин
            </h3>
            
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14 }}>
              Магазин ID: {editingStore.id}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Название магазина *:
              </label>
              <input
                type="text"
                value={editStoreName}
                onChange={(e) => setEditStoreName(e.target.value)}
                placeholder="Введите название магазина"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                disabled={updatingStore}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Адрес магазина *:
              </label>
              <input
                type="text"
                value={editStoreAddress}
                onChange={(e) => setEditStoreAddress(e.target.value)}
                placeholder="Введите адрес магазина"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                disabled={updatingStore}
              />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                ID владельца (необязательно):
              </label>
              <input
                type="number"
                value={editStoreOwnerId}
                onChange={(e) => setEditStoreOwnerId(e.target.value)}
                placeholder="Введите ID владельца или оставьте пустым"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                disabled={updatingStore}
              />
              <small style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
                Оставьте пустым, чтобы не изменять владельца
              </small>
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingStore(null);
                  setEditStoreName('');
                  setEditStoreAddress('');
                  setEditStoreOwnerId('');
                }}
                disabled={updatingStore}
                style={{
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: updatingStore ? 'not-allowed' : 'pointer',
                  opacity: updatingStore ? 0.6 : 1
                }}
              >
                Отмена
              </button>
              
              <button
                onClick={handleUpdateStore}
                disabled={updatingStore || !editStoreName.trim() || !editStoreAddress.trim()}
                style={{
                  background: (updatingStore || !editStoreName.trim() || !editStoreAddress.trim()) ? '#e9ecef' : '#007bff',
                  color: (updatingStore || !editStoreName.trim() || !editStoreAddress.trim()) ? '#6c757d' : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: (updatingStore || !editStoreName.trim() || !editStoreAddress.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {updatingStore ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно назначения владельца */}
      {selectedStoreId && (
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
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
              Назначить владельца магазина
            </h3>
            
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14 }}>
              Магазин ID: {selectedStoreId}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                ID пользователя (роль SELLER):
              </label>
              <input
                type="number"
                value={ownerIdInput}
                onChange={(e) => setOwnerIdInput(e.target.value)}
                placeholder="Введите ID пользователя"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                disabled={assigningOwner}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedStoreId(null);
                  setOwnerIdInput('');
                }}
                disabled={assigningOwner}
                style={{
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: assigningOwner ? 'not-allowed' : 'pointer',
                  opacity: assigningOwner ? 0.6 : 1
                }}
              >
                Отмена
              </button>
              
              <button
                onClick={handleAssignOwner}
                disabled={assigningOwner || !ownerIdInput.trim()}
                style={{
                  background: (assigningOwner || !ownerIdInput.trim()) ? '#e9ecef' : '#28a745',
                  color: (assigningOwner || !ownerIdInput.trim()) ? '#6c757d' : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: (assigningOwner || !ownerIdInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {assigningOwner ? 'Назначение...' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStores;
