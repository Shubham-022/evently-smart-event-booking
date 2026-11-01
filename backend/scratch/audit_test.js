// backend/scratch/audit_test.js
// Simple audit script using native fetch (Node >=18) and console output.
// Run with: node backend/scratch/audit_test.js

const baseUrl = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log('--- Admin registration (may already exist) ---');
  const reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Admin', email: 'admin@example.com', password: 'Password123!' },
  });
  console.log('Register status:', reg.status, reg.data);

  console.log('\n--- Admin login ---');
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'Password123!' },
  });
  console.log('Login status:', login.status, login.data);
  const token = login.data?.token;
  if (!token) {
    console.error('Unable to obtain JWT token, aborting further tests.');
    return;
  }
  const authHeader = { Authorization: `Bearer ${token}` };

  console.log('\n--- Protected route without token (should be 401) ---');
  const noAuth = await request('/events', { method: 'POST', body: { title: 'X', location: 'Y', date: '2025-12-01T10:00:00', total_seats: 10, price: 5 } });
  console.log('No token status:', noAuth.status);

  console.log('\n--- Create test event (protected) ---');
  const eventRes = await request('/events', {
    method: 'POST',
    headers: authHeader,
    body: {
      title: 'Concurrency Test Event',
      description: 'Event for concurrency audit',
      location: 'TestLocation',
      date: '2030-01-01T12:00:00',
      total_seats: 2,
      price: 10,
      img: null,
    },
  });
  console.log('Create event status:', eventRes.status, eventRes.data);
  const eventId = eventRes.data?.id || eventRes.data?.insertId;
  if (!eventId) {
    console.error('Failed to create event, aborting.');
    return;
  }

  console.log('\n--- Parallel bookings (quantity=2 each) ---');
  const bookingPayload = {
    event_id: eventId,
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '1234567890',
    quantity: 2,
  };
  const [b1, b2] = await Promise.all([
    request('/bookings', { method: 'POST', body: bookingPayload }),
    request('/bookings', { method: 'POST', body: bookingPayload }),
  ]);
  console.log('Booking 1:', b1.status, b1.data);
  console.log('Booking 2:', b2.status, b2.data);

  console.log('\n--- Verify event seat count after bookings ---');
  const eventAfter = await request(`/events/${eventId}`);
  console.log('Event after bookings status:', eventAfter.status, eventAfter.data);

  // Determine a successful booking ID to cancel
  const successful = b1.status === 201 ? b1.data.id : b2.status === 201 ? b2.data.id : null;
  if (successful) {
    console.log('\n--- Cancel the successful booking ---');
    const cancel = await request(`/bookings/${successful}/cancel`, { method: 'PUT', headers: authHeader });
    console.log('Cancel status:', cancel.status, cancel.data);
  } else {
    console.log('No successful booking to cancel.');
  }

  console.log('\n--- Verify event seat count after cancellation ---');
  const eventFinal = await request(`/events/${eventId}`);
  console.log('Event final status:', eventFinal.status, eventFinal.data);
}

main().catch((e) => console.error('Audit script error:', e));
