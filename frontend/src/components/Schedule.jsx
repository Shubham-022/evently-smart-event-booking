import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Calendar, ChevronRight } from 'lucide-react';

const days = ['Day 1 – Mar 15', 'Day 2 – Mar 16', 'Day 3 – Mar 17'];

const scheduleData = {
  'Day 1 – Mar 15': [
    { time: '09:00 AM', title: 'Registration & Welcome Coffee',   location: 'Main Lobby',           type: 'Networking',   duration: '1h' },
    { time: '10:00 AM', title: 'Opening Keynote: Future of Tech', location: 'Grand Hall A',          type: 'Keynote',      duration: '1.5h' },
    { time: '12:00 PM', title: 'Networking Lunch',                location: 'Terrace Restaurant',   type: 'Networking',   duration: '1h' },
    { time: '02:00 PM', title: 'AI in Product Design Workshop',   location: 'Workshop Room B',       type: 'Workshop',     duration: '2h' },
    { time: '05:00 PM', title: 'Evening Mixer & Panel Discussion',location: 'Sky Lounge',            type: 'Panel',        duration: '2h' },
  ],
  'Day 2 – Mar 16': [
    { time: '09:30 AM', title: 'Startup Pitch Competition',        location: 'Innovation Stage',     type: 'Competition',  duration: '2h' },
    { time: '11:30 AM', title: 'Cloud Architecture Deep Dive',     location: 'Workshop Room A',      type: 'Workshop',     duration: '1.5h' },
    { time: '01:00 PM', title: 'Lunch Break & Demos',              location: 'Exhibition Floor',     type: 'Networking',   duration: '1.5h' },
    { time: '03:00 PM', title: 'Cybersecurity Fireside Chat',      location: 'Grand Hall B',         type: 'Panel',        duration: '1h' },
    { time: '05:00 PM', title: 'Award Ceremony',                   location: 'Grand Hall A',         type: 'Ceremony',     duration: '1h' },
  ],
  'Day 3 – Mar 17': [
    { time: '10:00 AM', title: 'Open Innovation Labs',             location: 'Labs Wing',            type: 'Workshop',     duration: '2h' },
    { time: '12:00 PM', title: 'Closing Keynote: What\'s Next?',  location: 'Grand Hall A',         type: 'Keynote',      duration: '1h' },
    { time: '01:30 PM', title: 'Farewell Brunch & Networking',    location: 'Terrace Restaurant',   type: 'Networking',   duration: '1.5h' },
  ],
};

const typeColors = {
  Keynote:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Workshop:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Networking: 'bg-green-500/20 text-green-300 border-green-500/30',
  Panel:      'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Competition:'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Ceremony:   'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function Schedule() {
  const [activeDay, setActiveDay] = useState(days[0]);

  return (
    <section id="schedule" className="section-padding">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">
            <Calendar size={12} /> Event Schedule
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Full Event <span className="text-gradient">Schedule</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Plan your experience with our detailed day-by-day schedule.
          </p>
        </motion.div>

        {/* Day tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${activeDay === day
                  ? 'bg-brand-purple text-white glow-purple-sm'
                  : 'glass text-gray-400 hover:text-white hover:border-brand-purple/40'}`}
              id={`schedule-tab-${day.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gradient-to-b from-brand-purple/60 via-brand-border to-transparent hidden md:block" />

          {scheduleData[activeDay].map((item, i) => (
            <motion.div
              key={`${activeDay}-${i}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex gap-6 mb-6 group"
            >
              {/* Time */}
              <div className="w-20 shrink-0 text-right text-xs font-semibold text-brand-lavender pt-4 leading-tight">
                {item.time}
              </div>

              {/* Dot */}
              <div className="hidden md:flex flex-col items-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-brand-purple mt-4 glow-purple-sm ring-2 ring-brand-dark" />
              </div>

              {/* Card */}
              <div className="flex-1 glass rounded-xl p-5 group-hover:border-brand-purple/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${typeColors[item.type] || 'bg-gray-500/20 text-gray-300'}`}>
                    {item.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-violet" /> {item.location}</span>
                  <span className="flex items-center gap-1.5"><Clock size={11} className="text-brand-violet" /> {item.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
