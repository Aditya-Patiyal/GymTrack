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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Avatar */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: 'white',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            background: 'rgba(230, 32, 48, 0.08)',
            color: 'var(--danger)',
            border: '1px solid rgba(230, 32, 48, 0.2)',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(230, 32, 48, 0.18)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(230, 32, 48, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(230, 32, 48, 0.08)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FiLogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;

