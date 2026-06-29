import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Confirmation Modal ───────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, confirmLabel, danger, onConfirm, onCancel, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', maxWidth: '440px', width: '90%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin: '0 0 0.5rem', color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={{
              background: danger ? 'var(--danger)' : 'var(--success)',
              color: 'white', padding: '0.6rem 1.4rem', borderRadius: '8px',
              fontWeight: 600,
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bulk Action Toolbar ──────────────────────────────────────────────────────
const BulkToolbar = ({ count, tab, onApprove, onReject, onSuspend, onReactivate, onDelete, onClear, canDelete = true }) => (
  <div style={{
    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
    zIndex: 500, background: 'var(--bg-secondary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '12px', padding: '0.75rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    boxShadow: '0 8px 32px rgba(230,32,48,0.25)',
    animation: 'slideUp 0.2s ease',
  }}>
    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
      {count} selected
    </span>
    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

    {tab === 'registrations' && <>
      <button onClick={onApprove} style={toolBtn('var(--success)')}>✓ Approve All</button>
      <button onClick={onReject}  style={toolBtn('var(--warning)')}>✕ Reject All</button>
    </>}

    {tab === 'owners' && <>
      <button onClick={onSuspend}    style={toolBtn('var(--warning)')}>⏸ Suspend</button>
      <button onClick={onReactivate} style={toolBtn('var(--success)')}>▶ Reactivate</button>
      {canDelete
        ? <button onClick={onDelete} style={toolBtn('var(--danger)')}>🗑 Delete</button>
        : (
          <span
            title="Delete is only available when all selected accounts are Suspended first."
            style={{ ...toolBtn('var(--inactive)'), cursor: 'not-allowed', opacity: 0.4, display: 'inline-flex', alignItems: 'center' }}
          >
            🗑 Delete
          </span>
        )
      }
    </>}

    <button onClick={onClear} style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem 0.4rem', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
  </div>
);

const toolBtn = (color) => ({
  background: `${color}22`,
  color,
  border: `1px solid ${color}55`,
  borderRadius: '8px',
  padding: '0.4rem 0.85rem',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
});

// ─── Main Component ───────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ totalGyms: 0, pendingRequests: 0, totalMembers: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registrations');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Selection state
  const [selectedReg, setSelectedReg] = useState(new Set());
  const [selectedOwner, setSelectedOwner] = useState(new Set());

  // Modal state
  const [modal, setModal] = useState(null); // { action, ids, reason }
  const [rejectReason, setRejectReason] = useState('');

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, regRes, ownersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/registrations'),
        api.get('/admin/owners'),
      ]);
      setStats(statsRes.data);
      setRegistrations(regRes.data);
      setOwners(ownersRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Clear selections when switching tabs
  const switchTab = (t) => { setTab(t); setSelectedReg(new Set()); setSelectedOwner(new Set()); };

  // ── Single-row handlers (unchanged) ──────────────────────────────────────
  const handleApprove = async (id) => {
    try { await api.put(`/admin/registrations/${id}/approve`); toast.success('Registration approved'); fetchData(); }
    catch { toast.error('Failed to approve'); }
  };
  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection? (Will be sent to user)');
    if (reason === null) return;
    try { await api.put(`/admin/registrations/${id}/reject`, { reason }); toast.success('Registration rejected'); fetchData(); }
    catch { toast.error('Failed to reject'); }
  };
  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this owner? They will be locked out.')) return;
    try { await api.put(`/admin/owners/${id}/suspend`); toast.success('Owner suspended'); fetchData(); }
    catch { toast.error('Failed to suspend'); }
  };
  const handleReactivate = async (id) => {
    try { await api.put(`/admin/owners/${id}/reactivate`); toast.success('Owner reactivated'); fetchData(); }
    catch { toast.error('Failed to reactivate'); }
  };
  const handleGodMode = (ownerId) => { sessionStorage.setItem('impersonateGymId', ownerId); navigate('/dashboard'); };

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleReg = (id) => setSelectedReg(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleOwner = (id) => setSelectedOwner(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAllReg = () => setSelectedReg(selectedReg.size === registrations.length ? new Set() : new Set(registrations.map(r => r._id)));
  const toggleAllOwner = (filtered) => setSelectedOwner(selectedOwner.size === filtered.length ? new Set() : new Set(filtered.map(o => o._id)));

  // ── Bulk action execution ─────────────────────────────────────────────────
  const execBulk = async () => {
    const { action, ids, reason } = modal;
    setModal(null);
    try {
      if (action === 'approve')    await api.put('/admin/bulk/approve',     { ids: [...ids] });
      if (action === 'reject')     await api.put('/admin/bulk/reject',      { ids: [...ids], reason });
      if (action === 'suspend')    await api.put('/admin/bulk/suspend',     { ids: [...ids] });
      if (action === 'reactivate') await api.put('/admin/bulk/reactivate',  { ids: [...ids] });
      if (action === 'delete')     await api.delete('/admin/bulk/delete',   { data: { ids: [...ids] } });
      toast.success(`Bulk ${action} completed`);
      setSelectedReg(new Set()); setSelectedOwner(new Set());
      fetchData();
    } catch { toast.error(`Bulk ${action} failed`); }
  };

  const openModal = (action, ids) => { setRejectReason(''); setModal({ action, ids }); };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>;

  const filtered = ownerFilter === 'all' ? owners : owners.filter(o => o.status === ownerFilter);
  const allRegSelected = registrations.length > 0 && selectedReg.size === registrations.length;
  const allOwnerSelected = filtered.length > 0 && selectedOwner.size === filtered.length;

  return (
    <div>
      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card"><div style={{ color: 'var(--text-secondary)' }}>Total Gyms</div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalGyms}</div></div>
        <div className="card"><div style={{ color: 'var(--text-secondary)' }}>Pending Requests</div><div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.pendingRequests > 0 ? 'var(--warning)' : 'inherit' }}>{stats.pendingRequests}</div></div>
        <div className="card"><div style={{ color: 'var(--text-secondary)' }}>Platform Members</div><div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalMembers}</div></div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex' }}>
          {[['registrations', `Pending Registrations (${registrations.length})`], ['owners', `All Gyms (${owners.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => switchTab(key)} style={{
              padding: '1rem', background: 'none', fontWeight: 600,
              color: tab === key ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: tab === key ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'owners' && (
          <div style={{ display: 'flex', gap: '0.4rem', paddingBottom: '0.75rem' }}>
            {['all', 'active', 'suspended'].map(f => (
              <button key={f} onClick={() => setOwnerFilter(f)} style={{
                padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                border: `1px solid ${ownerFilter === f ? (f === 'suspended' ? 'var(--danger)' : f === 'active' ? 'var(--success)' : 'var(--accent-primary)') : 'var(--border)'}`,
                background: ownerFilter === f ? (f === 'suspended' ? 'rgba(230,32,48,0.12)' : f === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(230,32,48,0.12)') : 'transparent',
                color: ownerFilter === f ? (f === 'suspended' ? 'var(--danger)' : f === 'active' ? 'var(--success)' : 'var(--accent-primary)') : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}>
                {f === 'all' ? `All (${owners.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${owners.filter(o => o.status === f).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tables ── */}
      <div className="card">

        {/* REGISTRATIONS TABLE */}
        {tab === 'registrations' && (
          registrations.length === 0
            ? <p style={{ color: 'var(--text-secondary)' }}>No pending registrations.</p>
            : (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={allRegSelected} onChange={toggleAllReg}
                        style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} />
                    </th>
                    <th>Gym Name</th><th>Owner Name</th><th>Email</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <tr key={reg._id} style={{ borderBottom: '1px solid var(--border)', background: selectedReg.has(reg._id) ? 'rgba(230,32,48,0.06)' : 'transparent' }}>
                      <td><input type="checkbox" checked={selectedReg.has(reg._id)} onChange={() => toggleReg(reg._id)}
                        style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} /></td>
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

        {/* OWNERS TABLE */}
        {tab === 'owners' && (
          filtered.length === 0
            ? <p style={{ color: 'var(--text-secondary)' }}>No {ownerFilter !== 'all' ? ownerFilter : ''} gyms found.</p>
            : (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={allOwnerSelected} onChange={() => toggleAllOwner(filtered)}
                        style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} />
                    </th>
                    <th>Gym Name</th><th>Owner Details</th><th>Members</th><th>Staff</th><th>Status</th><th>Since</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(owner => (
                    <tr key={owner._id} style={{ borderBottom: '1px solid var(--border)', background: selectedOwner.has(owner._id) ? 'rgba(230,32,48,0.06)' : 'transparent' }}>
                      <td><input type="checkbox" checked={selectedOwner.has(owner._id)} onChange={() => toggleOwner(owner._id)}
                        style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} /></td>
                      <td style={{ padding: '1rem 0' }}><strong>{owner.gymName}</strong></td>
                      <td>
                        <div>{owner.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{owner.email}</div>
                      </td>
                      <td>{owner.memberCount}</td>
                      <td>{owner.staffCount}</td>
                      <td><span className={`badge badge-${owner.status === 'active' ? 'active' : 'danger'}`}>{owner.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {owner.status === 'active' && owner.approvedAt
                          ? <><span style={{ color: 'var(--success)', fontWeight: 600 }}>Approved</span><br />{fmtDate(owner.approvedAt)}</>
                          : owner.status === 'suspended' && owner.suspendedAt
                          ? <><span style={{ color: 'var(--danger)', fontWeight: 600 }}>Suspended</span><br />{fmtDate(owner.suspendedAt)}</>
                          : <span>—</span>
                        }
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                          onClick={() => handleGodMode(owner._id)} title="Impersonate this gym">👁️ God Mode</button>
                        {owner.status === 'active'
                          ? <button className="btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleSuspend(owner._id)}>Suspend</button>
                          : <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', background: 'var(--success)' }} onClick={() => handleReactivate(owner._id)}>Reactivate</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}
      </div>

      {/* ── Floating Bulk Toolbar ── */}
      {tab === 'registrations' && selectedReg.size > 0 && (
        <BulkToolbar
          count={selectedReg.size} tab="registrations"
          onApprove={() => openModal('approve', selectedReg)}
          onReject={() => openModal('reject', selectedReg)}
          onClear={() => setSelectedReg(new Set())}
        />
      )}
      {tab === 'owners' && selectedOwner.size > 0 && (() => {
        // Delete is only allowed when EVERY selected owner is suspended
        const canDelete = [...selectedOwner].every(id => {
          const owner = owners.find(o => o._id === id);
          return owner?.status === 'suspended';
        });
        return (
          <BulkToolbar
            count={selectedOwner.size} tab="owners"
            canDelete={canDelete}
            onSuspend={() => openModal('suspend', selectedOwner)}
            onReactivate={() => openModal('reactivate', selectedOwner)}
            onDelete={() => openModal('delete', selectedOwner)}
            onClear={() => setSelectedOwner(new Set())}
          />
        );
      })()}

      {/* ── Confirmation Modal ── */}
      <ConfirmModal
        isOpen={!!modal}
        title={
          modal?.action === 'approve'    ? `Approve ${modal.ids.size} Registration(s)` :
          modal?.action === 'reject'     ? `Reject ${modal.ids.size} Registration(s)` :
          modal?.action === 'suspend'    ? `Suspend ${modal.ids.size} Gym(s)` :
          modal?.action === 'reactivate' ? `Reactivate ${modal.ids.size} Gym(s)` :
          modal?.action === 'delete'     ? `⚠️ Permanently Delete ${modal.ids.size} Gym(s)` : ''
        }
        message={
          modal?.action === 'delete'
            ? 'This will permanently erase the selected gym accounts, all their members, and all associated staff. This action CANNOT be undone.'
            : modal?.action === 'suspend'
            ? 'All selected owners and their staff will be locked out immediately.'
            : modal?.action === 'reject'
            ? 'Provide a reason for rejection. This will be shared with all selected applicants.'
            : `Are you sure you want to ${modal?.action} all selected accounts?`
        }
        confirmLabel={
          modal?.action === 'delete' ? 'Yes, Delete Permanently' :
          modal?.action === 'approve' ? 'Approve All' :
          modal?.action === 'reject' ? 'Reject All' :
          modal?.action === 'suspend' ? 'Suspend All' : 'Reactivate All'
        }
        danger={modal?.action === 'delete' || modal?.action === 'suspend' || modal?.action === 'reject'}
        onConfirm={() => execBulk()}
        onCancel={() => setModal(null)}
      >
        {modal?.action === 'reject' && (
          <textarea
            value={rejectReason}
            onChange={e => { setRejectReason(e.target.value); setModal(m => ({ ...m, reason: e.target.value })); }}
            placeholder="Rejection reason (optional but recommended)…"
            rows={3}
            style={{
              width: '100%', marginBottom: '1rem', padding: '0.75rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical',
              fontFamily: 'inherit', fontSize: '0.9rem',
            }}
          />
        )}
      </ConfirmModal>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
