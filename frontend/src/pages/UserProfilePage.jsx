// src/pages/UserProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Ticket, CheckCircle, XCircle,
  Hash, Clock, ArrowRight, Edit3, X, Check, AlertCircle, LogOut
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, getUserBookings, cancelUserBooking } from '../services/userService';

function StatusBadge({ status }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
      <XCircle size={12} />
      Cancelled
    </span>
  );
}

export default function UserProfilePage() {
  const { user, isUserAuthenticated, userLogout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Cancel Booking modal
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!isUserAuthenticated) {
      navigate('/login?redirect=/profile', { replace: true });
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [profRes, bookRes] = await Promise.all([
          getUserProfile(),
          getUserBookings(),
        ]);
        if (isMounted) {
          setProfile(profRes.data);
          updateUser(profRes.data);
          setEditForm({ name: profRes.data.name, mobile: profRes.data.mobile });
          setBookings(bookRes.data);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load profile data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [isUserAuthenticated, navigate]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setEditError('Name must be at least 2 characters.');
      return;
    }
    const cleanMobile = editForm.mobile.replace(/[\s-]/g, '');
    if (!/^\d{7,15}$/.test(cleanMobile)) {
      setEditError('Mobile number must be between 7 and 15 digits.');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const { data } = await updateUserProfile({
        name: editForm.name.trim(),
        mobile: cleanMobile,
      });
      setProfile(data);
      updateUser(data);
      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelUserBooking(cancelModalBooking.id);
      showToast('Booking cancelled successfully. Seats restored.');
      setCancelModalBooking(null);
      // Refresh bookings
      const { data } = await getUserBookings();
      setBookings(data);
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (!isUserAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl
              ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 lg:px-16 container-max max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl text-white mb-1">
              My <span className="text-gradient">Profile & Bookings</span>
            </h1>
            <p className="text-gray-400 text-sm">Manage your account information and view your event tickets</p>
          </div>
          <button
            onClick={() => { userLogout(); navigate('/'); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border text-gray-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition text-sm self-start sm:self-auto"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="glass rounded-2xl h-44 animate-pulse bg-white/5" />
            <div className="glass rounded-2xl h-64 animate-pulse bg-white/5" />
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* User Profile Card */}
            <div className="glass rounded-2xl p-6 md:p-8 border border-brand-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center text-white text-2xl font-bold glow-purple-sm">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">{profile?.name}</h2>
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-0.5">
                      <Mail size={13} className="text-brand-purple" /> {profile?.email}
                    </p>
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-0.5">
                      <Phone size={13} className="text-brand-purple" /> {profile?.mobile || 'Not provided'}
                    </p>
                  </div>
                </div>

                <button
                  id="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-purple/40 bg-brand-purple/10 text-brand-lavender hover:bg-brand-purple/20 transition text-sm font-medium self-start md:self-auto"
                >
                  <Edit3 size={15} /> Edit Profile
                </button>
              </div>
            </div>

            {/* Bookings Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-2xl">
                  Booking History <span className="text-gray-500 text-base font-normal">({bookings.length})</span>
                </h2>
                <Link to="/events" className="text-sm text-brand-lavender hover:text-white transition flex items-center gap-1">
                  Book More Events <ArrowRight size={14} />
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-brand-border">
                  <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4 text-brand-purple">
                    <Ticket size={28} />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">No Bookings Yet</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                    You haven&apos;t reserved any tickets yet. Explore upcoming concerts, tech summits, and cultural fests!
                  </p>
                  <Link to="/events" className="btn-primary py-2.5 px-6 inline-flex">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bookings.map((b) => {
                    const eventDate = b.event_date ? new Date(b.event_date) : null;
                    return (
                      <div
                        key={b.id}
                        className="glass rounded-2xl p-5 md:p-6 border border-brand-border hover:border-brand-purple/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-mono text-xs text-brand-purple bg-brand-purple/15 px-2.5 py-0.5 rounded-md font-semibold">
                              #{String(b.id).padStart(6, '0')}
                            </span>
                            <StatusBadge status={b.status} />
                            {b.ticket_category && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-purple/15 text-brand-purple px-2 py-0.5 rounded border border-brand-purple/25">
                                {b.ticket_category} Tier
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-xl text-white mb-2 leading-snug">
                            {b.title || 'Event Booking'}
                          </h3>

                          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-400">
                            {eventDate && (
                              <span className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-brand-purple" />
                                {eventDate.toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                            {b.location && (
                              <span className="flex items-center gap-1.5">
                                <span className="text-brand-purple">📍</span> {b.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Ticket size={13} className="text-brand-purple" />
                              <span>{b.quantity} seat{b.quantity > 1 ? 's' : ''}</span>
                              {b.seat_numbers && (
                                <span className="px-1.5 py-0.5 rounded bg-brand-purple/20 border border-brand-purple/40 text-[10px] font-mono text-brand-lavender font-bold">
                                  {b.seat_numbers}
                                </span>
                              )}
                            </span>
                            <span className="text-white font-semibold">
                              ₹{Number(b.total_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 self-end md:self-center">
                          <Link
                            to={`/booking/success/${b.id}`}
                            className="btn-primary py-2 px-4 text-xs font-semibold"
                          >
                            <Ticket size={14} /> View Ticket
                          </Link>

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => { setCancelModalBooking(b); setCancelError(''); }}
                              className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-brand-border">
                <h3 className="font-display font-bold text-xl">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {editError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> {editError}
                </div>
              )}

              <form onSubmit={handleEditProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white text-sm focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm(p => ({ ...p, mobile: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white text-sm focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-brand-border/40 text-gray-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Email address cannot be changed.</p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-brand-border text-sm text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="btn-primary py-2 px-5 text-sm font-semibold"
                  >
                    {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Booking Confirmation Modal */}
      <AnimatePresence>
        {cancelModalBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setCancelModalBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
                <h3 className="font-display font-bold text-xl text-white">Cancel Booking</h3>
                <button onClick={() => setCancelModalBooking(null)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {cancelError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> {cancelError}
                </div>
              )}

              <p className="text-gray-300 text-sm mb-6">
                Are you sure you want to cancel booking{' '}
                <span className="font-mono text-brand-purple font-semibold">
                  #{String(cancelModalBooking.id).padStart(6, '0')}
                </span>{' '}
                for <span className="text-white font-medium">{cancelModalBooking.title}</span>?
                Your reserved seats will be released back to the event.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-brand-border text-sm text-gray-300 hover:text-white transition"
                >
                  Keep Ticket
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

