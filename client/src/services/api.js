import axios from 'axios';

/**
 * ActionGate Centralized Axios API Instance
 * Automatically resolves endpoint URL from Vite environment variables (import.meta.env).
 * Default fallback connects to IPv4 loopback on port 5001.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.port === '5001' ? 'http://127.0.0.1:5001/api/v1' : 'http://127.0.0.1:5000/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for future token injection or correlation IDs)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (centralized error logging)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn(`[ActionGate API ${error.response.status}]`, error.response.data);
    } else if (error.request) {
      console.warn('[ActionGate API] Network error / Gateway unreachable:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
