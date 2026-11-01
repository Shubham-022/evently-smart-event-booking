// src/pages/VerifyTicketPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Calendar,
  MapPin, Ticket, User, Hash, ArrowLeft, CheckCircle2, Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { verifyBooking } from '../services/bookingsService';

export default function VerifyTicketPage() {
  const { refOrId } = useParams();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(refOrId || '');
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const performVerification = async (query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setTicketData(null);
    setSearched(true);

    try {
      const { data } = await verifyBooking(trimmed);
      setTicketData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to verify ticket. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refOrId) {
      setInputVal(refOrId);
      performVerification(refOrId);
    }
  }, [refOrId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      navigate(`/verify-ticket/${encodeURIComponent(inputVal.trim())}`, { replace: true });
      performVerification(inputVal.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="container-max max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple mb-4">
              <ShieldCheck size={32} />
            </div>
            <h1 className="font-display font-black text-3xl md:text-4xl mb-2">
              Verify <span className="text-gradient">Ticket</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
              Inspect authenticity for venue admission by entering the QR reference code or booking ID.
            </p>
          </div>

          {/* Search box */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="glass rounded-2xl p-2 border border-brand-border flex items-center gap-2 shadow-xl bg-brand-dark">
              <div className="pl-3 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. EVENTLY-BOOKING-6 or 6"
                className="flex-1 bg-transparent px-2 py-2 text-white placeholder-gray-500 focus:outline-none text-sm md:text-base font-mono"
              />
              <button
                type="submit"
                disabled={loading || !inputVal.trim()}
                className="btn-primary py-2.5 px-6 font-semibold text-sm disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </form>

          {/* Results Area */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Checking ticket authenticity in database…</p>
            </div>
          )}

          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-6 border border-red-500/30 bg-red-500/10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <ShieldX size={28} />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Verification Failed</h3>
              <p className="text-red-300 text-sm max-w-md mx-auto">{error}</p>
            </motion.div>
          )}

          {ticketData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl overflow-hidden border border-brand-border bg-brand-dark shadow-2xl"
            >
              {/* Status Header */}
              {ticketData.valid ? (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-400 text-base">VERIFIED GENUINE TICKET</h3>
                    <p className="text-emerald-300/80 text-xs">Valid for venue admission • Confirmed booking</p>
                  </div>
                  <span className="ml-auto font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ADMIT ONE
                  </span>
                </div>
              ) : (
                <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-400 text-base">TICKET CANCELLED / VOID</h3>
                    <p className="text-amber-300/80 text-xs">This booking was cancelled and is NOT valid for entry.</p>
                  </div>
                  <span className="ml-auto font-mono text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VOID
                  </span>
                </div>
              )}

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-brand-purple font-mono bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-0.5 rounded">
                    {ticketData.event?.category || 'Event'}
                  </span>
                  <h2 className="font-display font-bold text-2xl mt-2 text-white">
                    {ticketData.event?.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-brand-border/60 pt-4">
                  <div className="flex items-start gap-2.5">
                    <Calendar size={16} className="text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Date & Time</p>
                      <p className="font-medium text-gray-200">
                        {ticketData.event?.date
                          ? new Date(ticketData.event.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBA'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Venue</p>
                      <p className="font-medium text-gray-200">{ticketData.event?.location || 'TBA'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User size={16} className="text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Attendee</p>
                      <p className="font-medium text-gray-200">{ticketData.attendee?.name}</p>
                      {ticketData.attendee?.mobile && (
                        <p className="text-xs text-gray-400 font-mono">{ticketData.attendee.mobile}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Ticket size={16} className="text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Category & Seats</p>
                      <p className="font-medium text-gray-200">
                        {ticketData.quantity} Seat{ticketData.quantity > 1 ? 's' : ''}{' '}
                        <span className="ml-1 text-xs px-2 py-0.5 rounded font-bold uppercase bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                          {ticketData.ticket_category || 'General'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-border/60 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Booking Ref: </span>
                    <span className="font-mono text-brand-purple font-bold">{ticketData.reference}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount Paid: </span>
                    <span className="font-bold text-white">₹{Number(ticketData.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Booked On: </span>
                    <span className="text-gray-300">
                      {ticketData.booking_date
                        ? new Date(ticketData.booking_date).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation links */}
          <div className="mt-8 text-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <ArrowLeft size={16} /> Back to Events
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
