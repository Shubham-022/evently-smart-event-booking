// src/pages/admin/AdminEventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Check, AlertCircle, Search, Download, FileSpreadsheet } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAllEvents, createEvent, updateEvent, deleteEvent, exportEventsCsv } from '../../services/adminService';

const EMPTY_FORM = {
  title: '', description: '', location: '', date: '',
  total_seats: '', price: '', img: '', category: 'Conference',
};

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
          className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
            <h2 className="font-display font-bold text-xl">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EventForm({ initial = EMPTY_FORM, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initial);
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSubmit(form); };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        name={name} type={type} value={form[name]} onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}
      {field('title', 'Event Title *', 'text', 'e.g. Tech Summit 2026')}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
        <textarea
          name="description" value={form.description} onChange={handleChange} rows={3}
          placeholder="Event description..."
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition resize-none"
        />
      </div>
      {field('location', 'Location *', 'text', 'e.g. Mumbai, Maharashtra')}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Category *</label>
        <select
          name="category"
          value={form.category || 'Conference'}
          onChange={handleChange}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition"
        >
          <option value="Conference">Conference</option>
          <option value="Workshop">Workshop</option>
          <option value="Music">Music</option>
          <option value="Networking">Networking</option>
          <option value="Arts & Culture">Arts & Culture</option>
          <option value="Sports & Fitness">Sports & Fitness</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {field('date', 'Date & Time *', 'datetime-local')}
      <div className="grid grid-cols-2 gap-4">
        {field('total_seats', 'Total Seats *', 'number', 'e.g. 200')}
        {field('price', 'Price (INR) *', 'number', 'e.g. 999')}
      </div>
      {field('img', 'Image URL', 'url', 'https://...')}
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
          {submitting
            ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"/>Saving…</>
            : <><Check size={15} className="mr-1" />Save Event</>}
        </button>
      </div>
    </form>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <Modal title="Confirm Action" onClose={onCancel}>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-brand-border text-gray-300 hover:text-white text-sm transition">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50">
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await getAllEvents();
      setEvents(data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = useCallback(() => {
    setSelected(null);
    setFormError('');
    setModal('create');
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);

  const toFormDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const pad = n => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  const openEdit = (ev) => {
    setSelected({
      ...ev,
      date: toFormDate(ev.date),
      total_seats: String(ev.total_seats),
      price: String(ev.price),
      img: ev.img || '',
      category: ev.category || 'Conference',
    });
    setFormError('');
    setModal('edit');
  };
  const openDelete = (ev) => { setSelected(ev); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setFormError(''); };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
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
      showToast('Events exported to CSV.');
    } catch (err) {
      console.error(err);
      showToast('Failed to export events CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const toISODateString = (dateLocal) => {
    // datetime-local gives "YYYY-MM-DDTHH:mm", backend wants "YYYY-MM-DDTHH:mm:ss"
    return dateLocal.length === 16 ? dateLocal + ':00' : dateLocal;
  };

  const handleCreate = async (form) => {
    setFormError(''); setSubmitting(true);
    try {
      await createEvent({ ...form, date: toISODateString(form.date), total_seats: Number(form.total_seats), price: Number(form.price) });
      showToast('Event created successfully!');
      closeModal(); load();
    } catch (err) {
      const d = err.response?.data;
      setFormError(Array.isArray(d?.errors) ? d.errors.join(', ') : (d?.error || 'Creation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (form) => {
    setFormError(''); setSubmitting(true);
    try {
      await updateEvent(selected.id, { ...form, date: toISODateString(form.date), total_seats: Number(form.total_seats), price: Number(form.price) });
      showToast('Event updated successfully!');
      closeModal(); load();
    } catch (err) {
      const d = err.response?.data;
      setFormError(Array.isArray(d?.errors) ? d.errors.join(', ') : (d?.error || 'Update failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteEvent(selected.id);
      showToast('Event deleted.');
      closeModal(); load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed.', 'error');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl
                ${toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-green-600 text-white'}`}
            >
              {toast.type === 'error' ? <AlertCircle size={15}/> : <Check size={15}/>}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="font-display font-black text-3xl text-white mb-1">Event Management</h1>
            <p className="text-gray-500 text-sm">{events.length} total event{events.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-semibold transition disabled:opacity-50"
            >
              <FileSpreadsheet size={16} className="text-pink-400" />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
            <button id="create-event-btn" onClick={openCreate} className="btn-primary py-2.5 px-5 text-sm">
              <Plus size={16}/> Create Event
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events by title or location…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition"
          />
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-16 animate-pulse bg-white/5" />
            ))}
          </div>
        )}

        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="glass rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <p className="py-16 text-center text-gray-500 text-sm">
                {search ? 'No events match your search.' : 'No events found. Create one!'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Title</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Location</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Seats</th>
                      <th className="px-5 py-3 text-left">Price</th>
                      <th className="px-5 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ev, i) => (
                      <tr key={ev.id} className={`border-b border-brand-border/40 hover:bg-white/3 transition ${i%2===0?'':'bg-white/[0.02]'}`}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-white max-w-[200px] truncate">{ev.title}</p>
                          <p className="text-xs text-gray-600">ID #{ev.id}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-purple/15 text-brand-purple border border-brand-purple/20">
                            {ev.category || 'General'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 max-w-[140px] truncate">{ev.location}</td>
                        <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(ev.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`font-medium ${ev.available_seats === 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {ev.available_seats}
                          </span>
                          <span className="text-gray-600">/{ev.total_seats}</span>
                        </td>
                        <td className="px-5 py-3 text-white">&#8377;{Number(ev.price).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(ev)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-lavender hover:bg-brand-purple/15 transition"
                              title="Edit"
                            ><Pencil size={15}/></button>
                            <button
                              onClick={() => openDelete(ev)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Delete"
                            ><Trash2 size={15}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {modal === 'create' && (
          <Modal title="Create New Event" onClose={closeModal}>
            <EventForm onSubmit={handleCreate} submitting={submitting} error={formError} />
          </Modal>
        )}
        {modal === 'edit' && selected && (
          <Modal title="Edit Event" onClose={closeModal}>
            <EventForm initial={selected} onSubmit={handleEdit} submitting={submitting} error={formError} />
          </Modal>
        )}
        {modal === 'delete' && selected && (
          <ConfirmDialog
            message={`Are you sure you want to delete "${selected.title}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            onCancel={closeModal}
            loading={submitting}
          />
        )}
      </div>
    </AdminLayout>
  );
}
