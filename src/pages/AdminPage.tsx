import React, { useState, useEffect } from 'react';
import AdminUsers from '../admin/AdminUsers';
import AdminProducts from '../admin/AdminProducts';
import AdminOrders from '../admin/AdminOrders';

import { apiGetProducts, apiGetStores, apiAddProduct, apiGetCategories, apiGetAllOrders } from '../api';

import { apiUpdateOrderStatus } from '../api';

const AdminPage: React.FC<{ onBack: () => void; token?: string }> = ({ onBack, token }) => {
  // Обновление статуса заказа
  const onStatusChange = async (orderId: number, status: string) => {
    if (!token) return;
    try {
      await apiUpdateOrderStatus(token, orderId, status);
      // После успешного изменения статуса — обновить список заказов
      setOrdersLoading(true);
      const updatedOrders = await apiGetAllOrders(token);
      setOrders(updatedOrders);
    } catch (e: any) {
      setOrdersError(e.message || 'Ошибка обновления статуса');
    } finally {
      setOrdersLoading(false);
    }
  };
  const [section, setSection] = useState<'users' | 'products' | 'orders' | 'categories' | 'stores' | null>(null);

  // Состояния для товаров и магазинов
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState('');
  const [newProd, setNewProd] = useState({ name: '', price: '', image: '', storeId: '', categoryId: '' });
  const [categories, setCategories] = useState<any[]>([]);
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
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setProdLoading(false));
      apiGetStores(token)
        .then(setStores)
        .catch(() => setStores([]));
      apiGetCategories(token)
        .then(setCategories)
        .catch(() => setCategories([]));
    }
    if (section === 'orders' && token) {
      setOrdersLoading(true);
      apiGetAllOrders(token)
        .then(setOrders)
        .catch(e => setOrdersError(e.message || 'Ошибка'))
        .finally(() => setOrdersLoading(false));
    }
  }, [section, token]);

  // Добавление товара через POST /api/products
  const onAdd = async () => {
    if (!newProd.name.trim() || !newProd.price.trim() || !newProd.storeId || !newProd.categoryId || !token) return;
    try {
      setProdLoading(true);
      setProdError('');
      const added = await apiAddProduct(token, {
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
          <button onClick={() => setSection('stores')} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 17, padding: '14px 0', cursor: 'pointer' }}>Управление магазинами</button>
        </div>
      )}
      {section === 'users' && <AdminUsers onBack={() => setSection(null)} />}
      {section === 'products' && (
        <AdminProducts
          products={products}
          stores={stores}
          categories={categories}
          loading={prodLoading}
          error={prodError}
          newProd={newProd}
          onAdd={onAdd}
          setNewProd={setNewProd}
          onShowStock={onShowStock}
          stockInfo={stockInfo}
          stockHistory={stockHistory}
          stockLoading={stockLoading}
          stockError={stockError}
          moveQty={moveQty}
          moveType={moveType}
          setMoveQty={setMoveQty}
          setMoveType={setMoveType}
          onStockMove={onStockMove}
          onCloseStock={onCloseStock}
          onBack={() => setSection(null)}
          token={token ?? ''}
        />
      )}
      {section === 'orders' && (
        <AdminOrders
          orders={orders}
          loading={ordersLoading}
          error={ordersError}
          onBack={() => setSection(null)}
          onStatusChange={onStatusChange}
        />
      )}
      {/* ...existing code for categories, stores... */}
    </div>
  );
};

export default AdminPage;
