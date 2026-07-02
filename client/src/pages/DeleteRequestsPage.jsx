import { useState, useEffect } from 'react';
import { FiAlertOctagon, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusStyles = {
  pending: { color: 'var(--warning)', label: '⏳ Pending' },
  approved: { color: 'var(--success)', label: '✅ Approved' },
  rejected: { color: 'var(--danger)', label: '❌ Rejected' },
};

const DeleteRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/delete-requests');
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load delete requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id, memberName) => {
    if (!window.confirm(`Approve deletion of "${memberName}"? This will deactivate the member.`)) return;
    try {
      await api.put(`/delete-requests/${id}/approve`);
      toast.success('Request approved. Member deactivated.');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/delete-requests/${id}/reject`);
      toast.success('Request rejected.');
      fetchRequests();
    } catch (error) {
      toast.error('Error rejecting request');
    }
  };

  const filtered = requests.filter(r => r.status === filter);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Delete Requests</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Staff-raised requests to deactivate gym members. Approve or reject each request.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {['pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            style={{
              padding: '0.75rem 1.25rem', background: 'none', fontWeight: 600,
              textTransform: 'capitalize',
              color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: filter === f ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}
            onClick={() => setFilter(f)}
          >
            {f} ({requests.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FiAlertOctagon size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <div>No {filter} requests.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Type</th>
                <th>Requested By</th>
                <th>Reason</th>
                <th>Requested At</th>
                <th>Status</th>
                {filter === 'pending' && <th>Actions</th>}
                {filter !== 'pending' && <th>Resolved By</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{req.member?.name || '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.member?.phone}</div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                      background: req.type === 'inactive' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                      color: req.type === 'inactive' ? 'var(--warning)' : 'var(--danger)',
                    }}>
                      {req.type === 'inactive' ? '⚫ Set Inactive' : '🗑️ Delete'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{req.requestedBy?.name || '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{req.requestedBy?.role}</div>
                  </td>
                  <td style={{ color: req.reason ? 'var(--text-primary)' : 'var(--text-secondary)', maxWidth: '200px' }}>
                    {req.reason || 'No reason provided'}
                  </td>
                  <td>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span style={{ color: statusStyles[req.status].color, fontWeight: '600', fontSize: '0.85rem' }}>
                      {statusStyles[req.status].label}
                    </span>
                  </td>
                  {filter === 'pending' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApprove(req._id, req.member?.name)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <FiCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <FiXCircle /> Reject
                        </button>
                      </div>
                    </td>
                  )}
                  {filter !== 'pending' && (
                    <td>
                      {req.resolvedBy ? (
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{req.resolvedBy.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DeleteRequestsPage;
