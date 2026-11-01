// src/components/admin/AnalyticsCharts.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, PieChart, Users, AlertCircle, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

export default function AnalyticsCharts({ analytics, loading }) {
  const [activeTab, setActiveTab] = useState('trends'); // 'trends' | 'revenue'

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
        <div className="glass rounded-2xl p-6 h-72 animate-pulse bg-white/5" />
        <div className="glass rounded-2xl p-6 h-72 animate-pulse bg-white/5" />
      </div>
    );
  }

  if (!analytics) return null;

  const { bookingTrends = [], bookingStatus = {}, popularEvents = [], occupancy = [], categories = [] } = analytics;

  // --- Line Chart Math (Booking Trends) ---
  const trendData = bookingTrends.length > 0 ? bookingTrends : [{ date: 'Today', total: 0, revenue: 0, confirmed: 0 }];
  const maxBookings = Math.max(...trendData.map((d) => d.total), 5);
  const chartW = 560;
  const chartH = 200;
  const padX = 40;
  const padY = 25;

  const getX = (idx) => {
    if (trendData.length === 1) return chartW / 2;
    return padX + (idx / (trendData.length - 1)) * (chartW - padX * 2);
  };
  const getY = (val) => chartH - padY - (val / maxBookings) * (chartH - padY * 2);

  const points = trendData.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
  const areaPath = trendData.length > 1
    ? `M ${getX(0)},${chartH - padY} L ${points} L ${getX(trendData.length - 1)},${chartH - padY} Z`
    : '';

  // --- Revenue Bar Chart Math ---
  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 1000);

  // --- Donut Chart Math (Status) ---
  const totalStatus = (bookingStatus.confirmed || 0) + (bookingStatus.cancelled || 0);
  const confirmedPct = totalStatus > 0 ? Math.round((bookingStatus.confirmed / totalStatus) * 100) : 0;
  const cancelledPct = totalStatus > 0 ? 100 - confirmedPct : 0;

  // SVG Donut calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const confirmedOffset = circumference - (confirmedPct / 100) * circumference;

  return (
    <div className="space-y-8 my-8">
      {/* Top Charts Row: Trends & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends / Revenue Chart (Col-span-2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-brand-border bg-brand-dark/70 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-purple" />
                <h3 className="font-display font-bold text-lg text-white">
                  {activeTab === 'trends' ? 'Booking Trends' : 'Daily Revenue Velocity'}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTab === 'trends' ? 'Daily booking reservations count' : 'Daily ticket gross revenue'}
              </p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-brand-border text-xs font-semibold">
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'trends' ? 'bg-brand-purple text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bookings Line
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'revenue' ? 'bg-brand-purple text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Revenue Bars
              </button>
            </div>
          </div>

          {/* SVG Visualizer */}
          <div className="w-full overflow-x-auto py-2">
            {activeTab === 'trends' ? (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 overflow-visible">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padY + ratio * (chartH - padY * 2);
                  const labelVal = Math.round(maxBookings * (1 - ratio));
                  return (
                    <g key={i}>
                      <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                      <text x={padX - 8} y={y + 4} fill="#6B7280" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area under curve */}
                {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

                {/* Line */}
                {trendData.length > 1 && (
                  <path d={`M ${points}`} fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Data Points */}
                {trendData.map((d, i) => {
                  const cx = getX(i);
                  const cy = getY(d.total);
                  return (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={cx} cy={cy} r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                      <text
                        x={cx}
                        y={chartH - 6}
                        fill="#9CA3AF"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.date ? d.date.slice(5) : ''}
                      </text>
                      {/* Hover / Point Label */}
                      <text
                        x={cx}
                        y={cy - 10}
                        fill="#E9D5FF"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {d.total}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              /* Revenue Bar Chart */
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 overflow-visible">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guidelines */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padY + ratio * (chartH - padY * 2);
                  const labelVal = Math.round(maxRevenue * (1 - ratio));
                  return (
                    <g key={i}>
                      <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                      <text x={padX - 8} y={y + 4} fill="#6B7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                        ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {trendData.map((d, i) => {
                  const barWidth = Math.min(36, (chartW - padX * 2) / trendData.length - 12);
                  const cx = getX(i);
                  const barH = ((d.revenue || 0) / maxRevenue) * (chartH - padY * 2);
                  const barY = chartH - padY - barH;

                  return (
                    <g key={i}>
                      <rect
                        x={cx - barWidth / 2}
                        y={barY}
                        width={barWidth}
                        height={Math.max(2, barH)}
                        rx="4"
                        fill="url(#barGrad)"
                        className="transition-all hover:opacity-80"
                      />
                      <text
                        x={cx}
                        y={chartH - 6}
                        fill="#9CA3AF"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.date ? d.date.slice(5) : ''}
                      </text>
                      {d.revenue > 0 && (
                        <text
                          x={cx}
                          y={barY - 6}
                          fill="#F472B6"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </motion.div>

        {/* Booking Status Donut Chart & Cancellation Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-brand-border bg-brand-dark/70 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChart size={18} className="text-pink-400" />
              <h3 className="font-display font-bold text-lg text-white">Booking Status</h3>
            </div>
            <p className="text-xs text-gray-400">Confirmation vs Cancellation ratio</p>
          </div>

          {/* Donut SVG */}
          <div className="relative flex items-center justify-center py-4">
            <svg width="170" height="170" viewBox="0 0 170 170" className="rotate-[-90deg]">
              {/* Background circle (Cancelled / Base) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="18"
                strokeOpacity="0.8"
              />
              {/* Foreground circle (Confirmed) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke="#10B981"
                strokeWidth="18"
                strokeDasharray={circumference}
                strokeDashoffset={confirmedOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display font-black text-2xl text-white">{confirmedPct}%</span>
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Confirmed</span>
            </div>
          </div>

          {/* Legend and Cancellation Metric */}
          <div className="border-t border-brand-border/60 pt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed
              </span>
              <span className="font-bold text-white">{bookingStatus.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cancelled
              </span>
              <span className="font-bold text-rose-400">{bookingStatus.cancelled || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-brand-border/40">
              <span className="text-gray-400 font-medium">Cancellation Rate:</span>
              <span className="font-mono font-bold text-amber-400">{bookingStatus.cancellationRate || 0}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Charts Row: Popular Events & Seat Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Events (Horizontal Bar Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 border border-brand-border bg-brand-dark/70"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-amber-400" />
              <h3 className="font-display font-bold text-lg text-white">Top Popular Events</h3>
            </div>
            <span className="text-xs text-gray-500">By Gross Revenue</span>
          </div>

          <div className="space-y-4">
            {popularEvents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No event bookings recorded yet.</p>
            ) : (
              popularEvents.slice(0, 5).map((ev, idx) => {
                const maxEvRev = popularEvents[0]?.revenue || 1;
                const pct = Math.min(100, Math.round(((ev.revenue || 0) / maxEvRev) * 100));

                return (
                  <div key={ev.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[280px]">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-brand-purple font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-white truncate">{ev.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-gray-400 text-[11px]">{ev.seatsSold} seats</span>
                        <span className="font-bold text-white font-mono">₹{Number(ev.revenue).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-purple via-brand-violet to-pink-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Event Seat Occupancy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border border-brand-border bg-brand-dark/70"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-400" />
              <h3 className="font-display font-bold text-lg text-white">Seat Occupancy Rates</h3>
            </div>
            <span className="text-xs text-gray-500">Real-Time Capacity</span>
          </div>

          <div className="space-y-4">
            {occupancy.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No events available.</p>
            ) : (
              occupancy.slice(0, 5).map((ev) => {
                const rate = ev.occupancyRate || 0;
                let colorClass = 'from-emerald-500 to-teal-400';
                if (rate >= 80) colorClass = 'from-amber-500 to-rose-500';
                else if (rate >= 50) colorClass = 'from-brand-purple to-brand-violet';

                return (
                  <div key={ev.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white truncate max-w-[280px]">{ev.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-gray-400 text-[11px]">
                          {ev.bookedSeats}/{ev.totalSeats}
                        </span>
                        <span className="font-mono font-bold text-white">{rate}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(3, rate))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

