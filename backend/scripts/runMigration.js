import 'dotenv/config';
import pool from '../config/db.js';
import { migrateSeats } from './migrateSeats.js';

async function migrate() {
  console.log('Running database migrations...');
  const connection = await pool.getConnection();
  try {
    // 1. Create users table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ users table verified/created.');

    // 2. Check if user_id column exists on bookings
    const [userCols] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'user_id'
    `, [process.env.DB_NAME]);

    if (userCols.length === 0) {
      console.log('Adding user_id column to bookings table...');
      await connection.query(`
        ALTER TABLE bookings
        ADD COLUMN user_id INT NULL AFTER id,
        ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        ADD INDEX idx_bookings_user (user_id)
      `);
      console.log('✅ user_id column added to bookings.');
    } else {
      console.log('✅ user_id column already exists in bookings.');
    }

    // 3. Check if category column exists on events
    const [catCols] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'category'
    `, [process.env.DB_NAME]);

    if (catCols.length === 0) {
      console.log('Adding category column to events table...');
      await connection.query(`
        ALTER TABLE events
        ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Technology' AFTER title,
        ADD INDEX idx_events_category (category)
      `);
      console.log('✅ category column added to events.');
    } else {
      console.log('✅ category column already exists in events.');
    }

    // 4. Check if ticket_category column exists on bookings
    const [tixCols] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'ticket_category'
    `, [process.env.DB_NAME]);

    if (tixCols.length === 0) {
      console.log('Adding ticket_category column to bookings table...');
      await connection.query(`
        ALTER TABLE bookings
        ADD COLUMN ticket_category VARCHAR(50) NOT NULL DEFAULT 'General' AFTER quantity
      `);
      console.log('✅ ticket_category column added to bookings.');
    } else {
      console.log('✅ ticket_category column already exists in bookings.');
    }

    // 5. Update categories for diversity if all are default 'Technology'
    await connection.query(`
      UPDATE events SET category = 'Conferences' WHERE title LIKE '%Conference%' OR title LIKE '%Summit%' OR title LIKE '%Founders%';
    `);
    await connection.query(`
      UPDATE events SET category = 'Music' WHERE title LIKE '%Music%' OR title LIKE '%Concert%' OR title LIKE '%Festival%' OR title LIKE '%Expo%';
    `);
    await connection.query(`
      UPDATE events SET category = 'Arts & Design' WHERE title LIKE '%Art%' OR title LIKE '%Design%' OR title LIKE '%Creative%';
    `);
    await connection.query(`
      UPDATE events SET category = 'Sports' WHERE title LIKE '%Marathon%' OR title LIKE '%Sports%' OR title LIKE '%Fitness%';
    `);
    console.log('✅ Event categories populated.');

    // Run seats migration
    await migrateSeats();

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
