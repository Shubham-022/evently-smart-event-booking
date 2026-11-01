// backend/routes/user.js
import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserBookings,
} from '../controllers/authController.js';
import { userAuth } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', userAuth, getUserProfile);

// PUT /api/users/profile
router.put('/profile', userAuth, updateUserProfile);

// GET /api/users/bookings
router.get('/bookings', userAuth, getUserBookings);

export default router;
