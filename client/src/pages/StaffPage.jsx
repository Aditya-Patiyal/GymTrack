import { useState, useEffect } from 'react';
import { FiUserPlus, FiTrash2, FiUser } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/staff');
      setStaff(data);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/staff', newStaff);
      toast.success(`Staff account created for ${newStaff.name}`);
      setShowModal(false);
      setNewStaff({ name: '', email: '', password: '' });
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (id, name) => {
    if (!window.confirm(`Remove ${name} from your staff? They will lose access immediately.`)) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to remove staff member');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Staff Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Create and manage staff accounts for your gym.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiUserPlus /> Add Staff
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading staff...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FiUser size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <div>No staff members yet.</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click "Add Staff" to invite your first team member.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Gym</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{s.name}</div>
                    <span className="badge badge-inactive" style={{ fontSize: '0.7rem' }}>Staff</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                  <td>{s.gymName}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <button
                      className="btn-danger"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                      onClick={() => handleRemoveStaff(s._id, s.name)}
                      title="Remove Staff"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Add New Staff Member</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This account will be linked to your gym. Share the email and password with your staff member to let them log in.
            </p>
            <form onSubmit={handleCreateStaff}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  required
                  placeholder="staff@yourgym.com"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Temporary Password</label>
                <input
                  type="password"
                  className="input-field"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setNewStaff({ name: '', email: '', password: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
