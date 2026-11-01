// src/pages/EventDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, Ticket, Tag, Clock,
  ChevronLeft, Plus, Minus, ExternalLink, AlertCircle,
  Crown, Star, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { useAuth } from '../contexts/AuthContext';
import { getEventById, getRelatedEvents } from '../services/eventsService';
import { socket } from '../services/socket';

const TICKET_CATEGORIES = [
  {
    id: 'General',
    name: 'General Admission',
    multiplier: 1.0,
    badge: 'Standard',
    icon: Ticket,
    color: 'from-blue-600/30 to-purple-600/30 border-blue-500/40 text-blue-400',
    description: 'Standard event entry, unreserved general seating, digital ticket QR code.',
  },
  {
    id: 'Premium',
    name: 'Premium Pass',
    multiplier: 1.5,
    badge: 'Popular',
    icon: Star,
    color: 'from-brand-purple/30 to-pink-600/30 border-brand-purple/60 text-brand-lavender',
    description: 'Priority fast-track entry, reserved front rows, complimentary event badge & welcome drink.',
  },
  {
    id: 'VIP',
    name: 'VIP Experience',
    multiplier: 2.5,
    badge: 'Exclusive',
    icon: Crown,
    color: 'from-amber-500/30 to-orange-500/30 border-amber-500/50 text-amber-400',
    description: 'All-access VIP lounge pass, backstage access, complimentary refreshments & exclusive merch kit.',
  },
];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 lg:px-16 container-max max-w-5xl mx-auto w-full">
        <Skeleton className="w-full h-72 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/2 mb-8" />
        <Skeleton className="h-40" />
      </main>
      <Footer />
    </div>
  );
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTier, setSelectedTier] = useState('General');
  const [quantity, setQuantity] = useState(1);
  const [availableSeats, setAvailableSeats] = useState(null);
  const [holdNotice, setHoldNotice] = useState(null);

  // Fetch event details & related events
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await getEventById(id);
        if (!cancelled) {
          setEvent(data);
          setAvailableSeats(Number(data.available_seats));
          setLoading(false);

          // Fetch related events
          try {
            const relRes = await getRelatedEvents(id, data.category);
            if (!cancelled && Array.isArray(relRes.data)) {
              setRelatedEvents(relRes.data.filter(e => e.id !== Number(id)).slice(0, 3));
            }
          } catch {
            // non-blocking
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.status === 404 ? 'Event not found.' : 'Failed to load event.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Socket.IO: Real-time seat updates
  useEffect(() => {
    if (!id) return;
    if (!socket.connected) socket.connect();

    const eventIdNum = Number(id);
    socket.emit('joinEvent', eventIdNum);

    const handleSeatUpdate = (payload) => {
      if (Number(payload.eventId) === eventIdNum) {
        const updatedSeats = Number(payload.availableSeats);
        setAvailableSeats(updatedSeats);
        setQuantity(q => Math.min(q, Math.max(1, updatedSeats)));
      }
    };

    socket.on('seatUpdate', handleSeatUpdate);

    return () => {
      socket.emit('leaveEvent', eventIdNum);
      socket.off('seatUpdate', handleSeatUpdate);
    };
  }, [id]);

  const handleBook = () => {
    const seats = availableSeats ?? (event?.available_seats ?? 0);
    if (seats < quantity) return;

    if (!isUserAuthenticated) {
      navigate(`/login?redirect=/booking/${id}`, {
        state: { quantity, ticket_category: selectedTier },
      });
      return;
    }

    navigate(`/booking/${id}`, {
      state: { quantity, ticket_category: selectedTier },
    });
  };

  if (loading) return <DetailSkeleton />;

  if (error) return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-xl text-red-400">{error}</p>
        <button onClick={() => navigate('/events')} className="btn-primary">Browse Events</button>
      </main>
      <Footer />
    </div>
  );

  const seats = availableSeats ?? Number(event.available_seats);
  const isSoldOut = seats <= 0;
  const eventDate = new Date(event.date);
  const basePrice = Number(event.price);

  // Dynamic price calculation
  const currentCategory = TICKET_CATEGORIES.find(c => c.id === selectedTier) || TICKET_CATEGORIES[0];
  const unitPrice = Math.round(basePrice * currentCategory.multiplier);
  const totalAmount = unitPrice * quantity;

  const coverImage = event.img || `https://picsum.photos/seed/${event.id}/1200/500`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />
      <motion.main
        className="flex-1 pt-24 pb-16 px-4 md:px-8 lg:px-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="container-max max-w-5xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group text-sm"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All Events
          </button>

          {/* Cover image banner */}
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 border border-brand-border shadow-xl">
            <img
              src={coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {event.category && (
              <div className="absolute top-4 left-4 glass px-3.5 py-1 rounded-full text-xs font-semibold text-brand-lavender bg-brand-dark/80 border border-brand-purple/40">
                {event.category}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-transparent opacity-80" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details, Ticket Categories, Map */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Title & Meta */}
              <div>
                <h1 className="font-display font-black text-3xl md:text-5xl leading-tight mb-4">{event.title}</h1>
                <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-brand-purple" />
                    {eventDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-brand-purple" />
                    {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-brand-purple" />
                    {event.location}
                  </span>
                </div>
              </div>

              {/* Event Description */}
              {event.description && (
                <div>
                  <h2 className="font-display font-bold text-xl mb-3">About this Event</h2>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Capacity', value: event.total_seats, icon: <Users size={16} /> },
                  { label: 'Seats Remaining', value: seats, icon: <Ticket size={16} /> },
                  { label: 'Base Ticket Price', value: `₹${basePrice.toLocaleString('en-IN')}`, icon: <Tag size={16} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="glass rounded-xl p-4 text-center border border-brand-border">
                    <div className="text-brand-purple mb-1 flex justify-center">{icon}</div>
                    <p className="font-bold text-lg">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* ─── Ticket Category Selector with Dynamic Pricing ─── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-xl flex items-center gap-2">
                    <Sparkles size={18} className="text-brand-purple" /> Select Ticket Tier
                  </h2>
                  <span className="text-xs text-gray-400">Choose your seating tier</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {TICKET_CATEGORIES.map((tier) => {
                    const tierPrice = Math.round(basePrice * tier.multiplier);
                    const isSelected = selectedTier === tier.id;
                    const TierIcon = tier.icon;

                    return (
                      <motion.div
                        key={tier.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`rounded-2xl p-4 cursor-pointer transition-all border relative flex flex-col justify-between
                          ${isSelected
                            ? 'bg-gradient-to-b from-brand-purple/20 to-brand-dark border-brand-purple ring-2 ring-brand-purple/40 shadow-lg shadow-brand-purple/20'
                            : 'glass border-brand-border/60 hover:border-brand-purple/30'}`}
                      >
                        {/* Top badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tier.color}`}>
                            {tier.badge}
                          </span>
                          <TierIcon size={16} className={isSelected ? 'text-brand-purple' : 'text-gray-400'} />
                        </div>

                        <div>
                          <h3 className="font-display font-bold text-base text-white mb-1">{tier.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">{tier.description}</p>
                        </div>

                        <div className="pt-2 border-t border-brand-border/50 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Tier Price</span>
                          <span className="font-bold text-base text-white">₹{tierPrice.toLocaleString('en-IN')}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps Venue Card */}
              <div>
                <h2 className="font-display font-bold text-xl mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-brand-purple" /> Venue Location
                </h2>
                <div className="glass rounded-2xl overflow-hidden border border-brand-border shadow-lg">
                  <div className="relative w-full h-64 bg-brand-dark">
                    <iframe
                      title={`Google Map Location for ${event.location}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(90%)' }}
                      loading="lazy"
                      allowFullScreen
                      src={
                        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                          ? `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(event.location)}`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
                      }
                    />
                  </div>

                  <div className="p-4 bg-brand-dark/90 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Venue Address</p>
                      <p className="text-white font-medium text-sm mt-0.5">{event.location}</p>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-purple/15 text-brand-lavender border border-brand-purple/30 hover:bg-brand-purple/25 transition self-start sm:self-auto"
                    >
                      Open in Google Maps <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Booking Widget */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 sticky top-24 border border-brand-border shadow-xl">
                {/* Header Price */}
                <div className="mb-4">
                  <span className="text-xs text-brand-purple uppercase font-bold tracking-wider">{currentCategory.name}</span>
                  <p className="text-3xl font-display font-black text-white mt-0.5">
                    ₹{unitPrice.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-gray-500 ml-1">/ ticket</span>
                  </p>
                </div>

                {/* Live Seats availability */}
                <div className="flex items-center gap-2 text-sm mb-5 pb-4 border-b border-brand-border">
                  {isSoldOut ? (
                    <span className="text-red-400 font-semibold px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                      Sold Out
                    </span>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-medium">{seats} seats available</span>
                    </>
                  )}
                </div>

                {/* Quantity selector */}
                {!isSoldOut && (
                  <div className="mb-5">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Ticket Quantity</span>
                      <span className="text-xs text-gray-500">Max {Math.min(seats, 10)} per order</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        id="qty-minus-btn"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-xl border border-brand-border flex items-center justify-center hover:border-brand-purple/50 transition disabled:opacity-30 bg-white/5 text-white"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="font-bold text-xl w-10 text-center font-mono">{quantity}</span>
                      <button
                        id="qty-plus-btn"
                        onClick={() => setQuantity(q => Math.min(Math.min(seats, 10), q + 1))}
                        disabled={quantity >= Math.min(seats, 10)}
                        className="w-10 h-10 rounded-xl border border-brand-border flex items-center justify-center hover:border-brand-purple/50 transition disabled:opacity-30 bg-white/5 text-white"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                {!isSoldOut && (
                  <div className="space-y-2 text-xs text-gray-400 mb-5 pt-3 border-t border-brand-border">
                    <div className="flex justify-between">
                      <span>Tier</span>
                      <span className="text-white font-medium">{currentCategory.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price ({quantity} × ₹{unitPrice.toLocaleString('en-IN')})</span>
                      <span className="text-white font-medium">₹{(unitPrice * quantity).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-brand-border/60">
                      <span>Total Amount</span>
                      <span className="text-gradient font-display text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  id="book-now-btn"
                  onClick={handleBook}
                  disabled={isSoldOut}
                  className="w-full py-4 btn-primary justify-center font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSoldOut ? 'Sold Out' : !isUserAuthenticated ? 'Sign In to Reserve' : `Book ${selectedTier} — ₹${totalAmount.toLocaleString('en-IN')}`}
                </button>

                <p className="text-[11px] text-gray-500 text-center mt-3">
                  🛡️ Instant QR ticket issuance &middot; Real-time seat lock
                </p>
              </div>
            </div>
          </div>

          {/* ─── Related Events Section ─── */}
          {relatedEvents.length > 0 && (
            <div className="mt-16 pt-12 border-t border-brand-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="section-label mb-2 inline-flex">Explore More</span>
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white">
                    You Might <span className="text-gradient">Also Like</span>
                  </h2>
                </div>
                <Link to="/events" className="text-sm text-brand-lavender hover:text-white transition flex items-center gap-1">
                  View All Events <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedEvents.map((rel, i) => (
                  <EventCard key={rel.id} event={rel} index={i} variant="grid" />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}
