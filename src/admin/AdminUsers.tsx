import React from 'react';

const AdminUsers: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div>
    <h3>Управление пользователями</h3>
    <div style={{ color: '#888', marginBottom: 12 }}>Здесь будет управление пользователями.</div>
    <button onClick={onBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>← Назад</button>
  </div>
);

export default AdminUsers;
