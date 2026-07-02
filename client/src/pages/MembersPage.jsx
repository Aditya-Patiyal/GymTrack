import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiTrash2, FiAlertOctagon, FiUserX, FiUserCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'owner';

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/members?search=${searchTerm}&status=${filter === 'all' ? '' : filter}`);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filter]);

  // Modal State for Add Member
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', age: '', gender: 'Male', phone: '' });
  const [phoneError, setPhoneError] = useState('');
  const [planData, setPlanData] = useState({ plan: '1_month', startDate: new Date().toISOString().split('T')[0] });

  // Modal State for Renew Plan
  const [renewModal, setRenewModal] = useState({ show: false, memberId: null, memberName: '' });
  const [renewPlanData, setRenewPlanData] = useState({ plan: '1_month', startDate: new Date().toISOString().split('T')[0] });

  // Delete Request Modal (staff only)
  const [deleteRequestModal, setDeleteRequestModal] = useState({ show: false, memberId: null, memberName: '', reason: '', type: 'delete' });

  const handleAddMember = async (e) => {
    e.preventDefault();
    setPhoneError('');

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newMember.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const memberRes = await api.post('/members', newMember);

      const prices = { '1_month': 2500, '2_month': 4000, '4_month': 7000, 'yearly': 20000 };
      const labels = { '1_month': '1 Month', '2_month': '2 Months', '4_month': '4 Months', 'yearly': 'Yearly' };

      await api.post('/memberships', {
        memberId: memberRes.data._id,
        plan: planData.plan,
        planLabel: labels[planData.plan],
        price: prices[planData.plan],
        startDate: planData.startDate
      });

      toast.success('Member added successfully!');
      setShowModal(false);
      setNewMember({ name: '', age: '', gender: 'Male', phone: '' });
      setPhoneError('');
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding member');
    }
  };

  const handleRenewPlan = async (e) => {
    e.preventDefault();
    try {
      const prices = { '1_month': 2500, '2_month': 4000, '4_month': 7000, 'yearly': 20000 };
      const labels = { '1_month': '1 Month', '2_month': '2 Months', '4_month': '4 Months', 'yearly': 'Yearly' };

      await api.post('/memberships', {
        memberId: renewModal.memberId,
        plan: renewPlanData.plan,
        planLabel: labels[renewPlanData.plan],
        price: prices[renewPlanData.plan],
        startDate: renewPlanData.startDate
      });

      toast.success('Plan renewed successfully!');
      setRenewModal({ show: false, memberId: null, memberName: '' });
      fetchMembers();
    } catch (error) {
      toast.error('Error renewing plan');
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this member?')) {
      try {
        await api.delete(`/members/${id}`);
        toast.success('Member deactivated');
        fetchMembers();
      } catch (error) {
        toast.error('Failed to deactivate member');
      }
    }
  };

  const handleSetInactive = async (id) => {
    if (window.confirm('Set this member as inactive? Their data will be preserved.')) {
      try {
        await api.put(`/members/${id}/set-inactive`);
        toast.success('Member set to inactive');
        fetchMembers();
      } catch (error) {
        toast.error('Failed to set member inactive');
      }
    }
  };

  const handleReactivate = async (id) => {
    try {
      await api.put(`/members/${id}/reactivate`);
      toast.success('Member reactivated!');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to reactivate member');
    }
  };

  const handleDeleteRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/delete-requests', {
        memberId: deleteRequestModal.memberId,
        reason: deleteRequestModal.reason,
        type: deleteRequestModal.type || 'delete',
      });
      const label = deleteRequestModal.type === 'inactive' ? 'Inactive request' : 'Delete request';
      toast.success(`${label} sent to owner`);
      setDeleteRequestModal({ show: false, memberId: null, memberName: '', reason: '', type: 'delete' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending request');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Members</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Member
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name or phone..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: '🟢 Active' },
              { key: 'expiring', label: '🟡 Expiring' },
              { key: 'expired', label: '🔴 Expired' },
              { key: 'inactive-member', label: '⚫ Inactive' },
            ].map(f => (
              <button
                key={f.key}
                className={filter === f.key ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No members found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Added By</th>
                <th>Plan</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{member.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Age: {member.age} • {member.gender}</div>
                  </td>
                  <td>{member.phone}</td>
                  <td>
                    {member.addedBy ? (
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{member.addedBy.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{member.addedBy.role}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td>{member.currentPlan}</td>
                  <td>{member.endDate ? new Date(member.endDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge badge-${member.status.includes('Active') ? 'active' : member.status.includes('Expiring') ? 'warning' : member.status.includes('Expired') ? 'danger' : 'inactive'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    {member.isActive && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          onClick={() => setRenewModal({ show: true, memberId: member._id, memberName: member.name })}
                        >
                          Renew
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                          onClick={() => navigate(`/members/${member._id}`)}
                        >
                          Details
                        </button>
                        {isOwner ? (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {!member.isActive ? (
                              // Member is inactive — show Reactivate button
                              <button
                                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.82rem', background: 'rgba(34,197,94,0.12)', color: 'var(--success)', border: '1px solid var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                onClick={() => handleReactivate(member._id)}
                                title="Reactivate Member"
                              >
                                <FiUserCheck /> Reactivate
                              </button>
                            ) : (
                              // Member is active — show Set Inactive button
                              <button
                                style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.82rem', background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid var(--warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                onClick={() => handleSetInactive(member._id)}
                                title="Set Inactive"
                              >
                                <FiUserX /> Inactive
                              </button>
                            )}
                            <button
                              className="btn-danger"
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                              onClick={() => handleDeactivate(member._id)}
                              title="Permanently Delete Member"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ) : (
                          // Staff: can raise inactive or delete request
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.82rem', background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid var(--warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => setDeleteRequestModal({ show: true, memberId: member._id, memberName: member.name, reason: '', type: 'inactive' })}
                              title="Request Inactive Status"
                            >
                              <FiUserX />
                            </button>
                            <button
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer' }}
                              onClick={() => setDeleteRequestModal({ show: true, memberId: member._id, memberName: member.name, reason: '', type: 'delete' })}
                              title="Request Deletion"
                            >
                              <FiAlertOctagon />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <label>Name</label>
                <input type="text" className="input-field" required value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Age</label>
                  <input type="number" className="input-field" required value={newMember.age} onChange={e => setNewMember({ ...newMember, age: e.target.value })} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Gender</label>
                  <select className="input-field" value={newMember.gender} onChange={e => setNewMember({ ...newMember, gender: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="text" className="input-field" required value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} />
                {phoneError && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{phoneError}</span>}
              </div>

              <h3 style={{ margin: '1.5rem 0 1rem' }}>Assign Plan</h3>
              <div className="input-group">
                <label>Plan Duration</label>
                <select className="input-field" value={planData.plan} onChange={e => setPlanData({ ...planData, plan: e.target.value })}>
                  <option value="1_month">1 Month (₹2500)</option>
                  <option value="2_month">2 Months (₹4000)</option>
                  <option value="4_month">4 Months (₹7000)</option>
                  <option value="yearly">Yearly (₹20000)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Start Date</label>
                <input type="date" className="input-field" required value={planData.startDate} onChange={e => setPlanData({ ...planData, startDate: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Plan Modal */}
      {renewModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Renew Plan</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>For {renewModal.memberName}</p>
            <form onSubmit={handleRenewPlan}>
              <div className="input-group">
                <label>Select New Plan</label>
                <select className="input-field" value={renewPlanData.plan} onChange={e => setRenewPlanData({ ...renewPlanData, plan: e.target.value })}>
                  <option value="1_month">1 Month (₹2500)</option>
                  <option value="2_month">2 Months (₹4000)</option>
                  <option value="4_month">4 Months (₹7000)</option>
                  <option value="yearly">Yearly (₹20000)</option>
                </select>
              </div>
              <div className="input-group">
                <label>New Start Date</label>
                <input type="date" className="input-field" required value={renewPlanData.startDate} onChange={e => setRenewPlanData({ ...renewPlanData, startDate: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRenewModal({ show: false, memberId: null, memberName: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--success)' }}>Confirm Renew</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Request Modal — Staff only */}
      {deleteRequestModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>
              {deleteRequestModal.type === 'inactive' ? 'Request: Set Inactive' : 'Request Deletion'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {deleteRequestModal.type === 'inactive'
                ? <>Requesting to mark <strong>{deleteRequestModal.memberName}</strong> as inactive. Their data will be preserved. The gym owner will be notified.</>
                : <>Requesting deletion for <strong>{deleteRequestModal.memberName}</strong>. The gym owner will be notified to approve or reject.</>
              }
            </p>
            <form onSubmit={handleDeleteRequest}>
              <div className="input-group">
                <label>Reason (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Duplicate entry, customer request..."
                  value={deleteRequestModal.reason}
                  onChange={e => setDeleteRequestModal({ ...deleteRequestModal, reason: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteRequestModal({ show: false, memberId: null, memberName: '', reason: '' })}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: '600', cursor: 'pointer' }}>Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
