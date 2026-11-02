// backend/scripts/testSeatLocking.mjs
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import pool from '../config/db.js';
import { setIo } from '../utils/socket.js';
import socketHandler from '../sockets/index.js';

import eventsRouter from '../routes/events.js';
import bookingsRouter from '../routes/bookings.js';
import authRouter from '../routes/auth.js';

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server;
let ioServer;
let client1;
let client2;

async function setup() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/events', eventsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/auth', authRouter);

  server = http.createServer(app);
  ioServer = new SocketIOServer(server, { cors: { origin: '*' } });
  setIo(ioServer);
  socketHandler(ioServer);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🧪 Test server started on port ${TEST_PORT}`);
}

async function teardown() {
  if (client1?.connected) client1.disconnect();
  if (client2?.connected) client2.disconnect();
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
  console.log('🧪 Test server stopped and DB pool closed.');
}

async function run() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await setup();

    console.log('\n--- 1. Create a Test Event with Seats ---');
    // Insert a test event with 10 seats
    const [eventResult] = await pool.execute(
      `INSERT INTO events (title, category, description, location, date, total_seats, available_seats, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Seat Locking Test Event',
        'Technology',
        'Testing real-time seat lock and allocation',
        'Room 101, Test Hall',
        new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
        10,
        10,
        100,
      ]
    );
    const eventId = eventResult.insertId;

    // Generate 10 seats for this event in event_seats: A1..A10
    for (let i = 1; i <= 10; i++) {
      await pool.execute(
        `INSERT INTO event_seats (event_id, seat_number, row_label, seat_index, ticket_category, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, `A${i}`, 'A', i, i <= 3 ? 'VIP' : i <= 6 ? 'Premium' : 'General', 'available']
      );
    }
    assert(eventId > 0, `Event #${eventId} created with 10 seats (A1-A10)`);

    console.log('\n--- 2. Fetch Seat Map via REST API ---');
    const seatMapRes = await fetch(`${BASE_URL}/events/${eventId}/seats`);
    const seatMapData = await seatMapRes.json();
    assert(seatMapRes.status === 200, 'GET /api/events/:id/seats returns 200');
    assert(Array.isArray(seatMapData.seats) && seatMapData.seats.length === 10, 'Returned 10 seats in layout');
    assert(seatMapData.seats[0].seatNumber === 'A1' && seatMapData.seats[0].status === 'available', 'Seat A1 is available');

    console.log('\n--- 3. Two Browser/Socket Clients Connecting to Event Room ---');
    client1 = ClientIO(`http://localhost:${TEST_PORT}`);
    client2 = ClientIO(`http://localhost:${TEST_PORT}`);

    await Promise.all([
      new Promise((res) => client1.on('connect', res)),
      new Promise((res) => client2.on('connect', res)),
    ]);
    assert(client1.connected && client2.connected, 'Client 1 and Client 2 connected via Socket.IO');

    client1.emit('joinEvent', eventId);
    client2.emit('joinEvent', eventId);
    await new Promise((r) => setTimeout(r, 100));

    console.log('\n--- 4. Client 1 Locks Seat A1 -> Client 2 Receives Real-time Broadcast ---');
    let client2LockUpdate = null;
    client2.on('seatLockUpdate', (data) => {
      client2LockUpdate = data;
    });

    const lockAck = await new Promise((resolve) => {
      client1.emit('lockSeat', { eventId, seatNumbers: ['A1'] }, resolve);
    });
    assert(lockAck.success === true, 'Client 1 successfully locked seat A1');
    assert(lockAck.lockedSeats.includes('A1'), 'Lock response includes seat A1');

    await new Promise((r) => setTimeout(r, 200));
    assert(client2LockUpdate !== null, 'Client 2 received seatLockUpdate event via Socket.IO');
    assert(
      client2LockUpdate?.lockedSeats?.some((l) => l.seatNumber === 'A1' && l.socketId === client1.id),
      'Client 2 sees seat A1 is locked by Client 1 socket'
    );

    console.log('\n--- 5. Client 2 Attempts to Lock Held Seat A1 -> Rejection ---');
    const client2ConflictAck = await new Promise((resolve) => {
      client2.emit('lockSeat', { eventId, seatNumbers: ['A1'] }, resolve);
    });
    assert(client2ConflictAck.success === false, 'Client 2 locking seat A1 was rejected (conflict)');
    assert(client2ConflictAck.blocked?.includes('A1'), 'Blocked list includes seat A1');

    console.log('\n--- 6. Client 1 Deselects/Releases Seat A1 -> Client 2 Receives Unlock Broadcast ---');
    let client2UnlockUpdate = null;
    client2.on('seatLockUpdate', (data) => {
      client2UnlockUpdate = data;
    });

    const releaseAck = await new Promise((resolve) => {
      client1.emit('releaseSeat', { eventId, seatNumbers: ['A1'] }, resolve);
    });
    assert(releaseAck.success === true, 'Client 1 successfully released seat A1');

    await new Promise((r) => setTimeout(r, 200));
    assert(
      !client2UnlockUpdate?.lockedSeats?.some((l) => l.seatNumber === 'A1'),
      'Client 2 sees seat A1 is no longer locked'
    );

    console.log('\n--- 7. Disconnect Auto-Release: Client 1 Locks A2 & Disconnects ---');
    await new Promise((resolve) => {
      client1.emit('lockSeat', { eventId, seatNumbers: ['A2'] }, resolve);
    });

    let client2DisconnectUpdate = null;
    client2.on('seatLockUpdate', (data) => {
      client2DisconnectUpdate = data;
    });

    client1.disconnect();
    await new Promise((r) => setTimeout(r, 300));
    assert(
      !client2DisconnectUpdate?.lockedSeats?.some((l) => l.seatNumber === 'A2'),
      'Client 1 disconnect automatically released seat A2 to other clients'
    );

    console.log('\n--- 8. Concurrent Booking of Confirmed Seat Prevention ---');
    // Register a user to book seats
    const userEmail = `seat_tester_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Seat Tester',
        email: userEmail,
        mobile: '9876543210',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    assert(regRes.status === 201 && token, 'Registered test user and obtained JWT token');

    // User books seats A3 and A4
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
        name: 'Seat Tester',
        email: userEmail,
        mobile: '9876543210',
        ticket_category: 'VIP',
        seat_ids: ['A3', 'A4'],
      }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201, 'Booking seats A3 and A4 succeeded (201)');
    assert(bookData.seat_numbers === 'A3,A4', 'Confirmed booking has seat_numbers "A3,A4"');

    // Attempting to book seat A3 again must be rejected
    const dupBookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
        name: 'Seat Tester 2',
        email: `tester2_${Date.now()}@example.com`,
        mobile: '9876543210',
        ticket_category: 'VIP',
        seat_ids: ['A3'],
      }),
    });
    const dupBookData = await dupBookRes.json();
    assert(dupBookRes.status === 409, 'Attempt to book already booked seat A3 returns 409 Conflict');
    assert(dupBookData.error?.includes('already been booked'), 'Response states seat has already been booked');

    // Check DB status of A3 and A4
    const [dbSeatRows] = await pool.execute(
      'SELECT seat_number, status, booking_id FROM event_seats WHERE event_id = ? AND seat_number IN ("A3", "A4")',
      [eventId]
    );
    assert(
      dbSeatRows.length === 2 && dbSeatRows.every((s) => s.status === 'booked' && s.booking_id === bookData.id),
      'event_seats table shows seats A3 and A4 are booked with foreign key to booking'
    );

    // Verify booking cancellation restores seats A3 and A4 to available
    const cancelRes = await fetch(`${BASE_URL}/bookings/${bookData.id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(cancelRes.status === 200, 'Cancelled booking successfully');

    const [restoredSeatRows] = await pool.execute(
      'SELECT seat_number, status, booking_id FROM event_seats WHERE event_id = ? AND seat_number IN ("A3", "A4")',
      [eventId]
    );
    assert(
      restoredSeatRows.every((s) => s.status === 'available' && s.booking_id === null),
      'After cancellation, event_seats A3 and A4 restored to available and booking_id set to NULL'
    );

    // Clean up test event and records
    await pool.execute('DELETE FROM bookings WHERE event_id = ?', [eventId]);
    await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);
    await pool.execute('DELETE FROM users WHERE email = ?', [userEmail]);
    console.log('\n🧹 Test event and user cleaned up.');

    console.log(`\n========================================`);
    console.log(`  SEAT LOCKING TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test script crashed:', err);
    process.exit(1);
  } finally {
    await teardown();
  }
}

run();
