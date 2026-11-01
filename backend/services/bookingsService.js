// backend/services/bookingsService.js
import pool from '../config/db.js';
import { getIo } from '../utils/socket.js';

export const TICKET_TIERS = {
  General: { multiplier: 1.0, label: 'General' },
  Premium: { multiplier: 1.5, label: 'Premium' },
  VIP:     { multiplier: 2.5, label: 'VIP' },
};

/**
 * Create a new booking for an event.
 * Uses MySQL transactions and SELECT ... FOR UPDATE to prevent overbooking.
 * Calculates dynamic pricing based on ticket_category.
 *
 * @param {Object} payload - Booking data.
 * @param {number|null} payload.user_id - ID of the authenticated user.
 * @param {number} payload.event_id - ID of the event to book.
 * @param {string} payload.name - Customer name.
 * @param {string} payload.email - Customer email.
 * @param {string} payload.mobile - Customer mobile phone.
 * @param {number|string} payload.quantity - Number of seats to book.
 * @param {string} [payload.ticket_category='General'] - General | Premium | VIP.
 * @returns {Promise<Object>} Created booking or error state.
 */
export async function createBookingService({
  user_id = null,
  event_id,
  name,
  email,
  mobile,
  quantity,
  ticket_category = 'General',
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the event row to prevent concurrent over‑booking
    const [eventRows] = await connection.execute(
      'SELECT id, price, available_seats, total_seats FROM events WHERE id = ? FOR UPDATE',
      [event_id]
    );

    if (eventRows.length === 0) {
      await connection.rollback();
      return null; // Event does not exist
    }

    const event = eventRows[0];
    const availableSeats = Number(event.available_seats);
    const basePrice = Number(event.price);
    const qty = Number(quantity);

    if (qty > availableSeats) {
      await connection.rollback();
      return { insufficientSeats: true, availableSeats };
    }

    // Dynamic pricing based on ticket category
    const tier = TICKET_TIERS[ticket_category] || TICKET_TIERS.General;
    const unitPrice = Math.round(basePrice * tier.multiplier);
    const totalAmount = qty * unitPrice;

    // Insert the booking record with user_id & ticket_category
    const [insertResult] = await connection.execute(
      `INSERT INTO bookings (user_id, event_id, name, email, mobile, quantity, ticket_category, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, event_id, name, email, mobile, qty, tier.label, totalAmount, 'confirmed']
    );

    // Decrease the available seats on the event
    await connection.execute(
      'UPDATE events SET available_seats = available_seats - ? WHERE id = ?',
      [qty, event_id]
    );

    // Retrieve the newly created booking joined with event details
    const [bookingRows] = await connection.execute(
      `SELECT b.*, e.title, e.category AS event_category, e.location, e.\`date\` AS event_date, e.img AS event_img
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.id = ?`,
      [insertResult.insertId]
    );

    await connection.commit();

    // Emit real-time seat update via Socket.IO
    try {
      const io = getIo();
      if (io) {
        const remainingSeats = availableSeats - qty;
        io.to(`event_${event_id}`).emit('seatUpdate', {
          eventId: event_id,
          availableSeats: remainingSeats,
        });
      }
    } catch (emitErr) {
      console.error('Socket emit error after booking creation:', emitErr);
    }

    return bookingRows[0];
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Fetch all bookings with event details (admin view).
 */
export async function getAllBookingsService() {
  const [rows] = await pool.execute(
    `SELECT b.*, e.title, e.category AS event_category, e.location, e.\`date\` AS event_date, e.img AS event_img
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     ORDER BY b.booking_date DESC`
  );
  return rows;
}

/**
 * Fetch a single booking by ID with event details.
 */
export async function getBookingByIdService(bookingId) {
  const [rows] = await pool.execute(
    `SELECT b.*, e.title, e.category AS event_category, e.location, e.\`date\` AS event_date, e.img AS event_img
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.id = ?`,
    [bookingId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Verify a digital booking / QR code reference.
 * Accepts formats: "EVENTLY-BOOKING-123", "123", "#000123"
 */
export async function verifyBookingService(reference) {
  if (!reference) return { valid: false, message: 'Reference is required' };

  const match = String(reference).match(/\d+/);
  if (!match) return { valid: false, message: 'Invalid ticket reference format' };

  const bookingId = Number(match[0]);
  const booking = await getBookingByIdService(bookingId);
  if (!booking) {
    return { valid: false, message: `No ticket found for reference #${bookingId}` };
  }

  const isConfirmed = booking.status === 'confirmed';

  return {
    valid: isConfirmed,
    status: booking.status,
    booking_id: booking.id,
    reference: `EVENTLY-BOOKING-${booking.id}`,
    ticket_category: booking.ticket_category || 'General',
    quantity: booking.quantity,
    total_amount: booking.total_amount,
    booking_date: booking.booking_date || booking.created_at,
    event: {
      id: booking.event_id,
      title: booking.title,
      date: booking.event_date,
      location: booking.location,
      category: booking.event_category || booking.category,
    },
    attendee: {
      name: booking.name,
      email: booking.email ? booking.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length)) : null,
      mobile: booking.mobile ? booking.mobile.slice(0, 3) + '****' + booking.mobile.slice(-3) : null,
    },
    booking,
  };
}

/**
 * Cancel a booking: set status to 'cancelled' and restore seats.
 * Uses MySQL transaction and SELECT ... FOR UPDATE.
 */
export async function cancelBookingService(bookingId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the booking row
    const [bookingRows] = await connection.execute(
      'SELECT id, user_id, status, quantity, event_id FROM bookings WHERE id = ? FOR UPDATE',
      [bookingId]
    );
    if (bookingRows.length === 0) {
      await connection.rollback();
      return null; // not found
    }
    const booking = bookingRows[0];
    if (booking.status !== 'confirmed') {
      await connection.rollback();
      return { conflict: true, message: 'Booking is already cancelled' };
    }

    // Lock the related event row
    const [eventRows] = await connection.execute(
      'SELECT id, available_seats, total_seats FROM events WHERE id = ? FOR UPDATE',
      [booking.event_id]
    );
    if (eventRows.length === 0) {
      await connection.rollback();
      throw new Error('Associated event not found');
    }

    const currentAvailable = Number(eventRows[0].available_seats);
    const totalSeats = Number(eventRows[0].total_seats);
    const restoredSeats = Math.min(totalSeats, currentAvailable + Number(booking.quantity));

    // Update booking status
    await connection.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );

    // Restore seats
    await connection.execute(
      'UPDATE events SET available_seats = ? WHERE id = ?',
      [restoredSeats, booking.event_id]
    );

    await connection.commit();

    // Emit real-time seat update via Socket.IO
    try {
      const io = getIo();
      if (io) {
        io.to(`event_${booking.event_id}`).emit('seatUpdate', {
          eventId: booking.event_id,
          availableSeats: restoredSeats,
        });
      }
    } catch (emitErr) {
      console.error('Socket emit error after booking cancel:', emitErr);
    }

    return { success: true, booking, restoredSeats };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
