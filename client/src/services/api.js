import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const userinfo = sessionStorage.getItem('userInfo');
    if (userinfo) {
      const { token } = JSON.parse(userinfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Support God Mode impersonation
    const impersonateGymId = sessionStorage.getItem('impersonateGymId');
    if (impersonateGymId) {
      config.headers['X-Gym-Id'] = impersonateGymId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
