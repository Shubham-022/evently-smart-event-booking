// src/services/adminService.js
import api from './api';

// Auth - dedicated admin login endpoint
export const adminLogin  = (creds) => api.post('/admin/login', creds);

// Stats & Analytics
export const getStats     = (range = 'all') => api.get(`/admin/stats?range=${range}`);
export const getAnalytics = (range = 'all') => api.get(`/admin/analytics?range=${range}`);

// CSV Reports
export const exportBookingsCsv = () => api.get('/admin/reports/bookings/export', { responseType: 'blob' });
export const exportEventsCsv   = () => api.get('/admin/reports/events/export', { responseType: 'blob' });

// Events (CRUD – reuse existing endpoints, JWT auto-attached by api.js interceptor)
export const getAllEvents  = () => api.get('/events');
export const getEventById = (id) => api.get(`/events/${id}`);
export const createEvent  = (data) => api.post('/events', data);
export const updateEvent  = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent  = (id) => api.delete(`/events/${id}`);

// Bookings
export const getAllBookings  = () => api.get('/bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const cancelBooking  = (id) => api.put(`/bookings/${id}/cancel`);
