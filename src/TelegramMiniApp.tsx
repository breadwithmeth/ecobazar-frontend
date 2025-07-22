import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import CatalogPage from './pages/CatalogPage';
import { apiAuth } from './api';

// Типизация для Telegram WebApp API
interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}


type Page = 'onboarding' | 'login' | 'catalog';

const TelegramMiniApp: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState<Page>('onboarding');

  useEffect(() => {
    // Получаем user_id из Telegram WebApp API
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      setUserId(tg.initDataUnsafe.user.id);
    }
  }, []);

  // Если тестовое значение есть, эмулируем userId и сразу продолжаем
  const isDevTest = process.env.NODE_ENV === 'development' && process.env.REACT_APP_TEST_VALUE;
  useEffect(() => {
    if (isDevTest && !userId) {
      console.log('Setting test userId: 1001');
      setUserId(1001); // Тестовый userId
    }
  }, [isDevTest, userId]);

  console.log('TelegramMiniApp state:', { userId, token: token ? token.substring(0, 10) + '...' : null, page });

  // Переход к странице входа после онбординга, если userId есть
  useEffect(() => {
    if (page === 'onboarding' && userId) {
      setPage('login');
    }
  }, [page, userId]);

  // Авторизация по userId
  useEffect(() => {
    if (userId && !token && page === 'login') {
      console.log('Starting auth process for userId:', userId);
      setAuthError('');
      apiAuth(String(userId))
        .then(data => {
          console.log('Auth response:', data);
          if (data.token) {
            setToken(data.token);
            console.log('Token set:', data.token.substring(0, 10) + '...');
            setPage('catalog');
          } else throw new Error('Нет токена');
        })
        .catch(e => {
          console.error('Auth error:', e);
          setAuthError(e.message);
        });
    }
  }, [userId, token, page]);

  if (!userId) {
    return (
      <div>
        Загрузка...<br />
        <span style={{ color: '#888', fontSize: 12 }}>API_URL: {process.env.REACT_APP_API_URL || 'не определён'}</span><br />
        <span style={{ color: '#888', fontSize: 12 }}>userId: —</span>
      </div>
    );
  }

  if (page === 'onboarding') {
    return <OnboardingPage onNext={() => setPage('login')} />;
  }

  if (page === 'login') {
    return (
      <>
        <LoginPage userId={userId} />
        <div style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          userId: {userId}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button 
              onClick={() => {
                setToken(null);
                setPage('login');
              }}
              style={{ 
                padding: '8px 16px', 
                background: '#2196F3', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                fontSize: 14, 
                cursor: 'pointer' 
              }}
            >
              🔄 Повторить авторизацию
            </button>
          </div>
        )}
        {authError && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: 12 }}>
            {authError}
            <br />
            <span style={{ color: '#888', fontSize: 12 }}>API_URL: {process.env.REACT_APP_API_URL || 'не определён'}</span><br />
            <span style={{ color: '#888', fontSize: 12 }}>userId: {userId}</span>
          </div>
        )}
      </>
    );
  }

  if (page === 'catalog' && token) {
    return <CatalogPage token={token} />;
  }

  return <div>Загрузка...</div>;
};

export default TelegramMiniApp;
