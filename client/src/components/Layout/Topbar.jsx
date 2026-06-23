import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const isImpersonating = sessionStorage.getItem('impersonateGymId');

  return (
    <div className="topbar">
      <div>
        <h3 style={{ margin: 0 }}>
          {isImpersonating && <span style={{ color: 'var(--danger)', marginRight: '10px' }}>[GOD MODE]</span>}
          {user?.gymName || 'Gym Dashboard'}
        </h3>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {isImpersonating && (
          <button 
            className="btn-danger" 
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}
            onClick={() => {
              sessionStorage.removeItem('impersonateGymId');
              window.location.href = '/admin/dashboard';
            }}
          >
            Leave God Mode
          </button>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '500' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role || 'Staff'}</div>
        </div>
        
        <button 
          onClick={logout}
          style={{ 
            background: 'rgba(225, 112, 85, 0.1)', 
            color: 'var(--danger)', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
          title="Logout"
        >
          <FiLogOut />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
