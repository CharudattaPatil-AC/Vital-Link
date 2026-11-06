import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Add JWT token from sessionStorage (isolated per window/tab) or localStorage
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
