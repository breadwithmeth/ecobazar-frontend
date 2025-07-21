import React, { useState } from 'react';
import { apiGetUser, apiUpdateUser } from '../api';

const ProfileFillPage: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }
    setLoading(true);
    try {
      await apiUpdateUser(token, { name, phone_number: phone });
      onDone();
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32, minWidth: 320 }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Заполните профиль</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, marginBottom: 10 }}
          />
          <input
            type="text"
            placeholder="Телефон"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15 }}
          />
        </div>
        {error && <div style={{ color: 'red', fontSize: 15, marginBottom: 8 }}>{error}</div>}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ background: '#6BCB3D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, padding: '10px 18px', width: '100%', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};

export default ProfileFillPage;
