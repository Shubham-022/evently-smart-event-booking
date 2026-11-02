// src/services/eventsService.js
import api from './api';

export const getEvents        = (params) => api.get('/events', { params });
export const getEventById     = (id)     => api.get(`/events/${id}`);
export const getEventSeats    = (id)     => api.get(`/events/${id}/seats`);
export const getRelatedEvents = (id, category) =>
  api.get(`/events/${id}/related${category ? `?category=${encodeURIComponent(category)}` : ''}`);
export const createEvent      = (data)   => api.post('/events', data);
export const updateEvent      = (id, d)  => api.put(`/events/${id}`, d);
export const deleteEvent      = (id)     => api.delete(`/events/${id}`);
