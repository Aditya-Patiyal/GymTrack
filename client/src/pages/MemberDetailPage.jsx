import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiCalendar, FiPhone, FiUserPlus, FiDollarSign } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

// Payment method badge styles
const methodStyle = (method) => {
  const styles = {
    cash:    { bg: 'rgba(34,197,94,0.12)',  color: 'var(--success)',         label: 'Cash' },
    upi:     { bg: 'rgba(99,102,241,0.12)', color: '#818cf8',               label: 'UPI' },
    card:    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa',               label: 'Card' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)',        label: 'Pending' },
  };
  return styles[method] || styles.pending;
};

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember]   = useState(null);
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const [memberRes, historyRes, paymentsRes] = await Promise.all([
          api.get(`/members/${id}`),
          api.get(`/memberships/member/${id}`),
          api.get(`/payments/member/${id}`),
        ]);
        setMember(memberRes.data);
        setHistory(historyRes.data);
        setPayments(paymentsRes.data);
      } catch (error) {
        toast.error('Failed to load member details');
        navigate('/members');
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, [id, navigate]);

  if (loading) return <div>Loading member details...</div>;
  if (!member) return <div>Member not found.</div>;

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/members')} style={{ padding: '0.5rem' }}>
          <FiArrowLeft />
        </button>
        <h1 style={{ margin: 0 }}>Member Details</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>

        {/* ── Profile Card ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', color: 'white', margin: '0 auto 1rem'
            }}>
              <FiUser />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>{member.name}</h2>
            <span className={`badge badge-${member.isActive ? 'active' : 'inactive'}`}>
              {member.isActive ? '🟢 Active Account' : '⚫ Inactive Account'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <FiPhone /> <span style={{ color: 'var(--text-primary)' }}>{member.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <FiUser /> <span style={{ color: 'var(--text-primary)' }}>{member.gender}, {member.age} years old</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <FiCalendar /> <span style={{ color: 'var(--text-primary)' }}>Joined: {new Date(member.joinDate).toLocaleDateString()}</span>
            </div>

            {/* Financial Summary */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
              padding: '0.85rem', borderRadius: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Paid</div>
                <div style={{ fontWeight: '700', color: 'var(--success)', fontSize: '1.1rem' }}>₹{totalPaid.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pending</div>
                <div style={{ fontWeight: '700', color: totalPending > 0 ? 'var(--warning)' : 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  ₹{totalPending.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Added By */}
            {member.addedBy && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '0.85rem', borderRadius: '8px',
                background: 'rgba(var(--accent-primary-rgb, 99, 102, 241), 0.08)',
                border: '1px solid var(--border)',
              }}>
                <FiUserPlus style={{ color: 'var(--accent-primary)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Added by</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{member.addedBy.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {member.addedBy.role} · {new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Membership History + Transaction History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Membership History */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Membership History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No plan history available.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Price</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Enrolled By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((plan, index) => {
                      const isLatest  = index === 0;
                      const endDate   = new Date(plan.endDate);
                      const isExpired = endDate < new Date();
                      return (
                        <tr key={plan._id} style={{ opacity: !isLatest && isExpired ? 0.6 : 1 }}>
                          <td style={{ fontWeight: isLatest ? 'bold' : 'normal' }}>
                            {plan.planLabel}
                            {isLatest && <span className="badge badge-active" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>Current</span>}
                          </td>
                          <td>₹{plan.price}</td>
                          <td>{new Date(plan.startDate).toLocaleDateString()}</td>
                          <td>{endDate.toLocaleDateString()}</td>
                          <td>
                            {plan.collectedBy ? (
                              <div>
                                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{plan.collectedBy.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{plan.collectedBy.role}</div>
                              </div>
                            ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                          </td>
                          <td>
                            {isExpired
                              ? <span style={{ color: 'var(--danger)' }}>Expired</span>
                              : <span style={{ color: 'var(--success)' }}>Valid</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <FiDollarSign style={{ color: 'var(--accent-primary)', fontSize: '1.2rem' }} />
              <h3 style={{ margin: 0 }}>Transaction History</h3>
            </div>

            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No transactions recorded yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Payment Date</th>
                      <th>Collected By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => {
                      const m = methodStyle(payment.status === 'pending' ? 'pending' : payment.method);
                      return (
                        <tr key={payment._id}>
                          <td style={{ fontSize: '0.9rem' }}>
                            {payment.membership?.planLabel || '—'}
                          </td>
                          <td style={{ fontWeight: '600' }}>₹{payment.amount.toLocaleString()}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              background: m.bg,
                              color: m.color,
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            }}>
                              {m.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {payment.status === 'paid' ? fmtDate(payment.paidAt) : '—'}
                          </td>
                          <td>
                            {payment.markedPaidBy ? (
                              <div>
                                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{payment.markedPaidBy.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{payment.markedPaidBy.role}</div>
                              </div>
                            ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                          </td>
                          <td>
                            {payment.status === 'paid'
                              ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Paid</span>
                              : <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⏳ Pending</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MemberDetailPage;
