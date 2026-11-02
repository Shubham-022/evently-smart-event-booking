// backend/scripts/migrateSeats.js
import 'dotenv/config';
import pool from '../config/db.js';
import { generateSeatsForTotal } from '../utils/seatLayout.js';

export async function migrateSeats() {
  console.log('🔄 Starting Seat Allocation & Legacy Booking Migration...');
  const connection = await pool.getConnection();

  try {
    // 1. Create event_seats table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_seats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        seat_number VARCHAR(10) NOT NULL,
        row_label VARCHAR(5) NOT NULL,
        seat_index INT NOT NULL,
        ticket_category VARCHAR(50) NOT NULL DEFAULT 'General',
        status ENUM('available', 'booked') NOT NULL DEFAULT 'available',
        booking_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_event_seats_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        CONSTRAINT fk_event_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        UNIQUE KEY uq_event_seat_number (event_id, seat_number),
        INDEX idx_event_seats_event (event_id),
        INDEX idx_event_seats_status (event_id, status)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✅ event_seats table verified/created.');

    // 2. Create booking_seats junction table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS booking_seats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        seat_id INT NOT NULL,
        seat_number VARCHAR(10) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) REFERENCES event_seats(id) ON DELETE CASCADE,
        UNIQUE KEY uq_booking_seat (booking_id, seat_id),
        INDEX idx_booking_seats_booking (booking_id)
      ) ENGINE=InnoDB;
    `);
    console.log('  ✅ booking_seats table verified/created.');

    // 3. Add seat_numbers column to bookings table if not exists
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'seat_numbers'
    `, [process.env.DB_NAME]);

    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE bookings
        ADD COLUMN seat_numbers VARCHAR(255) NULL AFTER ticket_category
      `);
      console.log('  ✅ seat_numbers column added to bookings table.');
    } else {
      console.log('  ✅ seat_numbers column already exists in bookings.');
    }

    // 4. Populate event_seats for every existing event
    const [events] = await connection.query('SELECT id, title, total_seats, available_seats FROM events');
    console.log(`  🔍 Found ${events.length} events to verify for seat maps...`);

    for (const ev of events) {
      const [existingSeats] = await connection.query(
        'SELECT COUNT(*) AS cnt FROM event_seats WHERE event_id = ?',
        [ev.id]
      );
      const currentSeatCount = existingSeats[0].cnt;

      if (currentSeatCount < ev.total_seats) {
        const layoutSeats = generateSeatsForTotal(ev.total_seats);
        // Insert missing seats
        for (const s of layoutSeats) {
          await connection.query(`
            INSERT IGNORE INTO event_seats (event_id, seat_number, row_label, seat_index, ticket_category, status)
            VALUES (?, ?, ?, ?, ?, 'available')
          `, [ev.id, s.seatNumber, s.rowLabel, s.seatIndex, s.ticketCategory]);
        }
        console.log(`  🎟️ Generated ${layoutSeats.length} seats for Event #${ev.id} (${ev.title})`);
      }

      // 5. Reconcile legacy confirmed bookings that do not have assigned seats
      const [legacyBookings] = await connection.query(`
        SELECT b.id, b.quantity, b.ticket_category, b.seat_numbers
        FROM bookings b
        LEFT JOIN booking_seats bs ON b.id = bs.booking_id
        WHERE b.event_id = ? AND b.status = 'confirmed' AND bs.id IS NULL
        GROUP BY b.id, b.quantity, b.ticket_category, b.seat_numbers
        ORDER BY b.id ASC
      `, [ev.id]);

      if (legacyBookings.length > 0) {
        console.log(`  📦 Migrating ${legacyBookings.length} legacy bookings for Event #${ev.id}...`);

        for (const lb of legacyBookings) {
          const qty = Number(lb.quantity) || 1;
          // Find next available seats
          const [availSeats] = await connection.query(`
            SELECT id, seat_number
            FROM event_seats
            WHERE event_id = ? AND status = 'available'
            ORDER BY id ASC
            LIMIT ?
          `, [ev.id, qty]);

          if (availSeats.length > 0) {
            const assignedNumbers = availSeats.map(s => s.seat_number);
            const seatIds = availSeats.map(s => s.id);

            // Mark seats as booked
            await connection.query(`
              UPDATE event_seats
              SET status = 'booked', booking_id = ?
              WHERE id IN (${seatIds.map(() => '?').join(',')})
            `, [lb.id, ...seatIds]);

            // Insert into booking_seats
            for (const s of availSeats) {
              await connection.query(`
                INSERT IGNORE INTO booking_seats (booking_id, seat_id, seat_number)
                VALUES (?, ?, ?)
              `, [lb.id, s.id, s.seat_number]);
            }

            // Update bookings table seat_numbers column
            await connection.query(
              'UPDATE bookings SET seat_numbers = ? WHERE id = ?',
              [assignedNumbers.join(', '), lb.id]
            );
          }
        }
      }

      // 6. Ensure available_seats remains consistent with actual seat allocations
      const [countRow] = await connection.query(
        "SELECT COUNT(*) AS avail FROM event_seats WHERE event_id = ? AND status = 'available'",
        [ev.id]
      );
      const actualAvailable = countRow[0].avail;

      await connection.query(
        'UPDATE events SET available_seats = ? WHERE id = ?',
        [actualAvailable, ev.id]
      );
    }

    console.log('✅ Seat Allocation & Legacy Booking Migration Completed Successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    connection.release();
  }
}

// Allow direct execution
if (process.argv[1]?.endsWith('migrateSeats.js')) {
  migrateSeats()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

