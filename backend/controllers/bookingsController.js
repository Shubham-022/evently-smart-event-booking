// backend/controllers/bookingsController.js
import {
  createBookingService,
  getAllBookingsService,
  getBookingByIdService,
  verifyBookingService,
  cancelBookingService,
} from '../services/bookingsService.js';
import { getUserBookingsService } from '../services/authService.js';

/** Validate payload for creating a booking */
function validateBookingPayload(payload) {
  const errors = [];
  const { event_id, name, email, mobile, quantity, ticket_category, seat_ids, seat_numbers } = payload;

  const eventIdNum = Number(event_id);
  if (!Number.isInteger(eventIdNum) || eventIdNum <= 0) {
    errors.push('event_id must be a positive integer');
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and cannot be empty');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('a valid email is required');
  }
  if (!mobile || !/^\d{7,15}$/.test(String(mobile).replace(/[\s-]/g, ''))) {
    errors.push('mobile must be between 7 and 15 digits');
  }

  const seats = seat_ids || seat_numbers;
  if (seats !== undefined && seats !== null) {
    if (!Array.isArray(seats) || seats.length === 0) {
      errors.push('seat_ids must be a non-empty array of seat identifiers');
    } else {
      const invalidSeat = seats.some(s => typeof s !== 'string' || !s.trim());
      if (invalidSeat) {
        errors.push('All seat_ids must be non-empty strings');
      }
    }
  }

  const effectiveQty = seats && Array.isArray(seats) && seats.length > 0 ? seats.length : Number(quantity);
  if (!Number.isInteger(effectiveQty) || effectiveQty <= 0) {
    errors.push('quantity must be a positive integer greater than 0');
  }

  if (ticket_category && !['General', 'Premium', 'VIP'].includes(ticket_category)) {
    errors.push('ticket_category must be one of General, Premium, or VIP');
  }

  return { valid: errors.length === 0, errors };
}

function validateIdParam(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

// POST /api/bookings
export async function createBooking(req, res) {
  // User must be authenticated to book
  if (!req.user || req.user.role !== 'user') {
    return res.status(401).json({ error: 'Authentication required. Please log in to complete booking.' });
  }

  const { valid, errors } = validateBookingPayload(req.body);
  if (!valid) return res.status(400).json({ errors, error: errors[0] });

  const { event_id, name, email, mobile, quantity, ticket_category = 'General', seat_ids, seat_numbers } = req.body;
  const seats = seat_ids || seat_numbers || null;
  const effectiveQty = seats && Array.isArray(seats) && seats.length > 0 ? seats.length : Number(quantity);

  try {
    const result = await createBookingService({
      user_id: req.user.id,
      event_id: Number(event_id),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: String(mobile).replace(/[\s-]/g, ''),
      quantity: effectiveQty,
      ticket_category: ticket_category || 'General',
      seat_ids: seats,
    });

    if (result === null) return res.status(404).json({ error: 'Event not found' });
    if (result.insufficientSeats) {
      return res.status(409).json({
        error: 'Insufficient seats',
        availableSeats: result.availableSeats,
      });
    }
    if (result.seatError) {
      return res.status(409).json({
        error: result.message,
        seats: result.seats,
      });
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/bookings
export async function getAllBookings(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    if (req.user.role === 'admin') {
      const bookings = await getAllBookingsService();
      return res.status(200).json(bookings);
    } else if (req.user.role === 'user') {
      const userBookings = await getUserBookingsService(req.user.id);
      return res.status(200).json(userBookings);
    }
    return res.status(403).json({ error: 'Unauthorized.' });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/bookings/verify/:reference
export async function verifyBooking(req, res) {
  const ref = req.params.reference || req.query.ref;
  if (!ref) {
    return res.status(400).json({ valid: false, error: 'Booking reference or QR code required' });
  }
  try {
    const result = await verifyBookingService(ref);
    if (!result || !result.booking_id) {
      return res.status(404).json({ valid: false, error: result?.message || 'Ticket not found' });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error verifying booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/bookings/:id
export async function getBookingById(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookingId = validateIdParam(req.params.id);
  if (!bookingId) return res.status(400).json({ errors: ['Invalid booking ID'] });

  try {
    const booking = await getBookingByIdService(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Isolation: Users can ONLY access their own bookings!
    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only view your own bookings and tickets.' });
    }

    return res.status(200).json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/bookings/:id/cancel
export async function cancelBooking(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookingId = validateIdParam(req.params.id);
  if (!bookingId) return res.status(400).json({ errors: ['Invalid booking ID'] });

  try {
    const existing = await getBookingByIdService(bookingId);
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    // Users can only cancel their own bookings; admins can cancel any
    if (req.user.role === 'user' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only cancel your own bookings.' });
    }

    const result = await cancelBookingService(bookingId);
    if (result === null) return res.status(404).json({ error: 'Booking not found' });
    if (result.conflict) return res.status(409).json({ error: result.message || 'Cannot cancel booking' });

    return res.status(200).json({ message: 'Booking cancelled successfully and seats restored' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
