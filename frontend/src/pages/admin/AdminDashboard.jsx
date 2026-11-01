// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, BookOpen, TrendingUp, Clock, CheckCircle, XCircle,
  Tag, Download, Plus, Filter, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import { getStats, getAnalytics, exportBookingsCsv, exportEventsCsv } from '../../services/adminService';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-6 flex items-center gap-5 border border-brand-border"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-display font-black text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function statusBadge(status) {
  if (status === 'confirmed')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
        <CheckCircle size={11} /> Confirmed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
      <XCircle size={11} /> Cancelled
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState(null);
  const [exportingBookings, setExportingBookings] = useState(false);
  const [exportingEvents, setExportingEvents] = useState(false);

  const fetchDashboardData = async (range = dateRange) => {
    try {
      setLoadingAnalytics(true);
      const [statsRes, analyticsRes] = await Promise.all([
        getStats(range),
        getAnalytics(range),
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange]);

  const handleExportBookings = async () => {
    try {
      setExportingBookings(true);
      const res = await exportBookingsCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evently-bookings-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export bookings CSV:', err);
      alert('Could not export bookings CSV.');
    } finally {
      setExportingBookings(false);
    }
  };

  const handleExportEvents = async () => {
    try {
      setExportingEvents(true);
      const res = await exportEventsCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evently-events-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export events CSV:', err);
      alert('Could not export events CSV.');
    } finally {
      setExportingEvents(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-12">
        {/* Header & Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display font-black text-3xl text-white mb-1">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Overview, real-time analytics & reports for your events</p>
          </div>

          {/* Quick Actions & Date Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex bg-brand-dark/90 p-1 rounded-xl border border-brand-border text-xs font-semibold">
              {[
                { label: '7 Days', val: '7d' },
                { label: '30 Days', val: '30d' },
                { label: 'All Time', val: 'all' },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setDateRange(btn.val)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateRange === btn.val
                      ? 'bg-brand-purple text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* CSV Export Bookings */}
            <button
              onClick={handleExportBookings}
              disabled={exportingBookings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-brand-border bg-white/5 hover:bg-white/10 text-gray-200 transition disabled:opacity-50"
              title="Download bookings CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span>{exportingBookings ? 'Exporting…' : 'Bookings CSV'}</span>
            </button>

            {/* CSV Export Events */}
            <button
              onClick={handleExportEvents}
              disabled={exportingEvents}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-brand-border bg-white/5 hover:bg-white/10 text-gray-200 transition disabled:opacity-50"
              title="Download events CSV"
            >
              <Download size={14} className="text-pink-400" />
              <span>{exportingEvents ? 'Exporting…' : 'Events CSV'}</span>
            </button>

            {/* Create Event CTA */}
            <Link
              to="/admin/events?create=true"
              className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus size={15} /> New Event
            </Link>
          </div>
        </motion.div>

        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 h-28 animate-pulse bg-white/5" />
            ))}
          </div>
        )}

        {stats && (
          <>
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
              <StatCard icon={Calendar}   label="Total Events"    value={stats.totalEvents}    color="bg-brand-purple" delay={0} />
              <StatCard icon={BookOpen}   label="Total Bookings"  value={stats.totalBookings}  color="bg-brand-violet" delay={0.05} />
              <StatCard icon={TrendingUp} label="Upcoming Events" value={stats.upcomingEvents} color="bg-emerald-600" delay={0.1} />
              <StatCard icon={Tag}        label="Total Revenue"   value={`₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`} color="bg-amber-600" delay={0.15} />
              <StatCard icon={Clock}      label="Recent Activity" value={`${stats.recentBookings?.length || 0} latest`} color="bg-pink-600" delay={0.2} />
            </div>

            {/* Interactive MySQL Analytics Charts */}
            <AnalyticsCharts analytics={analytics} loading={loadingAnalytics} />

            {/* Recent Bookings Table */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl overflow-hidden border border-brand-border bg-brand-dark/60 mt-8"
            >
              <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Recent Bookings</h2>
                  <p className="text-xs text-gray-500">Live ticket transactions stream</p>
                </div>
                <Link
                  to="/admin/bookings"
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  View All Bookings →
                </Link>
              </div>

              {stats.recentBookings?.length === 0 ? (
                <p className="px-6 py-8 text-gray-500 text-sm text-center">No bookings recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 text-left">ID</th>
                        <th className="px-6 py-3 text-left">Customer</th>
                        <th className="px-6 py-3 text-left">Event</th>
                        <th className="px-6 py-3 text-left">Tier & Qty</th>
                        <th className="px-6 py-3 text-left">Amount</th>
                        <th className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentBookings.map((b, i) => (
                        <tr
                          key={b.id}
                          className={`border-b border-brand-border/40 hover:bg-white/5 transition ${
                            i % 2 === 0 ? '' : 'bg-white/[0.02]'
                          }`}
                        >
                          <td className="px-6 py-3 font-mono text-brand-purple font-semibold">
                            #{String(b.id).padStart(5, '0')}
                          </td>
                          <td className="px-6 py-3 text-white font-medium">{b.name}</td>
                          <td className="px-6 py-3 text-gray-400 max-w-[200px] truncate">{b.event_title}</td>
                          <td className="px-6 py-3 text-gray-300">
                            {b.quantity}x{' '}
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-brand-purple">
                              {b.ticket_category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-white font-semibold">
                            ₹{Number(b.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3">{statusBadge(b.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
