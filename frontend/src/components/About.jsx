import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Globe, Zap, Shield } from 'lucide-react';

const pillars = [
  {
    icon: Globe, title: 'Global Reach',
    desc: 'Connecting attendees and organizers across 60+ countries on one seamless platform.',
    color: 'from-violet-600 to-purple-500',
  },
  {
    icon: Zap, title: 'Instant Booking',
    desc: 'Real-time seat availability with lightning-fast checkout — no waiting, no friction.',
    color: 'from-purple-600 to-pink-500',
  },
  {
    icon: Shield, title: 'Secure & Trusted',
    desc: 'End-to-end encrypted transactions and verified organizers for complete peace of mind.',
    color: 'from-pink-600 to-rose-500',
  },
];

const checks = [
  'Curated events across 20+ categories',
  'Live seat availability updates',
  'Instant digital ticket delivery',
  'Zero hidden fees — always transparent pricing',
  'Dedicated 24/7 attendee support',
];

export default function About() {
  return (
    <section id="about" className="section-padding">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="section-label mb-5 inline-flex">About Evently</span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-6 leading-tight">
              The Smart Way to{' '}
              <span className="text-gradient">Experience Events</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Evently is more than a ticketing platform — it's your all-in-one companion
              for discovering, booking, and experiencing the world's best events.
              We combine cutting-edge technology with a passion for live experiences.
            </p>

            <ul className="space-y-3 mb-10">
              {checks.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle size={18} className="text-brand-violet mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <motion.a
              href="#events"
              onClick={(e) => { e.preventDefault(); document.querySelector('#events')?.scrollIntoView({ behavior: 'smooth' }); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary inline-flex"
            >
              Browse Events
            </motion.a>
          </motion.div>

          {/* Right pillars */}
          <div className="flex flex-col gap-5">
            {pillars.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 flex gap-5 items-start group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 glow-purple-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-1">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
