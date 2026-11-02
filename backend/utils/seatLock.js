// backend/utils/seatLock.js
import pool from '../config/db.js';
import { getIo } from './socket.js';

// In-memory store: eventId (number) -> Map: seatNumber (string) -> { socketId, expiresAt, timer, lockId }
const seatLocks = new Map();

/**
 * Get all active locks for an event
 */
export function getLockedSeatsForEvent(eventId) {
  const evId = Number(eventId);
  const locks = seatLocks.get(evId);
  if (!locks || locks.size === 0) return [];

  const now = Date.now();
  const result = [];
  for (const [seatNumber, lock] of locks.entries()) {
    if (lock.expiresAt > now) {
      result.push({
        seatNumber,
        socketId: lock.socketId,
        lockId: lock.lockId,
        expiresAt: lock.expiresAt,
      });
    }
  }
  return result;
}

/**
 * Get count of held seats for an event (backwards compatibility)
 */
export function getHeldSeatsForEvent(eventId) {
  return getLockedSeatsForEvent(eventId).length;
}

/**
 * Lock specific seats for a socket for a given duration (default 5 min)
 */
export async function lockSeats({ eventId, seatNumbers, socketId, durationMs = 5 * 60 * 1000 }) {
  const evId = Number(eventId);
  if (!evId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return { success: false, message: 'Invalid lock parameters' };
  }

  if (!seatLocks.has(evId)) {
    seatLocks.set(evId, new Map());
  }
  const evLocks = seatLocks.get(evId);
  const now = Date.now();

  // 1. Verify in database whether any of the seats are already booked
  const placeholders = seatNumbers.map(() => '?').join(',');
  const [dbRows] = await pool.execute(
    `SELECT seat_number, status FROM event_seats WHERE event_id = ? AND seat_number IN (${placeholders})`,
    [evId, ...seatNumbers]
  );

  const dbStatusMap = {};
  for (const row of dbRows) {
    dbStatusMap[row.seat_number] = row.status;
  }

  // Check conflicts
  const blocked = [];
  for (const sn of seatNumbers) {
    if (dbStatusMap[sn] === 'booked') {
      blocked.push(sn);
      continue;
    }
    const existing = evLocks.get(sn);
    if (existing && existing.expiresAt > now && existing.socketId !== socketId) {
      blocked.push(sn);
    }
  }

  if (blocked.length > 0) {
    return {
      success: false,
      message: 'Some seats are unavailable or held by another user',
      blocked,
    };
  }

  // 2. Apply locks
  const lockedNow = [];
  for (const sn of seatNumbers) {
    const existing = evLocks.get(sn);
    if (existing && existing.timer) {
      clearTimeout(existing.timer);
    }

    const lockId = `lock_${evId}_${sn}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = now + durationMs;
    const timer = setTimeout(() => {
      releaseSeatsByLockId(evId, sn, lockId);
    }, durationMs);

    evLocks.set(sn, { socketId, expiresAt, timer, lockId });
    lockedNow.push(sn);
  }

  broadcastSeatLockUpdate(evId);

  return {
    success: true,
    lockedSeats: lockedNow,
    expiresAt: now + durationMs,
  };
}

/**
 * Release specific seats held by a socket
 */
export async function releaseSeats({ eventId, seatNumbers, socketId }) {
  const evId = Number(eventId);
  if (!evId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return { success: true };
  }

  const evLocks = seatLocks.get(evId);
  if (!evLocks) return { success: true };

  let changed = false;
  for (const sn of seatNumbers) {
    const lock = evLocks.get(sn);
    if (lock && (!socketId || lock.socketId === socketId)) {
      if (lock.timer) clearTimeout(lock.timer);
      evLocks.delete(sn);
      changed = true;
    }
  }

  if (evLocks.size === 0) {
    seatLocks.delete(evId);
  }

  if (changed) {
    broadcastSeatLockUpdate(evId);
  }

  return { success: true };
}

/**
 * Release all locks held by a disconnected socket
 */
export async function releaseAllSeatsForSocket(socketId) {
  if (!socketId) return;

  for (const [evId, evLocks] of seatLocks.entries()) {
    const toDelete = [];
    for (const [sn, lock] of evLocks.entries()) {
      if (lock.socketId === socketId) {
        if (lock.timer) clearTimeout(lock.timer);
        toDelete.push(sn);
      }
    }

    for (const sn of toDelete) {
      evLocks.delete(sn);
    }

    if (evLocks.size === 0) {
      seatLocks.delete(evId);
    }

    if (toDelete.length > 0) {
      broadcastSeatLockUpdate(evId);
    }
  }
}

/**
 * Confirm release of locked seats (e.g. after booking confirmation)
 */
export function confirmRelease(eventId, seatNumbers) {
  const evId = Number(eventId);
  const evLocks = seatLocks.get(evId);
  if (!evLocks || !Array.isArray(seatNumbers)) return;

  let changed = false;
  for (const sn of seatNumbers) {
    const lock = evLocks.get(sn);
    if (lock) {
      if (lock.timer) clearTimeout(lock.timer);
      evLocks.delete(sn);
      changed = true;
    }
  }

  if (evLocks.size === 0) {
    seatLocks.delete(evId);
  }

  if (changed) {
    broadcastSeatLockUpdate(evId);
  }
}

/**
 * Internal lock expiration callback
 */
function releaseSeatsByLockId(evId, seatNumber, lockId) {
  const evLocks = seatLocks.get(evId);
  if (!evLocks) return;

  const lock = evLocks.get(seatNumber);
  if (lock && lock.lockId === lockId) {
    evLocks.delete(seatNumber);
    if (evLocks.size === 0) {
      seatLocks.delete(evId);
    }
    broadcastSeatLockUpdate(evId);
  }
}

/**
 * Broadcast active seat locks to event room
 */
export function broadcastSeatLockUpdate(eventId) {
  try {
    const io = getIo();
    if (!io) return;
    const locked = getLockedSeatsForEvent(eventId);
    io.to(`event_${eventId}`).emit('seatLockUpdate', {
      eventId: Number(eventId),
      lockedSeats: locked.map(l => ({
        seatNumber: l.seatNumber,
        socketId: l.socketId,
        expiresAt: l.expiresAt,
      })),
    });
  } catch (err) {
    console.error('Error broadcasting seatLockUpdate:', err);
  }
}

// Backwards compatibility aliases
export { lockSeats as holdSeats };
export { releaseAllSeatsForSocket as releaseHoldsForSocket };
export async function releaseSeatHold(lockId) {
  for (const [evId, evLocks] of seatLocks.entries()) {
    for (const [sn, lock] of evLocks.entries()) {
      if (lock.lockId === lockId) {
        if (lock.timer) clearTimeout(lock.timer);
        evLocks.delete(sn);
        if (evLocks.size === 0) seatLocks.delete(evId);
        broadcastSeatLockUpdate(evId);
        return true;
      }
    }
  }
  return false;
}
