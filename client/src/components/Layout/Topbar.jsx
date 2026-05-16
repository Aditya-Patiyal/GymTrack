import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="topbar">
      <div>
        <h3 style={{ margin: 0 }}>{user?.gymName || 'Gym Dashboard'}</h3>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '500' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.role === 'owner' ? 'Owner' : 'Staff'}</div>
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
