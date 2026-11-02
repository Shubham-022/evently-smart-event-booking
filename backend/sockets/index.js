// backend/sockets/index.js
import {
  lockSeats,
  releaseSeats,
  releaseAllSeatsForSocket,
  releaseSeatHold,
} from '../utils/seatLock.js';

/**
 * Initialize Socket.IO event handlers.
 * Handles client room subscriptions, real-time seat locking, and live seat updates.
 */
export default function socketHandler(io) {
  io.on('connection', (socket) => {
    // Client joins event room
    socket.on('joinEvent', (data) => {
      const eventId = typeof data === 'object' && data !== null ? data.eventId : data;
      if (eventId) {
        const room = `event_${eventId}`;
        socket.join(room);
      }
    });

    // Client leaves event room
    socket.on('leaveEvent', (data) => {
      const eventId = typeof data === 'object' && data !== null ? data.eventId : data;
      if (eventId) {
        const room = `event_${eventId}`;
        socket.leave(room);
      }
    });

    // Interactive seat locking: lock specific seats
    socket.on('lockSeat', async (payload, callback) => {
      try {
        const eventId = payload.eventId;
        const seatNumbers = Array.isArray(payload.seatNumbers)
          ? payload.seatNumbers
          : payload.seatNumber
          ? [payload.seatNumber]
          : [];

        const res = await lockSeats({
          eventId,
          seatNumbers,
          socketId: socket.id,
          durationMs: payload.durationMs || 5 * 60 * 1000,
        });

        if (typeof callback === 'function') {
          callback(res);
        }
      } catch (err) {
        console.error('Socket lockSeat error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Interactive seat locking: release specific seats
    socket.on('releaseSeat', async (payload, callback) => {
      try {
        const eventId = payload.eventId;
        const seatNumbers = Array.isArray(payload.seatNumbers)
          ? payload.seatNumbers
          : payload.seatNumber
          ? [payload.seatNumber]
          : [];

        const res = await releaseSeats({
          eventId,
          seatNumbers,
          socketId: socket.id,
        });

        if (typeof callback === 'function') {
          callback(res);
        }
      } catch (err) {
        console.error('Socket releaseSeat error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Backwards-compatibility: holdSeats
    socket.on('holdSeats', async (payload, callback) => {
      try {
        const eventId = Number(payload.eventId);
        const quantity = Number(payload.quantity) || 1;
        if (eventId) {
          io.to(`event_${eventId}`).emit('seatsHeld', {
            eventId,
            heldQuantity: quantity,
          });
        }
        if (typeof callback === 'function') {
          callback({ success: true, heldQuantity: quantity });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Backwards-compatibility: releaseHold
    socket.on('releaseHold', async (payload, callback) => {
      try {
        const res = await releaseSeatHold(payload.lockId);
        if (typeof callback === 'function') {
          callback({ success: res });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Clean up all held seats when user disconnects
    socket.on('disconnect', () => {
      releaseAllSeatsForSocket(socket.id);
    });
  });
}
