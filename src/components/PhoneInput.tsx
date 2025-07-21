import React, { useState } from 'react';

const PhoneInput: React.FC<{ onSubmit: (phone: string) => void }> = ({ onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\+?\d{10,15}$/.test(phone)) {
      setError('Введите корректный номер телефона');
      return;
    }
    setError('');
    onSubmit(phone);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label>
        Ваш телефон:
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+79991234567"
          required
        />
      </label>
      {error && <span style={{ color: 'red' }}>{error}</span>}
      <button type="submit">Продолжить</button>
    </form>
  );
};

export default PhoneInput;
