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
  ready?: () => void;
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('TelegramMiniApp: Initial load');
    
    // Добавляем отладочную информацию
    const debug = [];
    debug.push(`NODE_ENV: ${process.env.NODE_ENV}`);
    debug.push(`REACT_APP_TEST_VALUE: ${process.env.REACT_APP_TEST_VALUE}`);
    debug.push(`window.Telegram exists: ${!!window.Telegram}`);
    debug.push(`window.Telegram.WebApp exists: ${!!window.Telegram?.WebApp}`);
    
    if (window.Telegram?.WebApp) {
      debug.push(`initDataUnsafe exists: ${!!window.Telegram.WebApp.initDataUnsafe}`);
      debug.push(`user exists: ${!!window.Telegram.WebApp.initDataUnsafe?.user}`);
      debug.push(`user.id: ${window.Telegram.WebApp.initDataUnsafe?.user?.id || 'undefined'}`);
    }
    
    setDebugInfo(debug.join('\n'));
    console.log('Debug info:', debug.join(', '));

    const checkTelegramData = () => {
      // Получаем user_id из Telegram WebApp API
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user?.id) {
        console.log('Found Telegram userId:', tg.initDataUnsafe.user.id);
        setUserId(tg.initDataUnsafe.user.id);
        return true;
      } else {
        console.log('No Telegram userId found');
        return false;
      }
    };

    // Инициализируем Telegram WebApp если доступен
    if (window.Telegram?.WebApp) {
      try {
        // Уведомляем Telegram что приложение готово
        window.Telegram.WebApp.ready?.();
        console.log('Telegram WebApp ready() called');
      } catch (e) {
        console.log('Error calling Telegram WebApp ready():', e);
      }
    }

    // Проверяем данные Telegram немедленно
    const foundUser = checkTelegramData();
    
    // Если пользователь не найден сразу, используем fallback
    // if (!foundUser) {
    //   console.log('No Telegram user found, using fallback');
    //   setUserId(1884873765);
    //   setIsInitialized(true);
    //   return;
    // }
    
    // Устанавливаем короткий таймер для завершения инициализации
    const timeout = setTimeout(() => {
      console.log('Initialization completed');
      setIsInitialized(true);
    }, 500); // Очень короткое время

    return () => clearTimeout(timeout);
  }, []);

  console.log('TelegramMiniApp state:', { userId, token: token ? token.substring(0, 10) + '...' : null, page, isInitialized });

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

  // Вспомогательные функции
  const getTgWebApp = (): TelegramWebApp | undefined => {
    const w = window as any;
    return w?.Telegram?.WebApp || w?.parent?.Telegram?.WebApp;
  };

  const extractUserId = (): number | null => {
    const tg = getTgWebApp();
    if (tg?.initDataUnsafe?.user?.id) return Number(tg.initDataUnsafe.user.id);

    // Пытаемся вытащить из initData (строка querystring)
    const initData = (tg as any)?.initData as string | undefined;
    if (initData && typeof initData === 'string') {
      try {
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.id) return Number(user.id);
        }
      } catch {}
    }
    return null;
  };

  useEffect(() => {
    // ...existing debug build...
    const qs = new URLSearchParams(window.location.search);
    const debugFromQuery = Number(qs.get('debugUser')) || undefined;
    const debugFromLocal = Number(localStorage.getItem('debugUserId') || '') || undefined;
    const debugFromEnv = Number(process.env.REACT_APP_DEBUG_TG_USER_ID) || undefined;

    const setDebugUser = (id: number) => {
      if (!id) return;
      setUserId(id);
      setIsInitialized(true);
      localStorage.setItem('debugUserId', String(id));
    };

    // Говорим Telegram, что мы готовы
    try { getTgWebApp()?.ready?.(); } catch {}

    // Мгновенная попытка
    const idNow = extractUserId();
    if (idNow) {
      setUserId(idNow);
    } else if (debugFromQuery) {
      setDebugUser(debugFromQuery);
      return;
    } else if (debugFromLocal) {
      setDebugUser(debugFromLocal);
      return;
    }

    // Ретраи до 5 секунд (каждые 100мс)
    let tries = 0;
    const interval = setInterval(() => {
      const id = extractUserId();
      if (id) {
        setUserId(id);
        clearInterval(interval);
        setIsInitialized(true);
      } else if (++tries >= 50) {
        clearInterval(interval);
        setIsInitialized(true);
        if (debugFromEnv) setDebugUser(debugFromEnv);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!userId && !isInitialized) {
    return (
      <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>🔄 Загрузка EcoBazar...</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          Инициализация Telegram Mini App...
        </div>
        <div style={{ fontSize: 10, color: '#888', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
          {debugInfo}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          API_URL: {process.env.REACT_APP_API_URL || 'не определён'}
        </div>
      </div>
    );
  }

  if (!userId && isInitialized) {
    return (
      <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 18, marginBottom: 16, color: '#f44336' }}>
          ⚠️ Ошибка инициализации
        </div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Не удалось получить данные пользователя из Telegram
        </div>
        <div style={{ fontSize: 10, color: '#888', lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: 16 }}>
          {debugInfo}
        </div>
        
        {/* Кнопка для тестирования */}
        <button
          onClick={() => {
            const qs = new URLSearchParams(window.location.search);
            const id =
              Number(qs.get('debugUser')) ||
              Number(localStorage.getItem('debugUserId') || '') ||
              Number(process.env.REACT_APP_DEBUG_TG_USER_ID) ||
              1;
            localStorage.setItem('debugUserId', String(id));
            setUserId(id);
            setIsInitialized(true);
          }}
          style={{
            background: '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 16,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          🧪 Продолжить в тестовом режиме
        </button>
        
        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          API_URL: {process.env.REACT_APP_API_URL || 'не определён'}
        </div>
      </div>
    );
  }

  if (page === 'onboarding') {
    return <OnboardingPage onNext={() => setPage('login')} />;
  }

  if (page === 'login' && userId) {
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
