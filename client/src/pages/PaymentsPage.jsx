import { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/payments/pending'),
        api.get('/payments/history')
      ]);
      setPending(pendingRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [paymentModal, setPaymentModal] = useState({
    show: false,
    paymentId: null,
    method: 'cash',
    paidAt: new Date().toISOString().split('T')[0]
  });

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/payments/${paymentModal.paymentId}/mark-paid`, {
        method: paymentModal.method,
        paidAt: paymentModal.paidAt
      });
      toast.success('Payment marked as paid');
      setPaymentModal({ show: false, paymentId: null, method: 'cash', paidAt: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      toast.error('Error marking payment');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Payments & Revenue</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button
          style={{ padding: '1rem', background: 'none', color: activeTab === 'pending' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'pending' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
          onClick={() => setActiveTab('pending')}
        >
          Pending Due ({pending.length})
        </button>
        <button
          style={{ padding: '1rem', background: 'none', color: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : activeTab === 'pending' ? (
          pending.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No pending payments! 🎉</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Amount Due</th>
                  <th>Date Added</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{p.member.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.member.phone}</div>
                    </td>
                    <td>{p.membership.planLabel}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--warning)' }}>₹{p.amount}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => setPaymentModal({ show: true, paymentId: p._id, method: 'cash', paidAt: new Date().toISOString().split('T')[0] })}>
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          history.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No payment history.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Date Paid</th>
                  <th>Collected By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{p.member.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.member.phone}</div>
                    </td>
                    <td>{p.membership.planLabel}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{p.amount}</td>
                    <td style={{ textTransform: 'uppercase' }}>
                      <span className="badge badge-active">{p.method}</span>
                    </td>
                    <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td>
                      {p.markedPaidBy ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiUser size={14} style={{ color: 'var(--text-secondary)' }} />
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{p.markedPaidBy.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.markedPaidBy.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
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

export default PaymentsPage;
