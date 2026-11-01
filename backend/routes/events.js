// backend/routes/events.js
import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  getRelatedEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/eventsController.js';
import { adminAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/events
router.post('/', adminAuth, createEvent);

// GET /api/events
router.get('/', getAllEvents);

// GET /api/events/:id
router.get('/:id', getEventById);

// GET /api/events/:id/related
router.get('/:id/related', getRelatedEvents);

// PUT /api/events/:id
router.put('/:id', adminAuth, updateEvent);

// DELETE /api/events/:id
router.delete('/:id', adminAuth, deleteEvent);

export default router;
