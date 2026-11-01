// backend/controllers/adminController.js
import {
  getDashboardStatsService,
  getAdminAnalyticsService,
  exportBookingsCsvService,
  exportEventsCsvService,
} from '../services/adminService.js';

/** GET /api/admin/stats */
export async function getDashboardStats(req, res) {
  try {
    const range = req.query.range || 'all';
    const stats = await getDashboardStatsService(range);
    return res.json(stats);
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/admin/analytics */
export async function getAdminAnalytics(req, res) {
  try {
    const range = req.query.range || 'all';
    const analytics = await getAdminAnalyticsService(range);
    return res.json(analytics);
  } catch (err) {
    console.error('getAdminAnalytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET /api/admin/reports/bookings/export */
export async function exportBookingsCsv(req, res) {
  try {
    const csvData = await exportBookingsCsvService();
    const filename = `bookings-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvData);
  } catch (err) {
    console.error('exportBookingsCsv error:', err);
    return res.status(500).json({ error: 'Failed to export bookings CSV' });
  }
}

/** GET /api/admin/reports/events/export */
export async function exportEventsCsv(req, res) {
  try {
    const csvData = await exportEventsCsvService();
    const filename = `events-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvData);
  } catch (err) {
    console.error('exportEventsCsv error:', err);
    return res.status(500).json({ error: 'Failed to export events CSV' });
  }
}
