
// import BottomBar from '../components/BottomBar';

const LoginPage: React.FC<{ userId: number }> = ({ userId }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f7f7f7',
    color: '#222',
    paddingBottom: 64,
  }}>
    <div style={{
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: '32px 24px',
      minWidth: 280,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Вход</div>
      <div style={{ fontSize: 15, color: '#6BCB3D', fontWeight: 600, marginBottom: 8 }}>user_id: {userId}</div>
      <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 18 }}>Вход выполняется автоматически...</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <div className="loader" style={{ width: 32, height: 32, border: '4px solid #eee', borderTop: '4px solid #6BCB3D', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    {/* <BottomBar page="login" onNavigate={() => {}} /> */}
  </div>
);

export default LoginPage;
