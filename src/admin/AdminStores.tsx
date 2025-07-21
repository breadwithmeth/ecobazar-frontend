import React from 'react';

interface Store {
  id: number;
  name: string;
  address: string;
}

interface Props {
  stores: Store[];
  loading: boolean;
  error: string;
  newStoreName: string;
  newStoreAddress: string;
  onAdd: () => void;
  setNewStoreName: (v: string) => void;
  setNewStoreAddress: (v: string) => void;
  onBack: () => void;
}

const AdminStores: React.FC<Props> = ({
  stores, loading, error, newStoreName, newStoreAddress, onAdd, setNewStoreName, setNewStoreAddress, onBack
}) => (
  <div>
    <h3>Управление магазинами</h3>
    <div style={{ color: '#888', marginBottom: 12 }}>Добавляйте новые магазины. Удаление и редактирование пока не реализованы.</div>
    {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    {loading ? (
      <div style={{ color: '#888', marginBottom: 8 }}>Загрузка...</div>
    ) : (
      <>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {stores.map(store => (
            <li key={store.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>{store.name}</span>
              <span style={{ color: '#888', fontSize: 14 }}>{store.address}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexDirection: 'column' }}>
          <input
            value={newStoreName}
            onChange={e => setNewStoreName(e.target.value)}
            placeholder="Название магазина"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
          />
          <input
            value={newStoreAddress}
            onChange={e => setNewStoreAddress(e.target.value)}
            placeholder="Адрес магазина"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
          />
          <button onClick={onAdd} style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}>Добавить магазин</button>
        </div>
      </>
    )}
    <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginTop: 18 }}>← Назад</button>
  </div>
);

export default AdminStores;
