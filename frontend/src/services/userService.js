// src/services/userService.js
import api from './api';

// Authentication
export const userRegister = (data) => api.post('/auth/register', data);
export const userLogin    = (creds) => api.post('/auth/login', creds);

// User Profile
export const getUserProfile    = () => api.get('/users/profile');
export const updateUserProfile = (data) => api.put('/users/profile', data);

// User Bookings
export const getUserBookings   = () => api.get('/users/bookings');
export const cancelUserBooking = (bookingId) => api.put(`/bookings/${bookingId}/cancel`);

