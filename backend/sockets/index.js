// backend/sockets/index.js
import { getIo } from '../utils/socket.js';
import { holdSeats, releaseSeatHold, releaseHoldsForSocket } from '../utils/seatLock.js';

/**
 * Initialize Socket.IO event handlers.
 * Handles client room subscription for event‑specific seat updates and temporary holds.
 */
export default function socketHandler(io) {
  io.on('connection', (socket) => {
    // Client requests to join a specific event room
    socket.on('joinEvent', (data) => {
      const eventId = typeof data === 'object' && data !== null ? data.eventId : data;
      if (eventId) {
        const room = `event_${eventId}`;
        socket.join(room);
      }
    });

    // Client requests to leave a specific event room
    socket.on('leaveEvent', (data) => {
      const eventId = typeof data === 'object' && data !== null ? data.eventId : data;
      if (eventId) {
        const room = `event_${eventId}`;
        socket.leave(room);
      }
    });

    // Bonus: Temporary seat hold request
    socket.on('holdSeats', async (payload, callback) => {
      try {
        const res = await holdSeats({
          eventId: payload.eventId,
          quantity: payload.quantity,
          socketId: socket.id,
          durationMs: payload.durationMs || 5 * 60 * 1000,
        });
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Bonus: Release seat hold
    socket.on('releaseHold', async (payload, callback) => {
      try {
        const res = await releaseSeatHold(payload.lockId);
        if (typeof callback === 'function') callback({ success: res });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Auto-release any holds held by this disconnected client
      releaseHoldsForSocket(socket.id);
    });
  });
}
