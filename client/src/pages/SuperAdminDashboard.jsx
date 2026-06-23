import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ totalGyms: 0, pendingRequests: 0, totalMembers: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registrations');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, regRes, ownersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/registrations'),
        api.get('/admin/owners')
      ]);
      setStats(statsRes.data);
      setRegistrations(regRes.data);
      setOwners(ownersRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/registrations/${id}/approve`);
      toast.success('Registration approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection? (Will be sent to user)');
    if (reason === null) return;
    try {
      await api.put(`/admin/registrations/${id}/reject`, { reason });
      toast.success('Registration rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this owner? They will be locked out.')) return;
    try {
      await api.put(`/admin/owners/${id}/suspend`);
      toast.success('Owner suspended');
      fetchData();
    } catch (error) {
      toast.error('Failed to suspend');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await api.put(`/admin/owners/${id}/reactivate`);
      toast.success('Owner reactivated');
      fetchData();
    } catch (error) {
      toast.error('Failed to reactivate');
    }
  };

  const handleGodMode = (ownerId) => {
    sessionStorage.setItem('impersonateGymId', ownerId);
    navigate('/dashboard');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)' }}>Total Gyms</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalGyms}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)' }}>Pending Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.pendingRequests > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.pendingRequests}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)' }}>Platform Members</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalMembers}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button
          style={{ padding: '1rem', background: 'none', color: tab === 'registrations' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: tab === 'registrations' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
          onClick={() => setTab('registrations')}
        >
          Pending Registrations ({registrations.length})
        </button>
        <button
          style={{ padding: '1rem', background: 'none', color: tab === 'owners' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: tab === 'owners' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
          onClick={() => setTab('owners')}
        >
          Active Gym Owners ({owners.length})
        </button>
      </div>

      <div className="card">
        {tab === 'registrations' && (
          registrations.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No pending registrations.</p> : (
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Gym Name</th>
                  <th>Owner Name</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0' }}><strong>{reg.gymName}</strong></td>
                    <td>{reg.name}</td>
                    <td>{reg.email}</td>
                    <td>{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem', background: 'var(--success)' }} onClick={() => handleApprove(reg._id)}>Approve</button>
                      <button className="btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleReject(reg._id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'owners' && (
          owners.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No active owners.</p> : (
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Gym Name</th>
                  <th>Owner Details</th>
                  <th>Members</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map(owner => (
                  <tr key={owner._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0' }}><strong>{owner.gymName}</strong></td>
                    <td>
                      <div>{owner.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{owner.email}</div>
                    </td>
                    <td>{owner.memberCount}</td>
                    <td>{owner.staffCount}</td>
                    <td>
                      <span className={`badge badge-${owner.status === 'active' ? 'active' : 'danger'}`}>
                        {owner.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }} 
                        onClick={() => handleGodMode(owner._id)}
                        title="Impersonate this gym"
                      >
                        👁️ God Mode
                      </button>
                      {owner.status === 'active' ? (
                        <button className="btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleSuspend(owner._id)}>Suspend</button>
                      ) : (
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', background: 'var(--success)' }} onClick={() => handleReactivate(owner._id)}>Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
