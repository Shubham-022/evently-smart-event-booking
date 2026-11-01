// backend/services/authService.js
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Register a new admin. Allows only the first admin to be created.
 * Returns { id, name, email } on success.
 * Returns { duplicate: true } if email already exists.
 * Returns { error: 'Admin already exists' } if an admin already exists.
 */
export async function registerAdminService({ name, email, password }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure only one admin can be created via this endpoint
    const [countRows] = await connection.execute('SELECT COUNT(*) as cnt FROM admins');
    if (countRows[0].cnt > 0) {
      await connection.rollback();
      return { error: 'Admin already exists' };
    }

    // Check duplicate email just in case
    const [dupRows] = await connection.execute('SELECT id FROM admins WHERE email = ?', [email]);
    if (dupRows.length > 0) {
      await connection.rollback();
      return { duplicate: true };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO admins (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, password_hash]
    );

    await connection.commit();
    return { id: result.insertId, name, email };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Authenticate admin and issue JWT with role: 'admin'.
 * Returns { token, admin } on success, null on failure.
 */
export async function loginAdminService({ email, password }) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash FROM admins WHERE email = ?',
    [email]
  );
  if (rows.length === 0) return null;
  const admin = rows[0];
  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return null;

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } };
}

/**
 * Register a new user.
 * Returns { token, user } on success, or { duplicate: true } if email exists.
 */
export async function registerUserService({ name, email, mobile, password }) {
  const [dupRows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (dupRows.length > 0) {
    return { duplicate: true };
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, mobile, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())',
    [name, email, mobile, password_hash]
  );

  const userId = result.insertId;
  const token = jwt.sign(
    { id: userId, email, name, mobile, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: { id: userId, name, email, mobile, role: 'user' },
  };
}

/**
 * Authenticate user and issue JWT with role: 'user'.
 * Returns { token, user } on success, null on invalid credentials.
 */
export async function loginUserService({ email, password }) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, mobile, password_hash FROM users WHERE email = ?',
    [email]
  );
  if (rows.length === 0) return null;
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, mobile: user.mobile, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: 'user' },
  };
}

/**
 * Fetch user profile by ID.
 */
export async function getUserProfileService(userId) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, mobile, created_at FROM users WHERE id = ?',
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update user profile by ID.
 */
export async function updateUserProfileService(userId, { name, mobile }) {
  await pool.execute(
    'UPDATE users SET name = ?, mobile = ? WHERE id = ?',
    [name, mobile, userId]
  );
  return getUserProfileService(userId);
}

/**
 * Fetch bookings for a specific user ID with event details.
 */
export async function getUserBookingsService(userId) {
  const [rows] = await pool.execute(
    `SELECT b.*, e.title, e.location, e.img AS event_img, e.\`date\` AS event_date, e.price AS event_price
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.user_id = ?
     ORDER BY b.booking_date DESC`,
    [userId]
  );
  return rows;
}
