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

// Components
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && user.role !== 'owner') return <Navigate to="/dashboard" replace />;
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

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading App...</div>;

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute><MemberDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />

        {/* Owner-only routes */}
        <Route path="/staff" element={<ProtectedRoute ownerOnly={true}><StaffPage /></ProtectedRoute>} />
        <Route path="/delete-requests" element={<ProtectedRoute ownerOnly={true}><DeleteRequestsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default App;
