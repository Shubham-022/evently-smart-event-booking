// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Ticket, User, Mail, Phone,
  ChevronLeft, AlertCircle, Lock, Crown, Star, Sparkles, ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { getEventById } from '../services/eventsService';
import { createBooking } from '../services/bookingsService';

const TIER_META = {
  General: { multiplier: 1.0, badge: 'Standard Entry', icon: Ticket, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  Premium: { multiplier: 1.5, badge: 'Front Row + Fast Track', icon: Star, color: 'text-brand-lavender border-brand-purple/40 bg-brand-purple/15' },
  VIP:     { multiplier: 2.5, badge: 'Backstage + Lounge Pass', icon: Crown, color: 'text-amber-400 border-amber-500/40 bg-amber-500/15' },
};

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-sm text-red-400 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isUserAuthenticated } = useAuth();

  const passedSeats = location.state?.selectedSeats ?? null;
  const passedQuantity = passedSeats && passedSeats.length > 0 ? passedSeats.length : (location.state?.quantity ?? 1);
  const passedCategory = location.state?.ticket_category ?? 'General';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update form fields if user loads after mount
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        mobile: prev.mobile || user.mobile || '',
      }));
    }
  }, [user]);

  // Fetch event details
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getEventById(id);
        if (!cancelled) {
          setEvent(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPageError('Unable to load event details.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    const cleanMobile = form.mobile.replace(/[\s-]/g, '');
    if (!/^\d{7,15}$/.test(cleanMobile)) e.mobile = 'Mobile must be 7-15 digits';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setApiError('');
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!isUserAuthenticated) {
      navigate(`/login?redirect=/booking/${id}`, {
        state: { selectedSeats: passedSeats, quantity: passedQuantity, ticket_category: passedCategory },
      });
      return;
    }

    if (!validate()) return;
    setApiError('');
    setSubmitting(true);

    try {
      const { data } = await createBooking({
        event_id: Number(id),
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        quantity: Number(passedQuantity),
        ticket_category: passedCategory,
        seat_ids: passedSeats && passedSeats.length > 0 ? passedSeats : undefined,
      });

      navigate(`/booking/success/${data.id}`, { state: { booking: data } });
    } catch (err) {
      if (err.response) {
        const { status, data: d } = err.response;
        if (status === 409) {
          setApiError(d.error || `Not enough seats. ${d.availableSeats != null ? `Only ${d.availableSeats} seat(s) left.` : ''}`);
        } else if (status === 404) {
          setApiError('Event not found.');
        } else if (status === 401) {
          setApiError('Session expired. Please log in again.');
        } else if (status === 400) {
          setApiError(Array.isArray(d.errors) ? d.errors.join(', ') : (d.error || 'Validation error'));
        } else {
          setApiError(d.error || 'Booking failed. Please try again.');
        }
      } else {
        setApiError('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-brand-darker text-white flex items-center justify-center">
        <p className="text-red-400 text-xl">{pageError}</p>
      </div>
    );
  }

  const basePrice = Number(event.price);
  const tierInfo = TIER_META[passedCategory] || TIER_META.General;
  const unitPrice = Math.round(basePrice * tierInfo.multiplier);
  const totalAmount = unitPrice * Number(passedQuantity);
  const eventDate = new Date(event.date);
  const coverImage = event.img || `https://picsum.photos/seed/${event.id}/800/400`;
  const TierIcon = tierInfo.icon;

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />

      <motion.main
        className="flex-1 pt-24 pb-16 px-4 md:px-8 lg:px-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container-max max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group text-sm"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Event Details
          </button>

          {!isUserAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-brand-purple/40 bg-brand-purple/10 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple flex-shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="font-semibold text-white">Sign In Required</p>
                  <p className="text-sm text-gray-300">You must be logged in to Evently to confirm ticket reservations.</p>
                </div>
              </div>
              <Link
                to={`/login?redirect=/booking/${id}`}
                state={{ quantity: passedQuantity, ticket_category: passedCategory }}
                className="btn-primary py-2 px-5 text-sm self-start sm:self-auto whitespace-nowrap"
              >
                Sign In to Continue
              </Link>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Event summary & selected tier */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl overflow-hidden sticky top-24 border border-brand-border shadow-xl">
                <img
                  src={coverImage}
                  alt={event.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-6">
                  {/* Category Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-brand-lavender font-semibold px-2.5 py-0.5 rounded-full bg-brand-purple/15 border border-brand-purple/30">
                      {event.category || 'Event'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierInfo.color}`}>
                      <TierIcon size={12} /> {passedCategory}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-xl mb-3 leading-snug">{event.title}</h2>
                  <div className="space-y-2 text-xs text-gray-400 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-brand-purple flex-shrink-0" />
                      <span>{eventDate.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-brand-purple flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Tier Perks Card */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-brand-border/60 mb-5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                      <TierIcon size={13} className="text-brand-purple" /> {passedCategory} Tier Inclusions
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{tierInfo.badge}</p>
                  </div>

                  {/* Financial breakdown */}
                  <div className="border-t border-brand-border pt-4 space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between items-start">
                      <span>Seats Reserved</span>
                      <div className="text-right">
                        <span className="text-white font-medium">{passedQuantity} ticket{passedQuantity > 1 ? 's' : ''}</span>
                        {passedSeats && passedSeats.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1 mt-1 max-w-[200px]">
                            {passedSeats.map(sn => (
                              <span key={sn} className="px-1.5 py-0.5 rounded bg-brand-purple/20 border border-brand-purple/40 text-[10px] font-mono font-bold text-brand-lavender">
                                {sn}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Tier Unit Price</span>
                      <span className="text-white font-medium">₹{unitPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white text-base border-t border-brand-border/60 pt-3 mt-2">
                      <span>Total Amount</span>
                      <span className="text-gradient font-display text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking Attendee Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="glass rounded-2xl p-8 border border-brand-border shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h1 className="font-display font-bold text-2xl text-white">Checkout & Confirmation</h1>
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <ShieldCheck size={13} /> Secured SSL
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-8">
                  {isUserAuthenticated
                    ? 'Confirm your booking details. An official QR ticket will be issued immediately.'
                    : 'Please sign in to proceed with your ticket reservation.'}
                </p>

                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm"
                  >
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{apiError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="booking-name" className="block text-sm font-medium mb-2 text-gray-300">
                      <User size={13} className="inline mr-1.5 text-brand-purple" /> Full Name
                    </label>
                    <input
                      id="booking-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Ravi Sharma"
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${formErrors.name ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                    />
                    <FieldError msg={formErrors.name} />
                  </div>

                  <div>
                    <label htmlFor="booking-email" className="block text-sm font-medium mb-2 text-gray-300">
                      <Mail size={13} className="inline mr-1.5 text-brand-purple" /> Email Address
                    </label>
                    <input
                      id="booking-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. ravi@example.com"
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${formErrors.email ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                    />
                    <FieldError msg={formErrors.email} />
                  </div>

                  <div>
                    <label htmlFor="booking-mobile" className="block text-sm font-medium mb-2 text-gray-300">
                      <Phone size={13} className="inline mr-1.5 text-brand-purple" /> Mobile Number
                    </label>
                    <input
                      id="booking-mobile"
                      name="mobile"
                      type="tel"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${formErrors.mobile ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                    />
                    <FieldError msg={formErrors.mobile} />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="confirm-booking-btn"
                      disabled={submitting}
                      className="w-full py-4 btn-primary justify-center text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                          Confirming Reservation…
                        </>
                      ) : !isUserAuthenticated ? (
                        <>
                          <Lock size={18} /> Sign In to Confirm &mdash; ₹{totalAmount.toLocaleString('en-IN')}
                        </>
                      ) : (
                        <>
                          <Ticket size={18} /> Confirm {passedCategory} Booking &mdash; ₹{totalAmount.toLocaleString('en-IN')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
