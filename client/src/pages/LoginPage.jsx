import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gymName: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Logged in successfully!');
      } else {
        await register(formData.name, formData.email, formData.password, formData.gymName);
        toast.success('Account created successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
          Gym<span style={{ color: 'var(--accent-primary)' }}>Pulse</span>
        </h2>
        
        <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: isLogin ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: isLogin ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: !isLogin ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: !isLogin ? '2px solid var(--accent-primary)' : '2px solid transparent', fontWeight: 600 }}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Your Name</label>
                <input type="text" name="name" className="input-field" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Gym Name</label>
                <input type="text" name="gymName" className="input-field" placeholder="PowerFit Gym" value={formData.gymName} onChange={handleChange} required />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" name="email" className="input-field" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" className="input-field" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
