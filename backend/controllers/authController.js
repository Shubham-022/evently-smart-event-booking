// backend/controllers/authController.js
import {
  registerAdminService,
  loginAdminService,
  registerUserService,
  loginUserService,
  getUserProfileService,
  updateUserProfileService,
  getUserBookingsService,
} from '../services/authService.js';

/**
 * POST /api/auth/register
 * Register a new customer user.
 */
export async function registerUser(req, res) {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('A valid email address is required.');
    }
    if (!mobile || !/^\d{7,15}$/.test(String(mobile).replace(/[\s-]/g, ''))) {
      errors.push('Mobile number must be between 7 and 15 digits.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      errors.push('Passwords do not match.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors, error: errors[0] });
    }

    const cleanMobile = String(mobile).replace(/[\s-]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const result = await registerUserService({
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      password,
    });

    if (result?.duplicate) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    return res.status(201).json({
      message: 'Registration successful.',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    console.error('registerUser error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/login
 * User login endpoint.
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await loginUserService({
      email: email.trim().toLowerCase(),
      password,
    });

    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.status(200).json({
      message: 'Login successful.',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    console.error('loginUser error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/admin/register
 * First-time admin setup — only one admin allowed.
 */
export async function registerAdmin(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const result = await registerAdminService({ name: name.trim(), email: email.toLowerCase(), password });

    if (result?.error === 'Admin already exists') {
      return res.status(409).json({ error: 'An admin account already exists. Use the login endpoint.' });
    }
    if (result?.duplicate) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    return res.status(201).json({ message: 'Admin registered successfully.', admin: result });
  } catch (err) {
    console.error('registerAdmin error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/admin/login or POST /api/auth/admin/login
 * Authenticate admin and return JWT.
 */
export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await loginAdminService({ email: email.toLowerCase().trim(), password });
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.status(200).json({ message: 'Login successful.', token: result.token, admin: result.admin });
  } catch (err) {
    console.error('loginAdmin error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/users/profile
 */
export async function getUserProfile(req, res) {
  try {
    const user = await getUserProfileService(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(user);
  } catch (err) {
    console.error('getUserProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/users/profile
 */
export async function updateUserProfile(req, res) {
  try {
    const { name, mobile } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!mobile || !/^\d{7,15}$/.test(String(mobile).replace(/[\s-]/g, ''))) {
      return res.status(400).json({ error: 'Mobile number must be between 7 and 15 digits.' });
    }

    const updated = await updateUserProfileService(req.user.id, {
      name: name.trim(),
      mobile: String(mobile).replace(/[\s-]/g, ''),
    });
    return res.json(updated);
  } catch (err) {
    console.error('updateUserProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/users/bookings
 */
export async function getUserBookings(req, res) {
  try {
    const bookings = await getUserBookingsService(req.user.id);
    return res.json(bookings);
  } catch (err) {
    console.error('getUserBookings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
