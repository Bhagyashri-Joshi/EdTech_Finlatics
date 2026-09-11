import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 125000),
  headers: { Accept: 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('engageai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('engageai_token');
      localStorage.removeItem('engageai_user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);
