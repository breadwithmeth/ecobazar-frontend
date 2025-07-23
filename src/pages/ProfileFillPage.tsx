import React, { useState, useEffect } from 'react';
import { apiUpdateUser } from '../api';

const ProfileFillPage: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shimmerActive, setShimmerActive] = useState(false);
  const [showMagicMessage, setShowMagicMessage] = useState(false);
  const [currentMagicMessage, setCurrentMagicMessage] = useState<{
    emoji: string;
    title: string;
    text: string;
    bottomEmoji: string;
  } | null>(null);

  // Массив рандомных магических надписей
  const magicMessages = [
    {
      emoji: '🎉',
      title: 'Магия активирована!',
      text: 'Теперь все товары собираются\nс особой любовью и заботой ✨',
      bottomEmoji: '🌟'
    },
    {
      emoji: '🚀',
      title: 'Турбо режим включен!',
      text: 'Ваши продукты будут доставлены\nсо скоростью света! ⚡',
      bottomEmoji: '💫'
    },
    {
      emoji: '👑',
      title: 'VIP статус получен!',
      text: 'Теперь вы получаете товары\nкак настоящая королева! 💎',
      bottomEmoji: '✨'
    },
    {
      emoji: '🌈',
      title: 'Радужная магия!',
      text: 'Каждый товар теперь наполнен\nцветами счастья и радости! 🦄',
      bottomEmoji: '🌟'
    },
    {
      emoji: '🔮',
      title: 'Предсказание сбылось!',
      text: 'Магический шар предвидит\nидеальные покупки для вас! 🪄',
      bottomEmoji: '⭐'
    }
  ];

  const handleMagicClick = () => {
    // Выбираем случайное сообщение
    const randomMessage = magicMessages[Math.floor(Math.random() * magicMessages.length)];
    setCurrentMagicMessage(randomMessage);
    setShowMagicMessage(true);
    // Показываем сообщение на 3 секунды
    setTimeout(() => {
      setShowMagicMessage(false);
    }, 3000);
  };

  // Запускаем shimmer эффект каждые 3 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmerActive(true);
      setTimeout(() => setShimmerActive(false), 600);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

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
        
        {/* Невероятно красивая кнопка */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={handleMagicClick}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 18,
              padding: '16px 32px',
              width: '100%',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.35)',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.35)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: shimmerActive ? '100%' : '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transition: shimmerActive ? 'left 0.6s ease' : 'none',
            }}
            />
            <span style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <span style={{
                fontSize: 20,
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
              }}>
                ✨
              </span>
              Собрать как для себя
              <span style={{
                fontSize: 20,
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
              }}>
                ✨
              </span>
            </span>
          </button>
          
          <div style={{
            marginTop: 8,
            fontSize: 12,
            color: '#888',
            fontStyle: 'italic'
          }}>
            💫 Магия качества в каждом товаре
          </div>
        </div>
        
        {/* Магическое уведомление */}
        {showMagicMessage && currentMagicMessage && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 50%, #ff9068 100%)',
            color: '#fff',
            padding: '24px 32px',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(255, 107, 107, 0.4)',
            zIndex: 1000,
            textAlign: 'center',
            minWidth: 280,
            animation: 'magicAppear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{currentMagicMessage.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {currentMagicMessage.title}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: 'pre-line' }}>
              {currentMagicMessage.text}
            </div>
            <div style={{ fontSize: 24, marginTop: 12 }}>{currentMagicMessage.bottomEmoji}</div>
          </div>
        )}
        
        {/* CSS анимация через style tag */}
        {showMagicMessage && (
          <style>
            {`
              @keyframes magicAppear {
                0% {
                  transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
                  opacity: 0;
                }
                50% {
                  transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
                }
                100% {
                  transform: translate(-50%, -50%) scale(1) rotate(0deg);
                  opacity: 1;
                }
              }
            `}
          </style>
        )}
      </div>
    </div>
  );
};

export default ProfileFillPage;
