import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
    { name: 'Members', icon: <FiUsers />, path: '/members' },
    { name: 'Payments', icon: <FiDollarSign />, path: '/payments' },
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
            })}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
