// backend/services/eventsService.js
import pool from '../config/db.js';

/**
 * Insert a new event into the database.
 * @param {Object} event - Event fields.
 * @returns {Promise<Object>} The newly created event record.
 */
export async function createEventService(event) {
  const {
    title,
    category = 'Technology',
    description,
    location,
    date,
    total_seats,
    price,
    img,
  } = event;

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO events (title, category, description, location, \`date\`, total_seats, available_seats, price, img)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category || 'Technology',
        description,
        location,
        date,
        total_seats,
        total_seats, // available_seats = total_seats initially
        price,
        img,
      ]
    );
    const insertedId = result.insertId;
    const [rows] = await connection.execute('SELECT * FROM events WHERE id = ?', [insertedId]);
    return rows[0];
  } finally {
    connection.release();
  }
}

/**
 * Fetch all events, sorted by upcoming date.
 * Optional filter by category.
 * @param {Object} options
 * @returns {Promise<Array>} List of event objects.
 */
export async function getAllEventsService(options = {}) {
  const { category } = options;
  if (category && typeof category === 'string' && category.trim()) {
    const [rows] = await pool.execute(
      'SELECT * FROM events WHERE category = ? ORDER BY `date` ASC',
      [category.trim()]
    );
    return rows;
  }
  const [rows] = await pool.execute('SELECT * FROM events ORDER BY `date` ASC');
  return rows;
}

/**
 * Fetch a single event by ID.
 * @param {number} eventId
 * @returns {Promise<Object|null>} Event record or null if not found.
 */
export async function getEventByIdService(eventId) {
  const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);
  return rows.length ? rows[0] : null;
}

/**
 * Fetch related events (same category or upcoming, excluding current event ID).
 */
export async function getRelatedEventsService(eventId, category, limit = 3) {
  if (category) {
    const [rows] = await pool.execute(
      'SELECT * FROM events WHERE category = ? AND id != ? ORDER BY `date` ASC LIMIT ?',
      [category, eventId, String(limit)]
    );
    if (rows.length >= limit) return rows;
  }
  const [fallbackRows] = await pool.execute(
    'SELECT * FROM events WHERE id != ? ORDER BY `date` ASC LIMIT ?',
    [eventId, String(limit)]
  );
  return fallbackRows;
}

// Update an existing event with seat availability checks
export async function updateEventService(eventId, payload) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the row for this event to prevent concurrent modifications
    const [rows] = await connection.execute(
      'SELECT total_seats, available_seats FROM events WHERE id = ? FOR UPDATE',
      [eventId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return null; // Event not found
    }

    const { total_seats: currentTotal, available_seats: currentAvailable } = rows[0];
    const alreadyBooked = currentTotal - currentAvailable;

    const newTotal = Number(payload.total_seats);
    if (newTotal < alreadyBooked) {
      await connection.rollback();
      return { conflict: true, alreadyBooked };
    }
    const newAvailable = newTotal - alreadyBooked;

    // Prepare fields (trim strings where appropriate)
    const title = payload.title?.trim();
    const category = payload.category?.trim() || 'Technology';
    const location = payload.location?.trim();
    const date = payload.date?.trim();
    const description = payload.description ?? null;
    const price = Number(payload.price);
    const img = payload.img ?? null;

    await connection.execute(
      `UPDATE events SET title = ?, category = ?, description = ?, location = ?, \`date\` = ?, total_seats = ?, available_seats = ?, price = ?, img = ? WHERE id = ?`,
      [title, category, description, location, date, newTotal, newAvailable, price, img, eventId]
    );

    const [updated] = await connection.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    await connection.commit();
    return { event: updated[0] };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// DELETE event service
export async function deleteEventService(eventId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT id FROM events WHERE id = ? FOR UPDATE',
      [eventId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return null;
    }

    await connection.execute(
      'DELETE FROM events WHERE id = ?',
      [eventId]
    );

    await connection.commit();
    return { deleted: true };
  } catch (err) {
    await connection.rollback();

    if (err && err.errno === 1451) {
      return { conflict: true };
    }

    throw err;
  } finally {
    connection.release();
  }
}
