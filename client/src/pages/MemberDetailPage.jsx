import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiCalendar, FiPhone } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [member, setMember] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const [memberRes, historyRes] = await Promise.all([
          api.get(`/members/${id}`),
          api.get(`/memberships/member/${id}`)
        ]);
        setMember(memberRes.data);
        setHistory(historyRes.data);
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/members')} style={{ padding: '0.5rem' }}>
          <FiArrowLeft />
        </button>
        <h1 style={{ margin: 0 }}>Member Details</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Profile Card */}
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
          </div>
        </div>

        {/* History Table */}
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
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((plan, index) => {
                    const isLatest = index === 0;
                    const endDate = new Date(plan.endDate);
                    const isExpired = endDate < new Date();

                    return (
                      <tr key={plan._id} style={{ opacity: !isLatest && isExpired ? 0.6 : 1 }}>
                        <td style={{ fontWeight: isLatest ? 'bold' : 'normal' }}>
                          {plan.planLabel} {isLatest && <span className="badge badge-active" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>Current</span>}
                        </td>
                        <td>₹{plan.price}</td>
                        <td>{new Date(plan.startDate).toLocaleDateString()}</td>
                        <td>{endDate.toLocaleDateString()}</td>
                        <td>
                          {isExpired ? (
                            <span style={{ color: 'var(--danger)' }}>Expired</span>
                          ) : (
                            <span style={{ color: 'var(--success)' }}>Valid</span>
                          )}
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
  );
};

export default MemberDetailPage;
