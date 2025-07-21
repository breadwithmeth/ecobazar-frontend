import React, { useEffect, useState } from "react";
import BottomBar from '../components/BottomBar';
import { apiGetAddresses, apiAddAddress, apiGetUser } from '../api';
import AdminPage from './AdminPage';

interface User {
  id: number;
  name: string | null;
  phone_number?: string;
  telegram_user_id?: string;
  role?: string;
}

interface Address {
  id: number;
  address: string;
}

type Page = 'catalog' | 'profile' | 'cart';
interface ProfilePageProps {
  token: string;
  onNavigate: (page: Page) => void;
}


const ProfilePage: React.FC<ProfilePageProps> = ({ token, onNavigate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [adding, setAdding] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  useEffect(() => {
    apiGetAddresses(token)
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [token]);

  const handleAddAddress = async () => {
    setAddError('');
    if (!newAddress.trim()) {
      setAddError('Введите адрес');
      return;
    }
    try {
      const created = await apiAddAddress(token, newAddress);
      setAddresses(prev => [...prev, created]);
      setNewAddress('');
      setAdding(false);
    } catch (e: any) {
      setAddError(e.message || 'Ошибка');
    }
  };

  useEffect(() => {
    apiGetUser(token)
      .then(setUser)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} token={token} />;
  }

  return (
    <React.Fragment>
      <div style={{ background: '#f7f7f7', minHeight: '100vh', position: 'relative' }}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: '#f7f7f7',
            transition: 'transform 0.25s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            maxWidth: 420,
            margin: '0 auto',
            padding: '0 18px 0 18px',
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '26px 0 12px 0', maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Профиль</span>
          </div>
        </div>
      <div style={{ paddingTop: 80, maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 48 }}>Загрузка профиля...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: 48 }}>{error}</div>
        ) : user ? (
          <>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24, margin: '24px 0' }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>👤 {user.name ?? 'Пользователь'}</div>
              <div style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>ID: {user.id}</div>
              {user.phone_number && <div style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>Телефон: {user.phone_number}</div>}
              {user.telegram_user_id && <div style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>Telegram ID: {user.telegram_user_id}</div>}
              {user.role && <div style={{ fontSize: 15, color: '#888' }}>Роль: {user.role}</div>}
              {/* Кнопка для ADMIN */}
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => setShowAdmin(true)}
                  style={{
                    background: '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 16,
                    padding: '10px 18px',
                    marginTop: 16,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Админ-панель
                </button>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24, margin: '24px 0' }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Адреса доставки</div>
              {addresses.length === 0 && <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>Нет добавленных адресов</div>}
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {addresses.map(addr => (
                  <li key={addr.id} style={{ background: '#f7f7f7', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 15 }}>{addr.address}</li>
                ))}
              </ul>
              {adding ? (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    placeholder="Введите адрес"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 15 }}
                  />
                  <button
                    onClick={handleAddAddress}
                    style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewAddress(''); setAddError(''); }}
                    style={{ background: '#eee', color: '#888', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 12px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 16px', marginTop: 10, cursor: 'pointer' }}
                >
                  + Добавить адрес
                </button>
              )}
              {addError && <div style={{ color: 'red', fontSize: 14, marginTop: 6 }}>{addError}</div>}
            </div>
          </>
        ) : null}
      </div>
      <BottomBar page="profile" onNavigate={onNavigate} />
    </div>
  </React.Fragment>
  );
};

export default ProfilePage;
