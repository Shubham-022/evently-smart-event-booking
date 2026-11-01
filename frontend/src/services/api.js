// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT based on request route context (admin vs user separation)
api.interceptors.request.use((config) => {
  if (config.headers.Authorization) return config;

  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  const adminToken = localStorage.getItem('evently_admin_token') || localStorage.getItem('evently_token');
  const userToken = localStorage.getItem('evently_user_token');

  // Check if target is an admin endpoint or admin-level mutation on /events
  const isAdminEndpoint =
    url.startsWith('/admin') ||
    url.startsWith('/auth/admin') ||
    (url.startsWith('/events') && ['post', 'put', 'delete'].includes(method));

  if (isAdminEndpoint) {
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    // User endpoint or general authenticated endpoint (e.g. /users/*, /bookings)
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else if (adminToken && (url.startsWith('/bookings') || url.startsWith('/events'))) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }

  return config;
});

export default api;
