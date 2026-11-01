// backend/routes/admin.js
import express from 'express';
import {
  getDashboardStats,
  getAdminAnalytics,
  exportBookingsCsv,
  exportEventsCsv,
} from '../controllers/adminController.js';
import { loginAdmin } from '../controllers/authController.js';
import { adminAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/admin/login
router.post('/login', loginAdmin);

// GET /api/admin/stats (protected)
router.get('/stats', adminAuth, getDashboardStats);

// GET /api/admin/analytics (protected)
router.get('/analytics', adminAuth, getAdminAnalytics);

// GET /api/admin/reports/bookings/export (protected)
router.get('/reports/bookings/export', adminAuth, exportBookingsCsv);

// GET /api/admin/reports/events/export (protected)
router.get('/reports/events/export', adminAuth, exportEventsCsv);

export default router;
