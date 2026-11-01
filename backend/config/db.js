// Load environment variables early
import 'dotenv/config'; // ensures .env is read before any config
import mysql from 'mysql2/promise';

// Validate required DB environment variables or connection string
let pool;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const isSslDisabled = process.env.DB_SSL === 'false' || process.env.DB_SSL === '0';
  pool = mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: isSslDisabled ? undefined : { rejectUnauthorized: false },
  });
} else {
  const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = requiredEnv.filter((key) => process.env[key] === undefined);
  if (missing.length) {
    throw new Error(`Missing required DB environment variables: ${missing.join(', ')}`);
  }

  const isRemote =
    process.env.DB_HOST &&
    process.env.DB_HOST !== 'localhost' &&
    process.env.DB_HOST !== '127.0.0.1';

  const sslEnabled =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    (isRemote && process.env.DB_SSL !== 'false' && process.env.DB_SSL !== '0');

  // Create a MySQL connection pool using mysql2/promise
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  });
}

/**
 * Test the database connection.
 * Executes a simple SELECT 1 query to verify connectivity.
 * @returns {Promise<boolean>} Resolves true if connection succeeds.
 */
export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    // rows should contain a single row with value 1
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}

export default pool;
