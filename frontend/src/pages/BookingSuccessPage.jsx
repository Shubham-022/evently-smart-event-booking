// src/pages/BookingSuccessPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle, Calendar, MapPin, Ticket, User, Hash,
  Download, ArrowLeft, Printer, AlertCircle, ShieldAlert, CheckCircle2, ExternalLink
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ConfettiCanvas from '../components/ConfettiCanvas';
import { getBooking } from '../services/bookingsService';
import { downloadTicketAsImage } from '../utils/ticketDownload';

export default function BookingSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateBooking = location.state?.booking;

  const qrRef = useRef(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const bookingId = stateBooking?.id || id;

    (async () => {
      try {
        const { data } = await getBooking(bookingId);
        if (!cancelled) {
          setBooking(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 403) {
            setError('Access Denied: You can only view your own bookings and tickets.');
          } else if (stateBooking) {
            setBooking(stateBooking);
          } else {
            setError(err.response?.data?.error || 'Booking not found.');
          }
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id, stateBooking]);

  const handleDownload = async () => {
    if (!booking) return;
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl) {
      window.print();
      return;
    }

    try {
      setDownloading(true);
      await downloadTicketAsImage(booking, svgEl);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Ticket download error:', e);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your ticket…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-darker text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Access Restricted</h2>
          <p className="text-red-400 max-w-md mb-6">{error}</p>
          <div className="flex gap-4">
            <Link to="/profile" className="btn-primary py-2.5 px-6">
              Go to My Bookings
            </Link>
            <Link to="/events" className="px-6 py-2.5 rounded-xl border border-brand-border text-gray-300 hover:text-white transition">
              Browse Events
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) return null;

  const eventDate = booking.event_date ? new Date(booking.event_date) : null;
  const qrValue = `EVENTLY-BOOKING-${booking.id}`;
  const eventTitle = booking.title || 'Event';
  const eventLocation = booking.location || 'Venue TBA';

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white relative">
      <ConfettiCanvas />
      <Navbar />

      <motion.main
        className="flex-1 pt-24 pb-16 px-4 md:px-8 lg:px-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container-max max-w-3xl mx-auto">
          {/* Success banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center text-center mb-10 print:hidden"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h1 className="font-display font-black text-4xl mb-2">
              Booking <span className="text-gradient">Confirmed!</span>
            </h1>
            <p className="text-gray-400 text-lg">Your ticket is reserved. Show this QR code at entry.</p>
          </motion.div>

          {/* Digital Ticket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative glass rounded-3xl overflow-hidden mb-8 border border-brand-border shadow-2xl bg-brand-dark"
            id="digital-ticket"
          >
            {/* Top rainbow gradient strip */}
            <div className="h-2 bg-gradient-to-r from-brand-purple via-brand-violet to-pink-500" />

            <div className="p-8">
              {/* Brand header */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center">
                  <Ticket size={14} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg">
                  <span className="text-white">Event</span><span className="text-gradient">ly</span>
                </span>
                <span className="ml-auto text-xs text-brand-purple font-mono uppercase tracking-widest bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full">
                  Digital Ticket
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Ticket info */}
                <div className="md:col-span-2 space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Event</p>
                    <h2 className="font-display font-bold text-2xl leading-snug">{eventTitle}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {eventDate && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Calendar size={11} className="text-brand-purple" /> Date & Time
                        </p>
                        <p className="text-sm font-medium">
                          {eventDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                    {eventLocation && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <MapPin size={11} className="text-brand-purple" /> Venue
                        </p>
                        <p className="text-sm font-medium">{eventLocation}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <User size={11} className="text-brand-purple" /> Attendee
                      </p>
                      <p className="text-sm font-medium">{booking.name}</p>
                      {booking.mobile && (
                        <p className="text-xs text-gray-400 mt-0.5">{booking.mobile}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Ticket size={11} className="text-brand-purple" /> Seats & Tier
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{booking.quantity} Seat{booking.quantity > 1 ? 's' : ''}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                          {booking.ticket_category || 'General'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-brand-border pt-5">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Hash size={11} className="text-brand-purple" /> Booking ID
                        </p>
                        <p className="text-sm font-mono font-bold text-brand-purple">
                          #{String(booking.id).padStart(6, '0')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-sm font-bold text-gradient">
                          ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</p>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR code */}
                <div className="flex flex-col items-center justify-center" ref={qrRef}>
                  <div className="bg-white rounded-2xl p-3 mb-3 shadow-lg shadow-brand-purple/20">
                    <QRCodeSVG
                      value={qrValue}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#07060F"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center font-medium">Scan for Venue Entry</p>
                  <p className="text-xs font-mono text-gray-500 mt-1 break-all text-center text-[10px]">
                    {qrValue}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-brand-purple via-brand-violet to-pink-500" />
          </motion.div>

          {downloadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl p-3 text-center text-sm font-medium mb-6"
            >
              🎉 Ticket image downloaded successfully! Check your downloads folder.
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center print:hidden"
          >
            <button
              id="download-ticket-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary justify-center py-3.5 px-6 font-semibold disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  Generating Ticket…
                </>
              ) : (
                <>
                  <Download size={18} /> Download Ticket (PNG)
                </>
              )}
            </button>

            <button
              id="print-ticket-btn"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-brand-border text-gray-300 hover:text-white hover:border-brand-purple/40 hover:bg-white/5 transition"
            >
              <Printer size={18} /> Print / Save PDF
            </button>

            <Link
              id="verify-ticket-link"
              to={`/verify-ticket/${booking.id}`}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hover:text-white transition"
            >
              <CheckCircle2 size={18} /> Verify Ticket
            </Link>

            <button
              id="back-to-events-btn"
              onClick={() => navigate('/events')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-brand-border text-gray-300 hover:text-white hover:border-brand-purple/40 hover:bg-white/5 transition"
            >
              <ArrowLeft size={18} /> Browse Events
            </button>
          </motion.div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
