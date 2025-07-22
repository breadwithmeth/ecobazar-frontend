import React, { useState, useEffect } from 'react';
import AdminUsers from '../admin/AdminUsers';
import AdminProducts from '../admin/AdminProducts';
import AdminOrders from '../admin/AdminOrders';
import AdminCouriers from '../admin/AdminCouriers';
import AdminAnalytics from '../admin/AdminAnalytics';
import AdminCategories from '../admin/AdminCategories';
import AdminStock from '../admin/AdminStock';

import { 
  apiGetProducts, 
  apiGetStores, 
  apiCreateProduct, 
  apiGetCategories, 
  apiGetAdminOrders,
  apiUpdateOrderStatusAdmin,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiAssignCourier,
  apiUpdateStock
} from '../api';

const AdminPage: React.FC<{ onBack: () => void; token?: string }> = ({ onBack, token }) => {
  console.log('AdminPage rendered with token:', token ? `${token.substring(0, 10)}...` : 'undefined');
  
  // Обновление статуса заказа
  const onStatusChange = async (orderId: number, status: string) => {
    if (!token) return;
    try {
      await apiUpdateOrderStatusAdmin(token, orderId, status);
      // После успешного изменения статуса — обновить список заказов
      setOrdersLoading(true);
      const updatedOrders = await apiGetAdminOrders(token);
      setOrders(updatedOrders.orders);
    } catch (e: any) {
      setOrdersError(e.message || 'Ошибка обновления статуса');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Назначение курьера на заказ
  const onAssignCourier = async (orderId: number, courierId: number) => {
    if (!token) return;
    try {
      console.log('Assigning courier:', { orderId, courierId });
      await apiAssignCourier(token, courierId, orderId);
      // После успешного назначения курьера — обновить список заказов
      setOrdersLoading(true);
      const updatedOrders = await apiGetAdminOrders(token);
      setOrders(updatedOrders.orders);
    } catch (e: any) {
      console.error('Error assigning courier:', e);
      setOrdersError(e.message || 'Ошибка назначения курьера');
    } finally {
      setOrdersLoading(false);
    }
  };
  const [section, setSection] = useState<'users' | 'products' | 'orders' | 'categories' | 'stores' | 'couriers' | 'analytics' | 'stock' | null>(null);

  // Состояния для товаров и магазинов
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState('');
  const [newProd, setNewProd] = useState({ name: '', price: '', image: '', storeId: '', categoryId: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');
  const [newCat, setNewCat] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [stockInfo] = useState<any>(null);
  const [stockHistory] = useState<any[]>([]);
  const [stockLoading] = useState(false);
  const [stockError] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveType, setMoveType] = useState<'INCOME' | 'OUTCOME'>('INCOME');

  // Эффект загрузки данных
  useEffect(() => {
    if (section === 'products' && token) {
      setProdLoading(true);
      apiGetProducts(token)
        .then(data => setProducts(data.products))
        .catch(() => setProducts([]))
        .finally(() => setProdLoading(false));
      apiGetStores(token)
        .then(data => setStores(data.stores))
        .catch(() => setStores([]));
      apiGetCategories(token)
        .then(setCategories)
        .catch(() => setCategories([]));
    }
    if (section === 'categories' && token) {
      setCatLoading(true);
      setCatError('');
      apiGetCategories(token)
        .then(setCategories)
        .catch((e: any) => {
          setCatError(e.message || 'Ошибка загрузки категорий');
          setCategories([]);
        })
        .finally(() => setCatLoading(false));
    }
    if (section === 'orders' && token) {
      setOrdersLoading(true);
      setOrdersError('');
      console.log('Loading orders...');
      apiGetAdminOrders(token)
        .then((data: any) => {
          console.log('Orders API response:', data);
          setOrders(data.orders || data || []);
        })
        .catch((e: any) => {
          console.error('Orders API error:', e);
          setOrdersError(e.message || 'Ошибка загрузки заказов');
        })
        .finally(() => setOrdersLoading(false));
    }
  }, [section, token]);

  // Добавление товара через POST /api/products
  const onAdd = async () => {
    if (!newProd.name.trim() || !newProd.price.trim() || !newProd.storeId || !newProd.categoryId || !token) return;
    try {
      setProdLoading(true);
      setProdError('');
      const added = await apiCreateProduct(token, {
        name: newProd.name,
        price: Number(newProd.price),
        image: newProd.image || undefined,
        storeId: Number(newProd.storeId),
        categoryId: Number(newProd.categoryId),
      });
      setProducts(prev => [...prev, added]);
      setNewProd({ name: '', price: '', image: '', storeId: '', categoryId: '' });
    } catch (e: any) {
      setProdError(e.message || 'Ошибка');
    } finally {
      setProdLoading(false);
    }
  };
  
  // Функции для работы с категориями
  const onAddCategory = async () => {
    if (!newCat.trim() || !token) return;
    setCatLoading(true);
    setCatError('');
    try {
      const added = await apiCreateCategory(token, newCat.trim());
      setCategories(prev => [...prev, added]);
      setNewCat('');
    } catch (e: any) {
      setCatError(e.message || 'Ошибка создания категории');
    } finally {
      setCatLoading(false);
    }
  };

  const onEditCategory = async (id: number) => {
    if (!editCatName.trim() || !token) return;
    setCatLoading(true);
    setCatError('');
    try {
      const updated = await apiUpdateCategory(token, id, editCatName.trim());
      setCategories(prev => prev.map(cat => cat.id === id ? updated : cat));
      setEditCatId(null);
      setEditCatName('');
    } catch (e: any) {
      setCatError(e.message || 'Ошибка обновления категории');
    } finally {
      setCatLoading(false);
    }
  };

  const onDeleteCategory = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Удалить категорию? Это может повлиять на связанные товары.')) return;
    setCatLoading(true);
    setCatError('');
    try {
      await apiDeleteCategory(token, id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (e: any) {
      setCatError(e.message || 'Ошибка удаления категории');
    } finally {
      setCatLoading(false);
    }
  };

  const onShowStock = () => {};
  const onStockMove = () => {};
  const onCloseStock = () => {};

  return (
    <div style={{ background: '#f7f7f7', minHeight: '100vh', maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 18, background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>← Назад</button>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Админ-панель</h2>
      {!section && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={() => setSection('users')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление пользователями</button>
          <button onClick={() => setSection('products')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление товарами</button>
          <button onClick={() => setSection('orders')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление заказами</button>
          <button onClick={() => setSection('categories')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление категориями</button>
          <button onClick={() => setSection('stock')} style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>📦 Управление складом</button>
          <button onClick={() => setSection('stores')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление магазинами</button>
          <button onClick={() => setSection('couriers')} style={{ background: '#FF9800', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>🚚 Управление курьерами</button>
          <button onClick={() => setSection('analytics')} style={{ background: '#9C27B0', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>📊 Аналитика и отчеты</button>
        </div>
      )}
      {section === 'users' && <AdminUsers onBack={() => setSection(null)} token={token} />}
      {section === 'products' && token && (
        <AdminProducts
          token={token}
          onBack={() => setSection(null)}
        />
      )}
      {section === 'orders' && token && (
        <AdminOrders
          orders={orders}
          loading={ordersLoading}
          error={ordersError}
          onBack={() => setSection(null)}
          onStatusChange={onStatusChange}
          onAssignCourier={onAssignCourier}
          token={token}
        />
      )}
      {section === 'categories' && token && (
        <AdminCategories
          categories={categories}
          loading={catLoading}
          error={catError}
          newCat={newCat}
          editId={editCatId}
          editName={editCatName}
          onAdd={onAddCategory}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
          setNewCat={setNewCat}
          setEditId={setEditCatId}
          setEditName={setEditCatName}
          onBack={() => setSection(null)}
        />
      )}
      {section === 'stock' && token && (
        <AdminStock
          token={token}
          onBack={() => setSection(null)}
        />
      )}
      {section === 'couriers' && token && (
        <AdminCouriers token={token} />
      )}
      {section === 'analytics' && token && (
        <AdminAnalytics token={token} />
      )}
      {/* ...existing code for categories, stores... */}
    </div>
  );
};

export default AdminPage;
