import React, { useState, useEffect } from 'react';
import { apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiGetProducts, apiGetStores, apiGetCategories } from '../api';

interface Store {
  id: number;
  name: string;
  address?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  storeId: number;
  categoryId?: number;
  store?: Store;
  category?: Category;
}

interface ProductFormData {
  name: string;
  price: string;
  storeId: string;
  categoryId: string;
  image: string;
  description: string;
}

interface Props {
  token: string;
  onBack: () => void;
}

const AdminProducts: React.FC<Props> = ({ token, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storesLoading, setStoresLoading] = useState(false);
  
  // Состояние для создания нового продукта
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Состояние для редактирования продукта
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Форма для нового продукта
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: '',
    price: '',
    storeId: '',
    categoryId: '',
    image: '',
    description: ''
  });
  
  // Форма для редактирования
  const [editForm, setEditForm] = useState<ProductFormData>({
    name: '',
    price: '',
    storeId: '',
    categoryId: '',
    image: '',
    description: ''
  });

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setStoresLoading(true);
    setError('');
    try {
      // Загружаем все данные параллельно
      const [productsResponse, storesResponse, categoriesResponse] = await Promise.allSettled([
        apiGetProducts(),
        apiGetStores(token, 1, 100),
        apiGetCategories(token)
      ]);

      // Обработка продуктов
      if (productsResponse.status === 'fulfilled') {
        const productsData = productsResponse.value;
        setProducts(Array.isArray(productsData) ? productsData : (productsData?.products || []));
      } else {
        console.error('Error loading products:', productsResponse.reason);
        setProducts([]);
      }

      // Обработка магазинов
      if (storesResponse.status === 'fulfilled') {
        const storesData = storesResponse.value;
        console.log('=== STORES DEBUG ===');
        console.log('Stores API response:', storesData);
        console.log('Stores type:', typeof storesData, 'isArray:', Array.isArray(storesData));
        
        // Проверяем новый формат API: { success: true, data: [...], meta: {...} }
        if (storesData && storesData.success && storesData.data) {
          console.log(`✅ New API format - ${storesData.data.length} stores:`, storesData.data);
          setStores(storesData.data);
        } else if (Array.isArray(storesData)) {
          console.log(`✅ Direct array format - ${storesData.length} stores:`, storesData);
          setStores(storesData);
        } else if (storesData && typeof storesData === 'object' && storesData.stores) {
          console.log(`✅ Wrapper format - ${storesData.stores.length} stores:`, storesData.stores);
          setStores(storesData.stores);
        } else {
          console.log('⚠️ No stores data found, setting empty array');
          setStores([]);
        }
        console.log('=== END STORES DEBUG ===');
      } else {
        console.log('❌ Stores API failed:', storesResponse.reason);
        setStores([]);
      }

      // Обработка категорий
      if (categoriesResponse.status === 'fulfilled') {
        const categoriesData = categoriesResponse.value;
        setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []));
      } else {
        console.error('Error loading categories:', categoriesResponse.reason);
        setCategories([]);
      }

    } catch (err: any) {
      console.error('Общая ошибка загрузки данных:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
      setStoresLoading(false);
    }
  };

  // Создание нового продукта
  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.storeId) {
      setCreateError('Заполните обязательные поля: название, цена, магазин');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        storeId: parseInt(newProduct.storeId),
        ...(newProduct.categoryId && { categoryId: parseInt(newProduct.categoryId) }),
        ...(newProduct.image.trim() && { image: newProduct.image.trim() }),
        ...(newProduct.description.trim() && { description: newProduct.description.trim() })
      };

      await apiCreateProduct(token, productData);
      
      // Сброс формы и перезагрузка данных
      setNewProduct({
        name: '',
        price: '',
        storeId: '',
        categoryId: '',
        image: '',
        description: ''
      });
      setShowCreateForm(false);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Ошибка создания продукта');
    } finally {
      setCreateLoading(false);
    }
  };

  // Начать редактирование продукта
  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      storeId: product.storeId.toString(),
      categoryId: product.categoryId?.toString() || '',
      image: product.image || '',
      description: product.description || ''
    });
    setEditError('');
  };

  // Сохранить изменения продукта
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    if (!editForm.name.trim() || !editForm.price || !editForm.storeId) {
      setEditError('Заполните обязательные поля: название, цена, магазин');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      const updateData = {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        storeId: parseInt(editForm.storeId),
        ...(editForm.categoryId && { categoryId: parseInt(editForm.categoryId) }),
        image: editForm.image.trim() || undefined,
        description: editForm.description.trim() || undefined
      };

      await apiUpdateProduct(token, editingProduct.id, updateData);
      
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Ошибка обновления продукта');
    } finally {
      setEditLoading(false);
    }
  };

  // Удаление продукта
  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить продукт "${productName}"?`)) {
      return;
    }

    try {
      await apiDeleteProduct(token, productId);
      loadData();
    } catch (err: any) {
      window.alert(`Ошибка удаления: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Загрузка продуктов...</div>
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

      <h2 style={{ marginBottom: 20 }}>Управление товарами</h2>

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

      {/* Кнопка создания нового продукта */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        disabled={stores.length === 0 && !storesLoading}
        style={{
          background: (stores.length === 0 && !storesLoading) ? '#ccc' : '#4CAF50',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          cursor: (stores.length === 0 && !storesLoading) ? 'not-allowed' : 'pointer',
          marginBottom: 20
        }}
      >
        {showCreateForm ? 'Отменить' : '+ Добавить товар'}
      </button>

      {/* Форма создания нового продукта */}
      {showCreateForm && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: 20, 
          borderRadius: 12, 
          marginBottom: 20 
        }}>
          <h3>Создать новый товар</h3>
          
          {createError && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: 8, 
              borderRadius: 6, 
              marginBottom: 12 
            }}>
              {createError}
            </div>
          )}

          {stores.length === 0 && !storesLoading && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 12 
            }}>
              ⚠️ Магазины не загружены. Невозможно создать товар без привязки к магазину.
              <br />
              <small>Проверьте подключение к API или создайте магазины в разделе "Магазины".</small>
            </div>
          )}

          {storesLoading && (
            <div style={{ 
              background: '#e3f2fd', 
              color: '#1976d2', 
              padding: 8, 
              borderRadius: 6, 
              marginBottom: 12 
            }}>
              🔄 Загружаются магазины...
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="text"
              placeholder="Название товара *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
            
            <input
              type="number"
              placeholder="Цена *"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
            
            <select
              value={newProduct.storeId}
              onChange={(e) => setNewProduct({...newProduct, storeId: e.target.value})}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              disabled={storesLoading}
            >
              <option value="">
                {storesLoading ? 'Загрузка магазинов...' : 'Выберите магазин *'}
              </option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            
            <select
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Выберите категорию (опционально)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <input
              type="url"
              placeholder="URL изображения"
              value={newProduct.image}
              onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
            
            <textarea
              placeholder="Описание товара"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              rows={3}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
            />
          </div>

          <button
            onClick={handleCreateProduct}
            disabled={createLoading}
            style={{
              background: createLoading ? '#ccc' : '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontWeight: 600,
              cursor: createLoading ? 'wait' : 'pointer',
              marginTop: 12
            }}
          >
            {createLoading ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      )}

      {/* Список продуктов */}
      <div style={{ display: 'grid', gap: 16 }}>
        {products.map(product => (
          <div 
            key={product.id}
            style={{ 
              background: '#fff', 
              padding: 16, 
              borderRadius: 12, 
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  style={{ 
                    width: 60, 
                    height: 60, 
                    objectFit: 'cover', 
                    borderRadius: 8 
                  }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{product.name}</h4>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Цена: <strong>{product.price}₸</strong>
                </div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Магазин: {stores.find(s => s.id === product.storeId)?.name || 'Неизвестно'}
                </div>
                {product.categoryId && (
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                    Категория: {categories.find(c => c.id === product.categoryId)?.name || 'Неизвестно'}
                  </div>
                )}
                {product.description && (
                  <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                    {product.description}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => startEditProduct(product)}
                  style={{
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Редактировать
                </button>
                
                <button
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  style={{
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Товары не найдены
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingProduct && (
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
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Редактировать товар</h3>
            
            {editError && (
              <div style={{ 
                background: '#ffebee', 
                color: '#c62828', 
                padding: 8, 
                borderRadius: 6, 
                marginBottom: 12 
              }}>
                {editError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Название товара *"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              />
              
              <input
                type="number"
                placeholder="Цена *"
                value={editForm.price}
                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              />
              
              <select
                value={editForm.storeId}
                onChange={(e) => setEditForm({...editForm, storeId: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                disabled={storesLoading}
              >
                <option value="">
                  {storesLoading ? 'Загрузка магазинов...' : 'Выберите магазин *'}
                </option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              
              <select
                value={editForm.categoryId}
                onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="">Выберите категорию (опционально)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <input
                type="url"
                placeholder="URL изображения"
                value={editForm.image}
                onChange={(e) => setEditForm({...editForm, image: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              />
              
              <textarea
                placeholder="Описание товара"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                rows={3}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleUpdateProduct}
                disabled={editLoading}
                style={{
                  background: editLoading ? '#ccc' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: editLoading ? 'wait' : 'pointer',
                  flex: 1
                }}
              >
                {editLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              
              <button
                onClick={() => setEditingProduct(null)}
                style={{
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;