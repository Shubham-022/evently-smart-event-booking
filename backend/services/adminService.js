// backend/services/adminService.js
import pool from '../config/db.js';

/** Aggregated stats for admin dashboard */
export async function getDashboardStatsService(dateRange = 'all') {
  let dateFilter = '';
  if (dateRange === '7d') {
    dateFilter = 'WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  } else if (dateRange === '30d') {
    dateFilter = 'WHERE b.booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  }

  const [[totalEvents]]    = await pool.execute('SELECT COUNT(*) AS cnt FROM events');
  const [[totalBookings]]  = await pool.execute(
    dateFilter
      ? `SELECT COUNT(*) AS cnt FROM bookings b ${dateFilter}`
      : 'SELECT COUNT(*) AS cnt FROM bookings'
  );
  const [[upcomingEvents]] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM events WHERE `date` > NOW()'
  );
  const [[totalRevenue]]   = await pool.execute(
    dateFilter
      ? `SELECT COALESCE(SUM(b.total_amount), 0) AS rev FROM bookings b ${dateFilter} AND b.status = 'confirmed'`
      : "SELECT COALESCE(SUM(total_amount), 0) AS rev FROM bookings WHERE status = 'confirmed'"
  );

  const [recentBookings]   = await pool.execute(
    `SELECT b.id, b.name, b.email, b.quantity, b.ticket_category, b.total_amount, b.status, b.booking_date,
            e.title AS event_title, e.category AS event_category
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     ORDER BY b.booking_date DESC
     LIMIT 10`
  );

  return {
    totalEvents:    totalEvents.cnt,
    totalBookings:  totalBookings.cnt,
    upcomingEvents: upcomingEvents.cnt,
    totalRevenue:   Number(totalRevenue.rev),
    recentBookings,
  };
}

/** Comprehensive analytics using actual MySQL data */
export async function getAdminAnalyticsService(dateRange = 'all') {
  let whereClause = '';
  if (dateRange === '7d') {
    whereClause = 'WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  } else if (dateRange === '30d') {
    whereClause = 'WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  }

  // 1. Booking Trends & Daily Revenue
  const [trendRows] = await pool.execute(
    `SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') AS date_label,
            COUNT(*) AS total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_bookings,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_bookings,
            COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) AS daily_revenue
     FROM bookings
     ${whereClause}
     GROUP BY DATE_FORMAT(booking_date, '%Y-%m-%d')
     ORDER BY date_label ASC`
  );

  // 2. Booking Status breakdown (Donut chart data)
  const [statusRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed,
       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled
     FROM bookings
     ${whereClause}`
  );
  const statusStats = statusRows[0] || { total: 0, confirmed: 0, cancelled: 0 };
  const cancellationRate = statusStats.total > 0
    ? Number(((statusStats.cancelled / statusStats.total) * 100).toFixed(1))
    : 0;

  // 3. Popular Events by Revenue & Seats Sold
  const [popularRows] = await pool.execute(
    `SELECT e.id, e.title, e.category, e.total_seats, e.available_seats,
            COUNT(b.id) AS bookings_count,
            COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.quantity ELSE 0 END), 0) AS seats_sold,
            COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) AS total_revenue
     FROM events e
     LEFT JOIN bookings b ON e.id = b.event_id
     GROUP BY e.id, e.title, e.category, e.total_seats, e.available_seats
     ORDER BY total_revenue DESC, seats_sold DESC
     LIMIT 6`
  );

  // 4. Event Seat Occupancy
  const [occupancyRows] = await pool.execute(
    `SELECT id, title, category, total_seats, available_seats,
            (total_seats - available_seats) AS booked_seats,
            ROUND(((total_seats - available_seats) / total_seats) * 100, 1) AS occupancy_rate
     FROM events
     WHERE total_seats > 0
     ORDER BY occupancy_rate DESC
     LIMIT 8`
  );

  // 5. Category-wise Distribution
  const [categoryRows] = await pool.execute(
    `SELECT e.category,
            COUNT(DISTINCT e.id) AS event_count,
            COUNT(b.id) AS booking_count,
            COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) AS category_revenue
     FROM events e
     LEFT JOIN bookings b ON e.id = b.event_id
     GROUP BY e.category
     ORDER BY category_revenue DESC`
  );

  return {
    dateRange,
    bookingTrends: trendRows.map(r => ({
      date: r.date_label,
      total: Number(r.total_bookings),
      confirmed: Number(r.confirmed_bookings),
      cancelled: Number(r.cancelled_bookings),
      revenue: Number(r.daily_revenue),
    })),
    bookingStatus: {
      total: Number(statusStats.total),
      confirmed: Number(statusStats.confirmed),
      cancelled: Number(statusStats.cancelled),
      cancellationRate,
    },
    popularEvents: popularRows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      bookingsCount: Number(r.bookings_count),
      seatsSold: Number(r.seats_sold),
      revenue: Number(r.total_revenue),
    })),
    occupancy: occupancyRows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      totalSeats: Number(r.total_seats),
      availableSeats: Number(r.available_seats),
      bookedSeats: Number(r.booked_seats),
      occupancyRate: Number(r.occupancy_rate || 0),
    })),
    categories: categoryRows.map(r => ({
      category: r.category,
      eventCount: Number(r.event_count),
      bookingCount: Number(r.booking_count),
      revenue: Number(r.category_revenue),
    })),
  };
}

/** Generate CSV string of all bookings */
export async function exportBookingsCsvService() {
  const [rows] = await pool.execute(
    `SELECT b.id, e.title AS event_title, e.category, b.name AS customer_name,
            b.email, b.mobile, b.ticket_category, b.quantity, b.total_amount,
            b.booking_date, b.status
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     ORDER BY b.booking_date DESC`
  );

  const headers = [
    'Booking ID',
    'Event Title',
    'Category',
    'Customer Name',
    'Email',
    'Mobile',
    'Ticket Category',
    'Quantity',
    'Total Amount (INR)',
    'Booking Date',
    'Status',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      escapeCsv(r.event_title),
      escapeCsv(r.category),
      escapeCsv(r.customer_name),
      escapeCsv(r.email),
      escapeCsv(r.mobile),
      escapeCsv(r.ticket_category),
      r.quantity,
      r.total_amount,
      escapeCsv(r.booking_date ? new Date(r.booking_date).toISOString() : ''),
      escapeCsv(r.status),
    ].join(',')),
  ];

  return csvLines.join('\n');
}

/** Generate CSV string of all events */
export async function exportEventsCsvService() {
  const [rows] = await pool.execute(
    `SELECT e.id, e.title, e.category, e.location, e.\`date\`, e.price,
            e.total_seats, e.available_seats,
            (e.total_seats - e.available_seats) AS booked_seats,
            ROUND(((e.total_seats - e.available_seats) / e.total_seats) * 100, 1) AS occupancy_rate
     FROM events e
     ORDER BY e.\`date\` ASC`
  );

  const headers = [
    'Event ID',
    'Title',
    'Category',
    'Location',
    'Date & Time',
    'Price (INR)',
    'Total Seats',
    'Available Seats',
    'Booked Seats',
    'Occupancy (%)',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      escapeCsv(r.title),
      escapeCsv(r.category),
      escapeCsv(r.location),
      escapeCsv(r.date ? new Date(r.date).toISOString() : ''),
      r.price,
      r.total_seats,
      r.available_seats,
      r.booked_seats,
      r.occupancy_rate || 0,
    ].join(',')),
  ];

  return csvLines.join('\n');
}
