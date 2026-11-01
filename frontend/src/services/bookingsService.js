// src/services/bookingsService.js
import api from './api';

export const createBooking = (payload) => api.post('/bookings', payload);
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const verifyBooking = (reference) => api.get(`/bookings/verify/${encodeURIComponent(reference)}`);
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);
