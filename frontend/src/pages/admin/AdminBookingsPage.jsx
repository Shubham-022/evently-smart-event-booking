// src/pages/admin/AdminBookingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertCircle, Check, Search, Eye, XCircle, CheckCircle,
  FileSpreadsheet, ChevronLeft, ChevronRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAllBookings, cancelBooking, exportBookingsCsv } from '../../services/adminService';

function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-lg"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
            <h2 className="font-display font-bold text-xl">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20}/></button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatusBadge({ status }) {
  if (status === 'confirmed')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25"><CheckCircle size={11}/>Confirmed</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25"><XCircle size={11}/>Cancelled</span>;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [exporting, setExporting] = useState(false);

  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'view' | 'cancel'
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await getAllBookings();
      setBookings(data);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openView   = (b) => { setSelected(b); setModal('view'); };
  const openCancel = (b) => { setSelected(b); setModal('cancel'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
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
      showToast('Bookings report downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Failed to export bookings CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await cancelBooking(selected.id);
      showToast('Booking cancelled successfully.');
      closeModal(); load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Cancellation failed.', 'error');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = bookings.filter(b => {
    const term = search.toLowerCase();
    const matchSearch =
      b.name.toLowerCase().includes(term) ||
      b.email.toLowerCase().includes(term) ||
      String(b.id).includes(term) ||
      (b.title || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-12">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl
                ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}
            >
              {toast.type === 'error' ? <AlertCircle size={15}/> : <Check size={15}/>}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="font-display font-black text-3xl text-white mb-1">Booking Management</h1>
            <p className="text-gray-500 text-sm">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-semibold transition disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, booking ID or event…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 transition"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-14 animate-pulse bg-white/5" />
            ))}
          </div>
        )}

        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="glass rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <p className="py-16 text-center text-gray-500 text-sm">
                {search || statusFilter !== 'all' ? 'No bookings match your filters.' : 'No bookings found.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">ID</th>
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-left">Event</th>
                      <th className="px-5 py-3 text-left">Tier & Qty</th>
                      <th className="px-5 py-3 text-left">Amount</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((b, i) => (
                      <tr key={b.id} className={`border-b border-brand-border/40 hover:bg-white/3 transition ${i%2===0?'':'bg-white/[0.02]'}`}>
                        <td className="px-5 py-3 font-mono text-brand-purple">#{String(b.id).padStart(4,'0')}</td>
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">{b.name}</p>
                          <p className="text-xs text-gray-500">{b.email}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-400 max-w-[160px] truncate">{b.title || b.event_title || '—'}</td>
                        <td className="px-5 py-3 text-gray-300">
                          {b.quantity}x{' '}
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-brand-purple">
                            {b.ticket_category || 'General'}
                          </span>
                          {b.seat_numbers && (
                            <p className="text-[10px] font-mono text-brand-lavender mt-0.5">{b.seat_numbers}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-white font-medium">&#8377;{Number(b.total_amount).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                          {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(b)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-lavender hover:bg-brand-purple/15 transition"
                              title="View details"
                            ><Eye size={15}/></button>
                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => openCancel(b)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                title="Cancel booking"
                              ><XCircle size={15}/></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-brand-border bg-white/[0.01]">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} bookings
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-brand-border text-gray-400 hover:text-white disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-gray-300 font-mono px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-brand-border text-gray-400 hover:text-white disabled:opacity-40 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Modal */}
        {modal === 'view' && selected && (
          <Modal title="Booking Details" onClose={closeModal}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Booking ID', `#${String(selected.id).padStart(6,'0')}`],
                  ['Status', null],
                  ['Customer Name', selected.name],
                  ['Email', selected.email],
                  ['Mobile', selected.mobile],
                  ['Event', selected.title || selected.event_title || '—'],
                  ['Ticket Tier', (selected.ticket_category || 'General').toUpperCase()],
                  ['Quantity', selected.quantity],
                  ['Allocated Seats', selected.seat_numbers || 'Unassigned / General'],
                  ['Total Amount', `₹${Number(selected.total_amount).toLocaleString('en-IN')}`],
                  ['Booking Date', selected.booking_date ? new Date(selected.booking_date).toLocaleString('en-IN') : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    {label === 'Status'
                      ? <StatusBadge status={selected.status} />
                      : <p className="text-white text-sm font-medium break-all">{val}</p>}
                  </div>
                ))}
              </div>
              {selected.status === 'confirmed' && (
                <div className="pt-4 border-t border-brand-border">
                  <button
                    onClick={() => { closeModal(); setTimeout(() => openCancel(selected), 100); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-sm transition"
                  >
                    <XCircle size={15}/> Cancel this Booking
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Cancel Confirm Modal */}
        {modal === 'cancel' && selected && (
          <Modal title="Cancel Booking" onClose={closeModal}>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel booking <span className="text-brand-purple font-mono">#{String(selected.id).padStart(6,'0')}</span> for <span className="text-white font-medium">{selected.name}</span>?
              This will restore the seat(s) to the event.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-brand-border text-gray-300 hover:text-white text-sm transition">
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {submitting ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
