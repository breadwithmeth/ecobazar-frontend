import React from 'react';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';

type Page = 'catalog' | 'profile' | 'cart';
interface BottomBarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  cartOpen?: boolean;
  onCartOpen?: () => void;
  cartCount?: number;
}

const BottomBar: React.FC<BottomBarProps> = ({ page, onNavigate, cartCount }) => (
  <div
    style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      background: '#fff',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 64,
      zIndex: 100,
      boxShadow: '0 -4px 24px rgba(107,203,61,0.08)',
      borderRadius: '18px 18px 0 0',
      maxWidth: 420,
      margin: '0 auto',
      padding: '0 8px',
    }}
  >
    {/* Каталог */}
    <button
      onClick={() => onNavigate('catalog')}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: page === 'catalog' ? '#fff' : '#6BCB3D',
        backgroundColor: page === 'catalog' ? '#6BCB3D' : 'transparent',
        borderRadius: 14,
        margin: '8px 4px',
        boxShadow: page === 'catalog' ? '0 2px 8px rgba(107,203,61,0.10)' : 'none',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        fontWeight: 600,
        fontSize: 22,
        minWidth: 0,
        minHeight: 0,
        padding: 0,
      }}
    >
      <StoreIcon style={{ fontSize: 27, lineHeight: 1 }} />
      <span style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>Каталог</span>
    </button>
    {/* Корзина
    <button
      onClick={() => onNavigate('cart')}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: page === 'cart' ? '#fff' : '#6BCB3D',
        backgroundColor: page === 'cart' ? '#6BCB3D' : 'transparent',
        borderRadius: 14,
        margin: '8px 4px',
        boxShadow: page === 'cart' ? '0 2px 8px rgba(107,203,61,0.10)' : 'none',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        fontWeight: 600,
        fontSize: 22,
        minWidth: 0,
        minHeight: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 27, lineHeight: 1, position: 'relative' }}>
        �
        {typeof cartCount === 'number' && cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -8,
            right: -14,
            background: page === 'cart' ? '#fff' : '#6BCB3D',
            color: page === 'cart' ? '#6BCB3D' : '#fff',
            borderRadius: '50%',
            fontSize: 13,
            minWidth: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            border: page === 'cart' ? '2px solid #6BCB3D' : 'none',
            transition: 'background 0.2s, color 0.2s, border 0.2s',
          }}>{cartCount}</span>
        )}
      </span>
      <span style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>Корзина</span>
    </button> */}
    {/* Корзина (новая навигационная) */}
    <button
      onClick={() => onNavigate('cart')}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: page === 'cart' ? '#fff' : '#6BCB3D',
        backgroundColor: page === 'cart' ? '#6BCB3D' : 'transparent',
        borderRadius: 14,
        margin: '8px 4px',
        boxShadow: page === 'cart' ? '0 2px 8px rgba(107,203,61,0.10)' : 'none',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        fontWeight: 600,
        fontSize: 22,
        minWidth: 0,
        minHeight: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 27, lineHeight: 1, position: 'relative' }}>
        <ShoppingCartIcon style={{ fontSize: 27, lineHeight: 1 }} />
        {typeof cartCount === 'number' && cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -8,
            right: -14,
            background: page === 'cart' ? '#fff' : '#6BCB3D',
            color: page === 'cart' ? '#6BCB3D' : '#fff',
            borderRadius: '50%',
            fontSize: 13,
            minWidth: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            border: page === 'cart' ? '2px solid #6BCB3D' : 'none',
            transition: 'background 0.2s, color 0.2s, border 0.2s',
          }}>{cartCount}</span>
        )}
      </span>
      <span style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>Корзина</span>
    </button>
    {/* Профиль */}
    <button
      onClick={() => onNavigate('profile')}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: page === 'profile' ? '#fff' : '#6BCB3D',
        backgroundColor: page === 'profile' ? '#6BCB3D' : 'transparent',
        borderRadius: 14,
        margin: '8px 4px',
        boxShadow: page === 'profile' ? '0 2px 8px rgba(107,203,61,0.10)' : 'none',
        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        fontWeight: 600,
        fontSize: 22,
        minWidth: 0,
        minHeight: 0,
        padding: 0,
      }}
    >
      <PersonIcon style={{ fontSize: 27, lineHeight: 1 }} />
      <span style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>Профиль</span>
    </button>
  </div>
);

export default BottomBar;
