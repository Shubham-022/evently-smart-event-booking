// src/components/EventCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Ticket, ArrowRight, Tag } from 'lucide-react';
import { formatDate, formatTime, formatPrice, seatStatus, eventImgSrc, FALLBACK_IMG } from '../utils/eventUtils';

const cardVariants = {
  hidden:  { opacity: 0, y: 35, scale: 0.98 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function EventCard({ event, index = 0, variant = 'grid' }) {
  const imgSrc = eventImgSrc(event);
  const { label: seatLabel, color: seatColor } = seatStatus(event.available_seats ?? 0);
  const isSoldOut = event.available_seats === 0;

  if (variant === 'list') {
    return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ x: 4, transition: { duration: 0.2 } }}
        className="card-event flex flex-col sm:flex-row group border border-brand-border/60 hover:border-brand-purple/40 transition-all rounded-2xl overflow-hidden glass"
      >
        {/* Image - 16:9 Aspect Ratio with subtle readable overlay */}
        <div className="relative sm:w-64 md:w-72 shrink-0 aspect-[16/9] sm:aspect-auto sm:h-auto overflow-hidden bg-brand-dark/50">
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
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-brand-dark/10 sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-brand-dark/70 pointer-events-none" />

          {/* Category Pill */}
          {event.category && (
            <div className="absolute top-3 left-3 glass px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-brand-lavender bg-brand-dark/70 border border-brand-purple/30">
              {event.category}
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-brand-dark/75 flex items-center justify-center">
              <span className="text-red-400 font-bold text-xs tracking-widest uppercase border border-red-500/40 px-3 py-1 rounded-full bg-red-500/10">Sold Out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 gap-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-lavender transition-colors leading-tight flex-1">
              {event.title}
            </h3>
            <span className={`glass px-3 py-1 rounded-full text-sm font-bold ${event.price === 0 ? 'text-green-400' : 'text-brand-lavender'}`}>
              {formatPrice(event.price)}
            </span>
          </div>

          {event.description && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-auto pt-3 border-t border-brand-border">
            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-brand-violet" />{formatDate(event.date)}</span>
            <span className="flex items-center gap-1.5"><Clock    size={12} className="text-brand-violet" />{formatTime(event.date)}</span>
            <span className="flex items-center gap-1.5"><MapPin   size={12} className="text-brand-violet" />{event.location}</span>
            <span className={`flex items-center gap-1.5 ${seatColor}`}><Users size={12} />{seatLabel}</span>
          </div>

          <div className="flex gap-3 mt-2">
            <Link
              to={`/events/${event.id}`}
              id={`book-event-${event.id}`}
              className={`btn-primary text-sm py-2.5 px-5 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Ticket size={14} /> {isSoldOut ? 'Sold Out' : 'Book Now'}
            </Link>
            <Link
              to={`/events/${event.id}`}
              className="btn-outline text-sm py-2.5 px-5"
            >
              Details <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default grid variant
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      className="card-event group flex flex-col border border-brand-border/60 hover:border-brand-purple/40 transition-all rounded-2xl overflow-hidden glass"
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

        {/* Category Pill */}
        {event.category && (
          <div className="absolute top-3 left-3 glass px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-brand-lavender bg-brand-dark/70 border border-brand-purple/30">
            {event.category}
          </div>
        )}

        {/* Price badge */}
        <div className={`absolute top-3 right-3 glass px-3 py-1 rounded-full text-xs font-bold ${event.price === 0 ? 'text-green-400' : 'text-brand-lavender'}`}>
          {formatPrice(event.price)}
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-dark/75 flex items-center justify-center">
            <span className="text-red-400 font-bold text-xs tracking-widest uppercase border border-red-500/40 px-3 py-1 rounded-full bg-red-500/10">Sold Out</span>
          </div>
        )}

        {/* Seats */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 glass px-2.5 py-1 rounded-full text-xs font-medium ${seatColor}`}>
          <Users size={11} /> {seatLabel}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-display font-bold text-lg text-white leading-tight group-hover:text-brand-lavender transition-colors line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{event.description}</p>
        )}

        <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-brand-border">
          <span className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={11} className="text-brand-violet" />
            {formatDate(event.date)} · {formatTime(event.date)}
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={11} className="text-brand-violet" />
            {event.location}
          </span>
        </div>

        <Link
          to={`/events/${event.id}`}
          id={`book-event-${event.id}`}
          className={`mt-1 btn-primary justify-center text-sm py-2.5 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Ticket size={14} /> {isSoldOut ? 'Sold Out' : 'View & Book'}
        </Link>
      </div>
    </motion.div>
  );
}
