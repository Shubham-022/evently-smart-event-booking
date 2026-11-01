// backend/utils/seatLock.js
import pool from '../config/db.js';
import { getIo } from './socket.js';

// In-memory store: eventId -> array of { lockId, socketId, quantity, expiresAt, timer }
const activeHolds = new Map();

/**
 * Get total quantity of currently locked seats for an event
 */
export function getHeldSeatsForEvent(eventId) {
  const holds = activeHolds.get(Number(eventId)) || [];
  return holds.reduce((sum, h) => sum + h.quantity, 0);
}

/**
 * Attempt to hold seats temporarily (e.g. 5 minutes)
 */
export async function holdSeats({ eventId, quantity, socketId, durationMs = 5 * 60 * 1000 }) {
  const evId = Number(eventId);
  const qty = Number(quantity);

  if (!evId || qty <= 0) return { success: false, message: 'Invalid hold parameters' };

  // Fetch current available seats from database
  const [rows] = await pool.execute('SELECT available_seats FROM events WHERE id = ?', [evId]);
  if (rows.length === 0) return { success: false, message: 'Event not found' };

  const dbAvailable = Number(rows[0].available_seats);
  const alreadyHeld = getHeldSeatsForEvent(evId);
  const effectiveAvailable = dbAvailable - alreadyHeld;

  if (qty > effectiveAvailable) {
    return {
      success: false,
      message: 'Not enough seats available to hold',
      effectiveAvailable: Math.max(0, effectiveAvailable),
    };
  }

  const lockId = `lock_${evId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const expiresAt = Date.now() + durationMs;

  const timer = setTimeout(() => {
    releaseSeatHold(lockId, 'expired');
  }, durationMs);

  const lockRecord = {
    lockId,
    eventId: evId,
    socketId,
    quantity: qty,
    expiresAt,
    timer,
  };

  const list = activeHolds.get(evId) || [];
  list.push(lockRecord);
  activeHolds.set(evId, list);

  // Broadcast effective seat update to room
  broadcastSeatUpdate(evId, dbAvailable - getHeldSeatsForEvent(evId), qty);

  return {
    success: true,
    lockId,
    eventId: evId,
    quantity: qty,
    expiresAt,
    effectiveAvailable: dbAvailable - getHeldSeatsForEvent(evId),
  };
}

/**
 * Release a specific hold by lockId
 */
export async function releaseSeatHold(lockId, reason = 'released') {
  for (const [evId, list] of activeHolds.entries()) {
    const idx = list.findIndex(h => h.lockId === lockId);
    if (idx !== -1) {
      const [removed] = list.splice(idx, 1);
      if (removed.timer) clearTimeout(removed.timer);

      if (list.length === 0) {
        activeHolds.delete(evId);
      } else {
        activeHolds.set(evId, list);
      }

      // Query current DB seats and broadcast restored effective count
      try {
        const [rows] = await pool.execute('SELECT available_seats FROM events WHERE id = ?', [evId]);
        if (rows.length > 0) {
          const dbAvailable = Number(rows[0].available_seats);
          const currentHeld = getHeldSeatsForEvent(evId);
          broadcastSeatUpdate(evId, dbAvailable - currentHeld);
        }
      } catch (e) {
        console.error('Error broadcasting after hold release:', e);
      }

      return true;
    }
  }
  return false;
}

/**
 * Release all holds belonging to a disconnected socket
 */
export async function releaseHoldsForSocket(socketId) {
  if (!socketId) return;
  for (const [evId, list] of activeHolds.entries()) {
    const toRemove = list.filter(h => h.socketId === socketId);
    if (toRemove.length > 0) {
      for (const h of toRemove) {
        if (h.timer) clearTimeout(h.timer);
      }
      const remaining = list.filter(h => h.socketId !== socketId);
      if (remaining.length === 0) {
        activeHolds.delete(evId);
      } else {
        activeHolds.set(evId, remaining);
      }

      try {
        const [rows] = await pool.execute('SELECT available_seats FROM events WHERE id = ?', [evId]);
        if (rows.length > 0) {
          const dbAvailable = Number(rows[0].available_seats);
          broadcastSeatUpdate(evId, dbAvailable - getHeldSeatsForEvent(evId));
        }
      } catch (e) {
        console.error('Error broadcasting after socket disconnect release:', e);
      }
    }
  }
}

function broadcastSeatUpdate(eventId, availableSeats, heldQuantity = 0) {
  const io = getIo();
  if (io) {
    io.to(`event_${eventId}`).emit('seatUpdate', {
      eventId,
      availableSeats: Math.max(0, availableSeats),
      isTemporaryHold: true,
    });
    if (heldQuantity > 0) {
      io.to(`event_${eventId}`).emit('seatsHeld', {
        eventId,
        heldQuantity,
        availableSeats: Math.max(0, availableSeats),
      });
    }
  }
}

