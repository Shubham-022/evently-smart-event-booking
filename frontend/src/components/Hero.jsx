import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Calendar, Users } from 'lucide-react';

const floatVariants = {
  animate: { y: [0, -10, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
};

const badge = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'backOut' } },
};
const headline = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};
const subVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.6 } },
};
const ctaVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.75, duration: 0.5 } },
};

const floatingBadges = [
  { icon: Calendar, label: '500+ Events', color: 'from-purple-600 to-violet-500', top: '18%', left: '6%',  delay: 0.3 },
  { icon: Star,     label: '4.9 Rated',   color: 'from-pink-500 to-rose-400',     top: '14%', right: '7%', delay: 0.5 },
  { icon: Users,    label: '50K+ Guests', color: 'from-violet-600 to-purple-400', top: '72%', left: '4%',  delay: 0.7 },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background orbs */}
      <div className="orb w-[700px] h-[700px] bg-brand-purple/20 -top-40 left-1/2 -translate-x-1/2" />
      <div className="orb w-[400px] h-[400px] bg-violet-700/15 top-1/3 -left-32" style={{ animationDelay: '2s' }} />
      <div className="orb w-[350px] h-[350px] bg-pink-700/10 bottom-0 right-0" style={{ animationDelay: '4s' }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating side badges */}
      {floatingBadges.map(({ icon: Icon, label, color, delay, ...pos }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, duration: 0.6, ease: 'backOut' }}
          variants={floatVariants}
          style={pos}
          className="absolute hidden xl:flex items-center gap-2.5 glass px-4 py-2.5 rounded-2xl animate-float z-10"
        >
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </motion.div>
      ))}

      <div className="container-max section-padding relative z-10 w-full text-center">
        {/* Badge */}
        <motion.div
          variants={badge} initial="hidden" animate="visible"
          className="flex justify-center mb-8"
        >
          <span className="section-label">
            <Sparkles size={12} className="text-brand-lavender" /> Premium Event Experience Platform
          </span>
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-6">
          {['Discover & Book', 'Extraordinary Events'].map((line, i) => (
            <motion.h1
              key={line}
              custom={i}
              variants={headline}
              initial="hidden"
              animate="visible"
              className={`font-display font-black leading-tight tracking-tight block
                ${i === 0 ? 'text-5xl md:text-7xl lg:text-8xl text-white' : 'text-5xl md:text-7xl lg:text-8xl text-gradient'}`}
            >
              {line}
            </motion.h1>
          ))}
        </div>

        {/* Sub-headline */}
        <motion.p
          variants={subVariant} initial="hidden" animate="visible"
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          From intimate workshops to massive conferences — find, discover, and book
          unforgettable events with one seamless platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={ctaVariant} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/events" className="btn-primary text-base px-8 py-4">
            Explore Events <ArrowRight size={18} />
          </Link>
          <a
            href="#about"
            onClick={(e) => { e.preventDefault(); document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn-outline text-base px-8 py-4"
          >
            Learn More
          </a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: '500+',  label: 'Events Hosted' },
            { value: '50K+',  label: 'Happy Guests' },
            { value: '4.9★',  label: 'Avg. Rating' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display font-bold text-2xl md:text-3xl text-gradient mb-1">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-600 tracking-widest uppercase">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-brand-border flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-brand-violet rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
