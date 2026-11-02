import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Ticket, Clock } from 'lucide-react';
import { getEvents } from '../services/eventsService';
import { eventImgSrc, FALLBACK_IMG } from '../utils/eventUtils';

const FALLBACK_EVENTS = [
  {
    id: 1, title: 'Global Tech Summit 2025', location: 'New York, USA',
    date: '2025-03-15T10:00:00', price: 299, available_seats: 120,
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    description: 'The largest tech conference bringing innovators from around the world.',
  },
  {
    id: 2, title: 'Creative Arts Festival', location: 'London, UK',
    date: '2025-04-20T09:00:00', price: 89, available_seats: 45,
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    description: 'Celebrate creativity with world-class artists and performers.',
  },
  {
    id: 3, title: 'Music & Culture Expo', location: 'Mumbai, India',
    date: '2025-05-10T18:00:00', price: 49, available_seats: 350,
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    description: 'Experience the best of music, food, and culture under one roof.',
  },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function EventCard({ event, index }) {
  const imgSrc = eventImgSrc(event);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="card-event group flex flex-col"
    >
      {/* Image - 16:9 Aspect Ratio with subtle readable overlay */}
      <div className="relative overflow-hidden w-full aspect-[16/9] bg-brand-dark/50">
        <img
          src={imgSrc}
          alt={event.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => {
            if (e.target.src !== FALLBACK_IMG) {
              e.target.src = FALLBACK_IMG;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-brand-dark/15 pointer-events-none" />
        {/* Price badge */}
        <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold text-brand-lavender">
          {event.price === 0 ? 'FREE' : `₹${event.price}`}
        </div>
        {/* Seats */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 glass px-2.5 py-1 rounded-full text-xs text-gray-300">
          <Users size={11} /> {event.available_seats} seats left
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-display font-bold text-lg text-white leading-tight group-hover:text-brand-lavender transition-colors">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{event.description}</p>
        )}
        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-brand-border">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} className="text-brand-violet" />
            {formatDate(event.date)}
            <Clock size={12} className="text-brand-violet ml-1" />
            {formatTime(event.date)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={12} className="text-brand-violet" />
            {event.location}
          </div>
        </div>
        <Link
          to={`/events/${event.id}`}
          className="mt-2 btn-primary justify-center text-sm py-2.5"
          id={`book-event-${event.id}`}
        >
          <Ticket size={14} /> Book Now
        </Link>
      </div>
    </motion.div>
  );
}

export default function FeaturedEvents() {
  const [events, setEvents] = useState(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.slice(0, 6));
        }
      })
      .catch(() => {/* use fallback */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="events" className="section-padding">
      <div className="container-max">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">
            <Calendar size={12} /> Featured Events
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Upcoming <span className="text-gradient">Highlights</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Handpicked events happening near you and around the world.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center mt-12"
        >
          <Link to="/events" className="btn-outline gap-2">
            View All Events <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
