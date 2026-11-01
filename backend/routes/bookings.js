// backend/routes/bookings.js
import express from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  verifyBooking,
  cancelBooking,
} from '../controllers/bookingsController.js';
import { userAuth, anyAuth } from '../middlewares/auth.js';

const router = express.Router();

// Public: QR-based / Reference ticket verification
router.get('/verify/:reference', verifyBooking);

// POST /api/bookings - only logged-in users can create bookings
router.post('/', userAuth, createBooking);

// GET /api/bookings - admin gets all; user gets own bookings
router.get('/', anyAuth, getAllBookings);

// GET /api/bookings/:id - user gets own booking; admin can get any
router.get('/:id', anyAuth, getBookingById);

// PUT /api/bookings/:id/cancel - booking owner or admin can cancel
router.put('/:id/cancel', anyAuth, cancelBooking);

export default router;
