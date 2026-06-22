import { NavLink } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { FiHome, FiUsers, FiDollarSign, FiUserPlus, FiAlertOctagon } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'owner';
  const [deleteRequestCount, setDeleteRequestCount] = useState(0);

  useEffect(() => {
    if (isOwner) {
      api.get('/delete-requests/pending-count')
        .then(res => setDeleteRequestCount(res.data.count))
        .catch(() => {});
    }
  }, [isOwner]);

  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
    { name: 'Members', icon: <FiUsers />, path: '/members' },
    { name: 'Payments', icon: <FiDollarSign />, path: '/payments' },
    ...(isOwner ? [
      { name: 'Staff', icon: <FiUserPlus />, path: '/staff' },
      {
        name: 'Delete Requests',
        icon: <FiAlertOctagon />,
        path: '/delete-requests',
        badge: deleteRequestCount > 0 ? deleteRequestCount : null,
      },
    ] : []),
  ];

  return (
    <div className="sidebar">
      <div style={{ padding: '1.5rem 2rem', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
        Gym<span style={{ color: 'var(--accent-primary)' }}>Pulse</span>
      </div>

      <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              color: isActive ? 'white' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
              fontWeight: isActive ? '500' : '400',
              transition: 'all 0.2s',
              position: 'relative',
            })}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.name}
            {item.badge && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                minWidth: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold',
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
