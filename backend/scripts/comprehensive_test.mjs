// backend/scripts/comprehensive_test.mjs
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import pool, { testConnection } from '../config/db.js';
import { setIo } from '../utils/socket.js';
import socketHandler from '../sockets/index.js';

import userRoutes from '../routes/user.js';
import eventsRouter from '../routes/events.js';
import bookingsRouter from '../routes/bookings.js';
import authRouter from '../routes/auth.js';
import adminRouter from '../routes/admin.js';

import { registerAdminService } from '../services/authService.js';

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server;
let ioServer;

async function setupServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use('/api/events', eventsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  server = http.createServer(app);
  ioServer = new SocketIOServer(server, { cors: { origin: '*' } });
  setIo(ioServer);
  socketHandler(ioServer);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🧪 Test server started on port ${TEST_PORT}`);
}

async function teardownServer() {
  if (ioServer) ioServer.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
  console.log('🧪 Test server stopped and DB pool closed.');
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('  EVENTLY - COMPREHENSIVE VERIFICATION  ');
  console.log('========================================\n');

  await setupServer();

  // Test 1: DB Connection
  console.log('\n--- 1. Database Connection ---');
  const dbOk = await testConnection();
  assert(dbOk, 'MySQL connection established');

  // Test 2: Admin Seeding & Login
  console.log('\n--- 2. Admin Authentication & Role Separation ---');
  await registerAdminService({
    name: 'Admin User',
    email: 'admin@evently.com',
    password: 'Admin@1234',
  }).catch(() => {});

  const adminLoginRes = await request('/admin/login', {
    method: 'POST',
    body: { email: 'admin@evently.com', password: 'Admin@1234' },
  });
  assert(adminLoginRes.status === 200, 'Admin login succeeded (200)', JSON.stringify(adminLoginRes.data));
  const adminToken = adminLoginRes.data?.token;
  assert(!!adminToken, 'Admin token received');

  // Admin stats route with admin token
  const statsRes = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(statsRes.status === 200, 'Admin can access /api/admin/stats (200)');
  assert(statsRes.data?.totalEvents !== undefined, 'Stats contains totalEvents');
  assert(statsRes.data?.totalRevenue !== undefined, 'Stats contains totalRevenue');

  // Admin analytics route
  const analyticsRes = await request('/admin/analytics?range=30d', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(analyticsRes.status === 200, 'Admin can access /api/admin/analytics (200)');
  assert(Array.isArray(analyticsRes.data?.bookingTrends), 'Analytics contains bookingTrends array');
  assert(analyticsRes.data?.bookingStatus?.cancellationRate !== undefined, 'Analytics contains cancellationRate');
  assert(Array.isArray(analyticsRes.data?.popularEvents), 'Analytics contains popularEvents array');
  assert(Array.isArray(analyticsRes.data?.occupancy), 'Analytics contains occupancy array');

  // Admin CSV report export tests
  const csvBookingsRes = await fetch(`${BASE_URL}/admin/reports/bookings/export`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(csvBookingsRes.status === 200, 'Admin can download bookings CSV report (200)');
  const csvBookingsText = await csvBookingsRes.text();
  assert(csvBookingsText.includes('Booking ID,Event Title,Category,Customer Name'), 'Bookings CSV has correct header columns');

  const csvEventsRes = await fetch(`${BASE_URL}/admin/reports/events/export`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(csvEventsRes.status === 200, 'Admin can download events CSV report (200)');
  const csvEventsText = await csvEventsRes.text();
  assert(csvEventsText.includes('Event ID,Title,Category'), 'Events CSV has correct header columns');

  // Stats route without token
  const statsNoAuth = await request('/admin/stats');
  assert(statsNoAuth.status === 401, 'Unauthenticated request to /api/admin/stats returns 401');

  // Test 3: User Registration & Login
  console.log('\n--- 3. User Authentication & Profile ---');
  const timestamp = Date.now();
  const testUser1 = {
    name: 'Test Customer One',
    email: `customer1_${timestamp}@evently.test`,
    mobile: '9876543210',
    password: 'Password@123',
    confirmPassword: 'Password@123',
  };

  const userRegRes = await request('/auth/register', {
    method: 'POST',
    body: testUser1,
  });
  assert(userRegRes.status === 201, 'User registration succeeded (201)', JSON.stringify(userRegRes.data));
  const user1Token = userRegRes.data?.token;
  const user1Id = userRegRes.data?.user?.id;
  assert(!!user1Token, 'User token received with registration');

  // Duplicate registration test
  const dupUserRes = await request('/auth/register', {
    method: 'POST',
    body: testUser1,
  });
  assert(dupUserRes.status === 409, 'Duplicate user email returns 409 Conflict');

  // User login test
  const userLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: testUser1.email, password: testUser1.password },
  });
  assert(userLoginRes.status === 200, 'User login succeeded (200)');

  // Invalid password login test
  const badLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: testUser1.email, password: 'WrongPassword' },
  });
  assert(badLoginRes.status === 401, 'Invalid user credentials returns 401');

  // User Profile
  const profileRes = await request('/users/profile', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(profileRes.status === 200, 'User profile fetched (200)');
  assert(profileRes.data?.email === testUser1.email, 'User profile contains correct email');

  // User Profile Update
  const updateProfileRes = await request('/users/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { name: 'Updated Customer Name', mobile: '9998887776' },
  });
  assert(updateProfileRes.status === 200, 'User profile updated (200)');
  assert(updateProfileRes.data?.name === 'Updated Customer Name', 'Updated name persisted');

  // Token Separation Test: User token attempting to access Admin route
  console.log('\n--- 4. Token & Role Separation ---');
  const userAccessAdminRes = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(userAccessAdminRes.status === 403, 'User token cannot access Admin route /api/admin/stats (403 Forbidden)');

  // Test 4: Event CRUD
  console.log('\n--- 5. Event Management (CRUD) ---');
  // Admin creates an event
  const newEventPayload = {
    title: `Automated Test Event ${timestamp}`,
    description: 'A test event created for integration testing.',
    location: 'Bangalore Tech Arena, Karnataka',
    date: '2028-12-15T18:00:00',
    total_seats: 5,
    price: 499,
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
  };

  const createEventRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: newEventPayload,
  });
  assert(createEventRes.status === 201, 'Admin created event (201)', JSON.stringify(createEventRes.data));
  const testEventId = createEventRes.data?.id;
  assert(!!testEventId, 'Created event has valid ID');

  // User tries to create an event -> 403
  const userCreateEventRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: newEventPayload,
  });
  assert(userCreateEventRes.status === 403, 'User cannot create event (403 Forbidden)');

  // Public fetches single event
  const getEventRes = await request(`/events/${testEventId}`);
  assert(getEventRes.status === 200, 'Public can view event by ID (200)');
  assert(Number(getEventRes.data?.available_seats) === 5, 'Available seats initially equals total_seats (5)');

  // Admin updates event
  const updateEventRes = await request(`/events/${testEventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      ...newEventPayload,
      title: `Updated Test Event ${timestamp}`,
      price: 550,
      total_seats: 5,
      category: 'Workshop',
    },
  });
  assert(updateEventRes.status === 200, 'Admin can update event (200)');
  assert(Number(updateEventRes.data?.price) === 550, 'Price updated to 550');

  // Related events endpoint
  const relatedRes = await request(`/events/${testEventId}/related?category=Workshop`);
  assert(relatedRes.status === 200, 'Public can fetch related events (200)');
  assert(Array.isArray(relatedRes.data), 'Related events returns an array');

  // Test 5: Real-time Socket.IO Integration
  console.log('\n--- 6. Socket.IO Real-time Seat Updates ---');
  const socketClient = ClientIO(`http://localhost:${TEST_PORT}`, {
    transports: ['websocket'],
  });

  await new Promise((resolve) => socketClient.on('connect', resolve));
  assert(socketClient.connected, 'Socket.IO client connected to backend');

  socketClient.emit('joinEvent', testEventId);

  let socketReceivedUpdate = null;
  socketClient.on('seatUpdate', (data) => {
    socketReceivedUpdate = data;
  });

  // Test 6: Booking & MySQL Transactions (SELECT ... FOR UPDATE)
  console.log('\n--- 7. Booking & Transaction Concurrency ---');
  // Attempt unauthenticated booking -> 401
  const unauthBookingRes = await request('/bookings', {
    method: 'POST',
    body: {
      event_id: testEventId,
      name: 'Unauth User',
      email: 'unauth@test.com',
      mobile: '9876543210',
      quantity: 1,
    },
  });
  assert(unauthBookingRes.status === 401, 'Unauthenticated booking attempt returns 401');

  // User 1 books 2 seats
  const booking1Res = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: {
      event_id: testEventId,
      name: 'Test Customer One',
      email: testUser1.email,
      mobile: testUser1.mobile,
      quantity: 2,
    },
  });
  assert(booking1Res.status === 201, 'User 1 booked 2 seats successfully (201)');
  const booking1Id = booking1Res.data?.id;
  assert(Number(booking1Res.data?.total_amount) === 2 * 550, 'Backend correctly calculated total_amount (1100)');
  assert(booking1Res.data?.user_id === user1Id, 'Booking associated with logged-in user');

  // Wait briefly for socket broadcast
  await new Promise((r) => setTimeout(r, 200));
  assert(
    socketReceivedUpdate?.eventId === testEventId && Number(socketReceivedUpdate?.availableSeats) === 3,
    'Socket client received real-time seatUpdate event: 3 seats remaining'
  );

  // Test QR Ticket Verification Endpoint
  console.log('\n--- 7b. QR Ticket Verification Endpoint ---');
  const verifyRes = await request(`/bookings/verify/EVENTLY-BOOKING-${booking1Id}`);
  assert(verifyRes.status === 200, 'Verify endpoint reachable (200)');
  assert(verifyRes.data?.valid === true, 'Verification confirms ticket is VALID');
  assert(verifyRes.data?.reference === `EVENTLY-BOOKING-${booking1Id}`, 'Verification returned correct reference');
  assert(verifyRes.data?.event?.title?.includes('Test Event'), 'Verification includes event title');
  assert(verifyRes.data?.attendee?.name === 'Test Customer One', 'Verification includes attendee info');

  // Also test verification by plain numeric ID
  const verifyNumRes = await request(`/bookings/verify/${booking1Id}`);
  assert(verifyNumRes.status === 200 && verifyNumRes.data?.valid === true, 'Verification by numeric ID succeeds');

  // Test Socket.IO Temporary Seat Reservation Hold
  console.log('\n--- 7c. Socket.IO Temporary Seat Hold Broadcast ---');
  let holdNotification = null;
  socketClient.on('seatsHeld', (d) => { holdNotification = d; });
  socketClient.emit('holdSeats', { eventId: testEventId, quantity: 1, ticketTier: 'VIP' });
  await new Promise((r) => setTimeout(r, 200));
  assert(
    holdNotification?.eventId === testEventId && holdNotification?.heldQuantity === 1,
    'Socket client received temporary seat reservation hold broadcast'
  );
  socketClient.emit('releaseHold', { eventId: testEventId });

  // Insufficient seats test: 3 seats remain, attempt to book 4 -> 409
  const overbookRes = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: {
      event_id: testEventId,
      name: 'Test Customer One',
      email: testUser1.email,
      mobile: testUser1.mobile,
      quantity: 4,
    },
  });
  assert(overbookRes.status === 409, 'Attempt to book more than available seats returns 409 Conflict');

  // Concurrency test: 3 seats remain. 2 concurrent requests for 2 seats each (2 + 2 = 4 > 3).
  // Exactly ONE must succeed and ONE must fail with 409!
  console.log('\n--- 8. Concurrent Booking Race Condition Test ---');
  const [race1, race2] = await Promise.all([
    request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: { event_id: testEventId, name: 'Racer 1', email: testUser1.email, mobile: '9876543210', quantity: 2 },
    }),
    request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: { event_id: testEventId, name: 'Racer 2', email: testUser1.email, mobile: '9876543210', quantity: 2 },
    }),
  ]);

  const raceStatuses = [race1.status, race2.status].sort();
  assert(
    raceStatuses[0] === 201 && raceStatuses[1] === 409,
    'Concurrency control (SELECT ... FOR UPDATE): Exactly 1 won (201) and 1 rejected (409)'
  );

  const eventAfterRace = await request(`/events/${testEventId}`);
  assert(Number(eventAfterRace.data?.available_seats) === 1, 'Exact 1 seat remains after concurrent race');

  // Test 7: User Booking History & Access Isolation
  console.log('\n--- 9. User Booking History & Access Isolation ---');
  // Register User 2
  const testUser2 = {
    name: 'Customer Two',
    email: `customer2_${timestamp}@evently.test`,
    mobile: '9876543211',
    password: 'Password@456',
    confirmPassword: 'Password@456',
  };
  const user2Reg = await request('/auth/register', { method: 'POST', body: testUser2 });
  const user2Token = user2Reg.data?.token;

  // User 1 sees their booking in my-bookings
  const user1BookingsRes = await request('/users/bookings', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(user1BookingsRes.status === 200, 'User 1 can fetch their bookings');
  const user1HasBooking1 = user1BookingsRes.data.some((b) => b.id === booking1Id);
  assert(user1HasBooking1, 'User 1 booking history contains booking1');

  // User 2 sees their own bookings (empty for test event)
  const user2BookingsRes = await request('/users/bookings', {
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  assert(user2BookingsRes.status === 200, 'User 2 can fetch their bookings');
  const user2HasBooking1 = user2BookingsRes.data.some((b) => b.id === booking1Id);
  assert(!user2HasBooking1, 'User 2 booking history does NOT contain User 1 booking');

  // Privacy Isolation Check: User 2 tries to access User 1's booking by ID
  const user2AccessRes = await request(`/bookings/${booking1Id}`, {
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  assert(
    user2AccessRes.status === 403,
    'User 2 accessing User 1 booking returns 403 Forbidden (Privacy Isolation)'
  );

  // Admin access to booking details
  const adminBookingRes = await request(`/bookings/${booking1Id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminBookingRes.status === 200, 'Admin can view any booking details (200)');

  // Test 8: Booking Cancellation & Seat Restoration
  console.log('\n--- 10. Booking Cancellation & Seat Restoration ---');
  // User 2 tries to cancel User 1 booking -> 403
  const user2CancelRes = await request(`/bookings/${booking1Id}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  assert(user2CancelRes.status === 403, 'User 2 cannot cancel User 1 booking (403 Forbidden)');

  // Reset socket listener tracker
  socketReceivedUpdate = null;

  // User 1 cancels their own booking (quantity = 2)
  const user1CancelRes = await request(`/bookings/${booking1Id}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(user1CancelRes.status === 200, 'User 1 cancelled their own booking (200)');

  // Verify seat restoration in DB
  const eventAfterCancel = await request(`/events/${testEventId}`);
  assert(
    Number(eventAfterCancel.data?.available_seats) === 3,
    'Available seats restored from 1 to 3 after cancellation'
  );

  // Verify socket emission on cancellation
  await new Promise((r) => setTimeout(r, 200));
  assert(
    socketReceivedUpdate?.eventId === testEventId && Number(socketReceivedUpdate?.availableSeats) === 3,
    'Socket client received real-time seatUpdate event after cancellation: 3 seats'
  );

  // Attempt to cancel again -> 409 Conflict
  const cancelAgainRes = await request(`/bookings/${booking1Id}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(cancelAgainRes.status === 409, 'Cancelling already cancelled booking returns 409 Conflict');

  // Verify ticket invalidation in verification route after cancellation
  const verifyAfterCancelRes = await request(`/bookings/verify/EVENTLY-BOOKING-${booking1Id}`);
  assert(verifyAfterCancelRes.status === 200, 'Verify endpoint reachable for cancelled booking');
  assert(verifyAfterCancelRes.data?.valid === false, 'Verification marks cancelled ticket as NOT valid (false)');
  assert(verifyAfterCancelRes.data?.status === 'cancelled', 'Verification status returned as "cancelled"');

  // Clean up
  socketClient.disconnect();
  console.log('\n--- Cleanup Test Event & Records ---');
  await pool.execute('DELETE FROM bookings WHERE event_id = ?', [testEventId]);
  await pool.execute('DELETE FROM events WHERE id = ?', [testEventId]);
  await pool.execute('DELETE FROM users WHERE email IN (?, ?)', [testUser1.email, testUser2.email]);
  console.log('Cleaned up test data.');

  await teardownServer();

  console.log('\n========================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (e) => {
  console.error('Test script crashed:', e);
  await teardownServer();
  process.exit(1);
});
