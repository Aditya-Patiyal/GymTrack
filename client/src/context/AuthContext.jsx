import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const userInfo = sessionStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const { data } = await api.get('/auth/me');
          const currentInfo = JSON.parse(userInfo);
          setUser({ ...currentInfo, ...data });
        } catch (error) {
          console.error('Token invalid or expired');
          sessionStorage.removeItem('userInfo');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, gymName) => {
    const response = await api.post('/auth/register', { name, email, password, gymName });
    if (response.status === 202 && response.data.pending) {
      return { pending: true, message: response.data.message };
    }
    sessionStorage.setItem('userInfo', JSON.stringify(response.data));
    setUser(response.data);
    return response.data;
  };

  const logout = () => {
    sessionStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
