
import BottomBar from '../components/BottomBar';

const bgUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'; // можно заменить на свой


const OnboardingPage: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div
    style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.38) 100%), url(${bgUrl}) center/cover no-repeat`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'relative',
      color: '#fff',
      padding: 0,
      paddingBottom: 80,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px)',
        padding: '64px 32px 48px 32px',
        borderRadius: '40px 40px 0 0',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(0,0,0,0.13)',
        marginBottom: 32,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 900, color: '#6BCB3D', marginBottom: 24, letterSpacing: 2, textShadow: '0 4px 18px rgba(107,203,61,0.13)' }}>eco bazar</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 28, letterSpacing: 0.3, lineHeight: 1.18 }}>
        Find and Get<br />Your Best Food
      </div>
      <div style={{ fontSize: 17, opacity: 0.96, marginBottom: 48, lineHeight: 1.6, color: '#f3fff0', textShadow: '0 2px 8px rgba(0,0,0,0.13)' }}>
        Find the most delicious food<br />with the best quality and free delivery here
      </div>
      <button
        onClick={onNext}
        style={{
          background: 'linear-gradient(90deg, #6BCB3D 0%, #4BB543 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 18,
          fontSize: 22,
          fontWeight: 800,
          padding: '22px 0',
          width: '100%',
          boxShadow: '0 6px 24px rgba(107,203,61,0.16)',
          cursor: 'pointer',
          marginTop: 18,
          letterSpacing: 0.3,
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        Продолжить
      </button>
    </div>
    {/* <BottomBar /> */}
  </div>
);

export default OnboardingPage;
