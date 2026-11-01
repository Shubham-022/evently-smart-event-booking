// backend/controllers/eventsController.js
import {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  getRelatedEventsService,
  updateEventService,
  deleteEventService,
} from '../services/eventsService.js';

/**
 * Validate request payload for creating an event.
 * Returns an object { valid: boolean, errors: [] }
 */
function validateEventPayload(payload) {
  const errors = [];
  const {
    title,
    category,
    description,
    location,
    date,
    total_seats,
    price,
    img,
  } = payload;

  // Title: required, non-empty, not just whitespace
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and cannot be empty or whitespace');
  }

  // Location: required, non-empty, not just whitespace
  if (typeof location !== 'string' || location.trim().length === 0) {
    errors.push('location is required and cannot be empty or whitespace');
  }

  // Date: required, non-empty string, ISO 8601 datetime (e.g., 2023-05-01T14:30:00Z)
  if (typeof date !== 'string' || date.trim().length === 0) {
    errors.push('date is required and must be a non‑empty string');
  } else {
    const iso = date.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(iso);
    if (!match) {
      errors.push('date must be in format YYYY-MM-DDTHH:mm:ss[.sss]');
    } else {
      const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      const hour = Number(hourStr);
      const minute = Number(minuteStr);
      const second = Number(secondStr);

      if (month < 1 || month > 12) {
        errors.push('date month must be between 01 and 12');
      } else {
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) {
          errors.push('date day is out of range for the given month');
        }
      }

      if (hour < 0 || hour > 23) errors.push('date hour must be between 00 and 23');
      if (minute < 0 || minute > 59) errors.push('date minute must be between 00 and 59');
      if (second < 0 || second > 59) errors.push('date second must be between 00 and 59');
    }
  }

  // total_seats: required, non‑empty, numeric, integer, non‑negative
  if (
    total_seats === undefined ||
    total_seats === null ||
    (typeof total_seats === 'string' && total_seats.trim().length === 0)
  ) {
    errors.push('total_seats is required and cannot be empty');
  } else if (
    typeof total_seats === 'boolean' ||
    Array.isArray(total_seats) ||
    (typeof total_seats === 'object' && total_seats !== null)
  ) {
    errors.push('total_seats must be a number or numeric string');
  } else {
    const totalNum = Number(total_seats);
    if (!Number.isFinite(totalNum) || !Number.isInteger(totalNum) || totalNum < 0) {
      errors.push('total_seats must be a non‑negative integer');
    }
  }

  // price: required, non‑empty, numeric, non‑negative
  if (
    price === undefined ||
    price === null ||
    (typeof price === 'string' && price.trim().length === 0)
  ) {
    errors.push('price is required and cannot be empty');
  } else if (
    typeof price === 'boolean' ||
    Array.isArray(price) ||
    (typeof price === 'object' && price !== null)
  ) {
    errors.push('price must be a number or numeric string');
  } else {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      errors.push('price must be a non‑negative number');
    }
  }

  // Optional fields validation
  if (category !== undefined && typeof category !== 'string') {
    errors.push('category must be a string');
  }
  if (description !== undefined && typeof description !== 'string') {
    errors.push('description must be a string');
  }
  if (img !== undefined && typeof img !== 'string') {
    errors.push('img must be a string');
  }

  return { valid: errors.length === 0, errors };
}

// POST /api/events
export async function createEvent(req, res) {
  const { valid, errors } = validateEventPayload(req.body);
  if (!valid) {
    return res.status(400).json({ errors });
  }

  const {
    title,
    category = 'Technology',
    description = null,
    location,
    date,
    total_seats,
    price,
    img = null,
  } = req.body;

  try {
    const newEvent = await createEventService({
      title: title.trim(),
      category: category ? category.trim() : 'Technology',
      description,
      location: location.trim(),
      date: date.trim(),
      total_seats: Number(total_seats),
      price: Number(price),
      img,
    });
    return res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/events/:id
export async function getEventById(req, res) {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ errors: ['Invalid event ID'] });
  }
  try {
    const event = await getEventByIdService(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/events/:id/related
export async function getRelatedEvents(req, res) {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ errors: ['Invalid event ID'] });
  }
  try {
    const category = req.query.category || null;
    const related = await getRelatedEventsService(eventId, category, 3);
    return res.json(related);
  } catch (err) {
    console.error('Error fetching related events:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/events
export async function getAllEvents(req, res) {
  try {
    const category = req.query.category || null;
    const events = await getAllEventsService({ category });
    return res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/events/:id
export async function updateEvent(req, res) {
  const { id } = req.params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ errors: ['Invalid event ID'] });
  }

  const { valid, errors } = validateEventPayload(req.body);
  if (!valid) {
    return res.status(400).json({ errors });
  }

  try {
    const result = await updateEventService(eventId, req.body);
    if (result === null) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (result.conflict) {
      return res.status(409).json({
        error: `New total_seats (${req.body.total_seats}) cannot be less than already booked seats (${result.alreadyBooked})`,
      });
    }
    return res.status(200).json(result.event);
  } catch (err) {
    console.error('Error updating event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/events/:id
export async function deleteEvent(req, res) {
  const { id } = req.params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ errors: ['Invalid event ID'] });
  }

  try {
    const result = await deleteEventService(eventId);
    if (result === null) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (result.conflict) {
      return res.status(409).json({ error: 'Cannot delete event with existing bookings' });
    }
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
