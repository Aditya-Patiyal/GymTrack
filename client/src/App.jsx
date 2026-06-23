import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import StaffPage from './pages/StaffPage';
import DeleteRequestsPage from './pages/DeleteRequestsPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Components
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'super_admin') {
    const isImpersonating = sessionStorage.getItem('impersonateGymId');
    if (!isImpersonating) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (ownerOnly && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  
  // Clear impersonation when entering admin dash
  sessionStorage.removeItem('impersonateGymId');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Super Admin Portal</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
          <button 
            className="btn-secondary" 
            onClick={() => {
              sessionStorage.removeItem('userInfo');
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading App...</div>;

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={
          user ? (user.role === 'super_admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />) : <LoginPage />
        } />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute><MemberDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />

        {/* Owner-only routes */}
        <Route path="/staff" element={<ProtectedRoute ownerOnly={true}><StaffPage /></ProtectedRoute>} />
        <Route path="/delete-requests" element={<ProtectedRoute ownerOnly={true}><DeleteRequestsPage /></ProtectedRoute>} />

        {/* Super Admin routes */}
        <Route path="/admin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />

        <Route path="*" element={<Navigate to={user ? (user.role === 'super_admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default App;
