// backend/routes/auth.js
import express from 'express';
import {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
} from '../controllers/authController.js';

const router = express.Router();

// User auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin auth routes (accessible under /api/auth/admin/* as well)
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

export default router;
