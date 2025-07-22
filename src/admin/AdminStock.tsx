import React, { useState, useEffect } from 'react';
import { apiGetProducts, apiUpdateStock, apiGetStockHistory, apiGetProductStock } from '../api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  inStock: boolean;
  store?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

interface StockOperation {
  id: number;
  productId: number;
  quantity: number;
  type: 'INCOME' | 'OUTCOME' | 'CORRECTION';
  comment?: string;
  updatedAt: string;
  currentStock: number;
  product?: {
    id: number;
    name: string;
  };
}

interface Props {
  token: string;
  onBack: () => void;
}

const AdminStock: React.FC<Props> = ({ token, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockHistory, setStockHistory] = useState<StockOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Состояние для операций со складом
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [operationType, setOperationType] = useState<'INCOME' | 'OUTCOME' | 'CORRECTION'>('INCOME');
  const [quantity, setQuantity] = useState('');
  const [comment, setComment] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState('');
  
  // Состояние для фильтров
  const [selectedProductFilter, setSelectedProductFilter] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [token]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetProducts(token);
      const productsArray = Array.isArray(data) ? data : (data?.products || []);
      setProducts(productsArray);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const loadStockHistory = async (productId?: number) => {
    setHistoryLoading(true);
    try {
      const data = await apiGetStockHistory(token, productId);
      const historyArray = Array.isArray(data) ? data : ((data as any)?.history || []);
      setStockHistory(historyArray);
    } catch (err: any) {
      console.error('Error loading stock history:', err);
      setError(err.message || 'Ошибка загрузки истории операций');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStockOperation = async () => {
    if (!selectedProduct || !quantity.trim()) {
      setOperationError('Выберите товар и введите количество');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setOperationError('Введите корректное количество');
      return;
    }

    setOperationLoading(true);
    setOperationError('');
    try {
      const result = await apiUpdateStock(token, selectedProduct.id, {
        quantity: qty,
        type: operationType,
        comment: comment.trim() || undefined
      }) as any;

      // Обновляем текущий товар в списке
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, stock: result.currentStock || result.data?.currentStock || 0, inStock: (result.currentStock || result.data?.currentStock || 0) > 0 }
          : p
      ));

      // Сброс формы
      setSelectedProduct(null);
      setQuantity('');
      setComment('');
      setOperationType('INCOME');

      // Обновляем историю если она открыта
      if (showHistory) {
        loadStockHistory(selectedProductFilter || undefined);
      }

      const currentStock = result.currentStock || result.data?.currentStock || 0;
      alert(`Операция выполнена! Текущий остаток: ${currentStock}`);
    } catch (err: any) {
      setOperationError(err.message || 'Ошибка выполнения операции');
    } finally {
      setOperationLoading(false);
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'INCOME': return 'Поступление';
      case 'OUTCOME': return 'Расход';
      case 'CORRECTION': return 'Корректировка';
      default: return type;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'INCOME': return '#4CAF50';
      case 'OUTCOME': return '#f44336';
      case 'CORRECTION': return '#FF9800';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Загрузка товаров...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <button 
        onClick={onBack}
        style={{
          background: '#eee',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 20
        }}
      >
        ← Назад
      </button>

      <h2 style={{ marginBottom: 20 }}>📊 Управление складом</h2>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 20 
        }}>
          {error}
        </div>
      )}

      {/* Переключатель между операциями и историей */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setShowHistory(false)}
          style={{
            background: !showHistory ? '#2196F3' : '#eee',
            color: !showHistory ? '#fff' : '#666',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Операции со складом
        </button>
        
        <button
          onClick={() => {
            setShowHistory(true);
            loadStockHistory();
          }}
          style={{
            background: showHistory ? '#2196F3' : '#eee',
            color: showHistory ? '#fff' : '#666',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          История операций
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Форма операций со складом */}
          <div style={{ 
            background: '#f5f5f5', 
            padding: 20, 
            borderRadius: 12, 
            marginBottom: 20 
          }}>
            <h3>Новая операция</h3>
            
            {operationError && (
              <div style={{ 
                background: '#ffebee', 
                color: '#c62828', 
                padding: 8, 
                borderRadius: 6, 
                marginBottom: 12 
              }}>
                {operationError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const productId = parseInt(e.target.value);
                  const product = products.find(p => p.id === productId) || null;
                  setSelectedProduct(product);
                }}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="">Выберите товар</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (остаток: {product.stock})
                  </option>
                ))}
              </select>

              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as 'INCOME' | 'OUTCOME' | 'CORRECTION')}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="INCOME">📈 Поступление товара</option>
                <option value="OUTCOME">📉 Расход товара</option>
                <option value="CORRECTION">⚖️ Корректировка остатков</option>
              </select>

              <input
                type="number"
                placeholder="Количество"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                min="1"
              />

              <textarea
                placeholder="Комментарий (необязательно)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleStockOperation}
              disabled={operationLoading || !selectedProduct || !quantity}
              style={{
                background: operationLoading ? '#ccc' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontWeight: 600,
                cursor: operationLoading ? 'wait' : 'pointer',
                opacity: (!selectedProduct || !quantity) ? 0.6 : 1
              }}
            >
              {operationLoading ? 'Выполнение...' : 'Выполнить операцию'}
            </button>
          </div>

          {/* Таблица товаров с остатками */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: 16, background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              Остатки товаров
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Товар</th>
                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Магазин</th>
                    <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Остаток</th>
                    <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Статус</th>
                    <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                        {product.category && (
                          <div style={{ fontSize: 12, color: '#666' }}>{product.category.name}</div>
                        )}
                      </td>
                      <td style={{ padding: 12, color: '#666' }}>
                        {product.store?.name || 'Неизвестно'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>
                        {product.stock}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <span style={{
                          background: product.inStock ? '#e8f5e8' : '#ffebee',
                          color: product.inStock ? '#4CAF50' : '#f44336',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {product.inStock ? 'В наличии' : 'Нет в наличии'}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>
                        {product.price}₸
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* История операций */}
          <div style={{ marginBottom: 20 }}>
            <select
              value={selectedProductFilter || ''}
              onChange={(e) => {
                const productId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedProductFilter(productId);
                loadStockHistory(productId || undefined);
              }}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Все товары</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: 16, background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              История операций
            </h3>
            
            {historyLoading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>Загрузка истории...</div>
            ) : stockHistory.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                История операций пуста
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Дата</th>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Товар</th>
                      <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Операция</th>
                      <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Количество</th>
                      <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Остаток</th>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map(operation => (
                      <tr key={operation.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 12, fontSize: 12, color: '#666' }}>
                          {new Date(operation.updatedAt).toLocaleString('ru-RU')}
                        </td>
                        <td style={{ padding: 12 }}>
                          {operation.product?.name || `ID: ${operation.productId}`}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{
                            background: getOperationColor(operation.type) + '20',
                            color: getOperationColor(operation.type),
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500
                          }}>
                            {getOperationTypeText(operation.type)}
                          </span>
                        </td>
                        <td style={{ 
                          padding: 12, 
                          textAlign: 'center', 
                          fontWeight: 600,
                          color: operation.type === 'OUTCOME' ? '#f44336' : '#4CAF50'
                        }}>
                          {operation.type === 'OUTCOME' ? '-' : '+'}{operation.quantity}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>
                          {operation.currentStock}
                        </td>
                        <td style={{ padding: 12, fontSize: 14, color: '#666' }}>
                          {operation.comment || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {products.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Товары не найдены
        </div>
      )}
    </div>
  );
};

export default AdminStock;
