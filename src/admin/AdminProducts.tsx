import React, { useState } from 'react';
import { apiUpdateProductPrice } from '../api';

interface Store {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  storeId: number;
}
interface StockInfo {
  productId: number;
  stock: number;
}

interface Category {
  id: number;
  name: string;
}
interface Props {
  products: Product[];
  stores: Store[];
  categories: Category[];
  loading: boolean;
  error: string;
  newProd: { name: string; price: string; image: string; storeId: string; categoryId: string };
  onAdd: () => void;
  setNewProd: (v: any) => void;
  onShowStock: (productId: number) => void;
  stockInfo: StockInfo | null;
  stockHistory: any[];
  stockLoading: boolean;
  stockError: string;
  moveQty: string;
  moveType: 'INCOME' | 'OUTCOME';
  setMoveQty: (v: string) => void;
  setMoveType: (v: 'INCOME' | 'OUTCOME') => void;
  onStockMove: (productId: number) => void;
  onCloseStock: () => void;
  onBack: () => void;
  token: string;
}

const AdminProducts: React.FC<Props> = ({
  products, stores, categories, loading, error, newProd, onAdd, setNewProd, onShowStock, stockInfo, stockHistory, stockLoading, stockError, moveQty, moveType, setMoveQty, setMoveType, onStockMove, onCloseStock, onBack, token
}) => {
  const [editPriceId, setEditPriceId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editPriceLoading, setEditPriceLoading] = useState(false);
  const [editPriceError, setEditPriceError] = useState('');

  // Используем token напрямую из аргументов

  const updateProductPrice = async (productId: number, price: number) => {
    setEditPriceLoading(true);
    setEditPriceError('');
    try {
      await apiUpdateProductPrice(token, productId, price);
      setEditPriceId(null);
      setEditPrice('');
    } catch (e: any) {
      setEditPriceError(e.message || 'Ошибка');
    } finally {
      setEditPriceLoading(false);
    }
  };

  return (
    <div>
    {/* Форма добавления товара — теперь в самом верху */}
    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexDirection: 'column', marginBottom: 18 }}>
      <input
        value={newProd.name}
        onChange={e => setNewProd((p: any) => ({ ...p, name: e.target.value }))}
        placeholder="Название товара"
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
      />
      <input
        value={newProd.price}
        onChange={e => setNewProd((p: any) => ({ ...p, price: e.target.value }))}
        placeholder="Цена"
        type="number"
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
      />
      <input
        value={newProd.image}
        onChange={e => setNewProd((p: any) => ({ ...p, image: e.target.value }))}
        placeholder="URL изображения (необязательно)"
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
      />
      <select
        value={newProd.storeId}
        onChange={e => setNewProd((p: any) => ({ ...p, storeId: e.target.value }))}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
      >
        <option value="">Выберите магазин</option>
        {stores && stores.length > 0 ? (
          stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))
        ) : (
          <option value="" disabled>Нет магазинов</option>
        )}
      </select>
      <select
        value={newProd.categoryId}
        onChange={e => setNewProd((p: any) => ({ ...p, categoryId: e.target.value }))}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
      >
        <option value="">Выберите категорию</option>
        {categories && categories.length > 0 ? (
          categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))
        ) : (
          <option value="" disabled>Нет категорий</option>
        )}
      </select>
      <button onClick={onAdd} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Добавить товар</button>
    </div>
    <h3>Управление товарами</h3>
    <div style={{ color: '#888', marginBottom: 12 }}>Добавляйте товары, управляйте остатками.</div>
    {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    {loading ? (
      <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
    ) : (
      <>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {products.map(prod => (
            <li key={prod.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>{prod.name} <span style={{ color: '#6BCB3D', fontWeight: 400 }}>{prod.price}₸</span></span>
              <span style={{ color: '#888', fontSize: 14 }}>Магазин: {stores.find(s => s.id === prod.storeId)?.name || prod.storeId}</span>
              <span style={{ color: '#888', fontSize: 14 }}>{prod.image ? <img src={prod.image} alt={prod.name} style={{ maxWidth: 60, maxHeight: 40, borderRadius: 6 }} /> : 'Без изображения'}</span>
              {editPriceId === prod.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 15, width: 80 }}
                    placeholder="Новая цена"
                  />
                  <button
                    onClick={() => updateProductPrice(prod.id, Number(editPrice))}
                    style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer' }}
                    disabled={editPriceLoading || !editPrice}
                  >Сохранить</button>
                  <button
                    onClick={() => { setEditPriceId(null); setEditPrice(''); }}
                    style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer' }}
                  >Отмена</button>
                  {editPriceError && <span style={{ color: 'red', fontSize: 13 }}>{editPriceError}</span>}
                </div>
              ) : (
                <button
                  onClick={() => { setEditPriceId(prod.id); setEditPrice(String(prod.price)); }}
                  style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer', marginTop: 4, alignSelf: 'flex-start' }}
                >Изменить цену</button>
              )}
              <button onClick={() => onShowStock(prod.id)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, padding: '6px 10px', cursor: 'pointer', marginTop: 4, alignSelf: 'flex-start' }}>Остатки и история</button>
            </li>
          ))}
        </ul>
        {/* Остатки и история */}
        {stockInfo && (
          <div style={{ background: '#f7f7f7', borderRadius: 10, padding: 14, marginTop: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Остаток: {stockInfo.stock}</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Движение товара</div>
            {stockError && <div style={{ color: 'red', marginBottom: 8 }}>{stockError}</div>}
            {stockLoading ? (
              <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    value={moveQty}
                    onChange={e => setMoveQty(e.target.value)}
                    placeholder="Количество"
                    type="number"
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
                  />
                  <select value={moveType} onChange={e => setMoveType(e.target.value as any)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}>
                    <option value="INCOME">Поступление</option>
                    <option value="OUTCOME">Списание</option>
                  </select>
                  <button onClick={() => onStockMove(stockInfo.productId)} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Операция</button>
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>История:</div>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  {stockHistory.map((m, idx) => (
                    <li key={idx} style={{ fontSize: 14, marginBottom: 4 }}>
                      {m.type === 'INCOME' ? '+' : '-'}{m.quantity} ({m.type === 'INCOME' ? 'Поступление' : 'Списание'}) — {new Date(m.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={onCloseStock} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>Закрыть</button>
          </div>
        )}
      </>
    )}
    <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginTop: 18 }}>← Назад</button>
  </div>
  );
}

export default AdminProducts;
