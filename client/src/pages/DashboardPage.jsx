import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiActivity, FiAlertCircle, FiDollarSign, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [inactiveWarnings, setInactiveWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'owner';

  const [paymentModal, setPaymentModal] = useState({
    show: false,
    paymentId: null,
    method: 'cash',
    paidAt: new Date().toISOString().split('T')[0]
  });

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.stats);
      setReminders(data.reminders);
      setInactiveWarnings(data.inactiveWarnings || []);
    } catch (error) {
      console.error('Error fetching dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/payments/${paymentModal.paymentId}/mark-paid`, {
        method: paymentModal.method,
        paidAt: paymentModal.paidAt
      });
      toast.success('Payment marked as paid');
      setPaymentModal({ show: false, paymentId: null, method: 'cash', paidAt: new Date().toISOString().split('T')[0] });
      fetchDashboard();
    } catch (error) {
      toast.error('Error marking payment');
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  // Build stat cards — hide revenue for staff
  const statCards = [
    { title: 'Total Members', value: stats?.totalMembers || 0, icon: <FiUsers />, color: 'var(--accent-primary)' },
    { title: 'Active Members', value: stats?.activeMembers || 0, icon: <FiActivity />, color: 'var(--success)' },
    { title: 'Expiring Soon', value: stats?.expiringSoon || 0, icon: <FiAlertCircle />, color: 'var(--warning)' },
    ...(isOwner ? [{ title: 'Revenue (This Month)', value: `₹${stats?.revenue || 0}`, icon: <FiDollarSign />, color: 'var(--accent-secondary)' }] : []),
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${card.color}40, transparent)`,
              color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{card.title}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Requests Alert — Owner only */}
      {isOwner && stats?.pendingDeleteRequests > 0 && (
        <div
          onClick={() => navigate('/delete-requests')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)',
            borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1rem',
            cursor: 'pointer', transition: 'opacity 0.2s',
          }}
        >
          <FiAlertOctagon color="var(--danger)" size={22} />
          <div>
            <div style={{ fontWeight: '600', color: 'var(--danger)' }}>
              {stats.pendingDeleteRequests} Pending Staff Request{stats.pendingDeleteRequests > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Staff have raised member status change / deletion requests waiting for your approval.
            </div>
          </div>
        </div>
      )}

      {/* 30-Day Inactive Member Warning — Owner only */}
      {isOwner && inactiveWarnings.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)', border: '1px solid var(--warning)',
          borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <FiAlertCircle color="var(--warning)" size={20} />
            <span style={{ fontWeight: '600', color: 'var(--warning)' }}>
              {inactiveWarnings.length} Member{inactiveWarnings.length > 1 ? 's' : ''} Inactive for 30+ Days
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {inactiveWarnings.map((w, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.6rem 1rem',
              }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{w.member.name}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>{w.member.phone}</span>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--warning)', fontWeight: '600' }}>
                  ⚠️ {w.daysInactive} days inactive
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Go to <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/members')}>Members → Inactive</span> to review and delete if needed.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Reminders Panel */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiAlertCircle color="var(--warning)" /> Needs Attention
          </h3>

          {reminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No members are expiring soon.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reminders.map((reminder, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '0.2rem' }}>{reminder.member.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{reminder.member.phone} • {reminder.plan}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className={`badge badge-${reminder.status.level.includes('warning') ? 'warning' : 'danger'}`}>
                      {reminder.status.text}
                    </span>
                    {reminder.paymentId && (
                      <button
                        className="btn-primary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px' }}
                        onClick={() => setPaymentModal({ show: true, paymentId: reminder.paymentId, method: 'cash', paidAt: new Date().toISOString().split('T')[0] })}
                      >
                        <FiCheckCircle /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/members')}>
              + Add New Member
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/payments')}>
              Record Payment
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/members')}>
              View All Members
            </button>
            {isOwner && (
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/staff')}>
                Manage Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Confirm Payment</h2>
            <form onSubmit={handleMarkPaid}>
              <div className="input-group">
                <label>Payment Method</label>
                <select className="input-field" value={paymentModal.method} onChange={e => setPaymentModal({ ...paymentModal, method: e.target.value })}>
                  <option value="cash">Cash 💵</option>
                  <option value="upi">UPI 📱</option>
                  <option value="card">Card 💳</option>
                </select>
              </div>
              <div className="input-group">
                <label>Payment Date</label>
                <input type="date" className="input-field" required max={new Date().toISOString().split('T')[0]} value={paymentModal.paidAt} onChange={e => setPaymentModal({ ...paymentModal, paidAt: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPaymentModal({ show: false, paymentId: null, method: 'cash', paidAt: new Date().toISOString().split('T')[0] })}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--success)' }}>Confirm Paid</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
