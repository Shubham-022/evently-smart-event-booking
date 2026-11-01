import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Glow */}
      <div className="orb w-[600px] h-[600px] bg-brand-purple/20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="orb w-[300px] h-[300px] bg-pink-700/10 left-10 bottom-0" style={{ animationDelay: '3s' }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container-max relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-3xl p-12 md:p-20 text-center border-brand-purple/30 glow-purple"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="section-label">
              <Sparkles size={12} /> Your Next Experience Awaits
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="font-display font-black text-4xl md:text-6xl text-white mb-6 leading-tight"
          >
            Ready to Experience<br />
            <span className="text-gradient">Something Extraordinary?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Join thousands of event-goers who discover, book, and live unforgettable
            moments through Evently every day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/events" className="btn-primary text-base px-10 py-4">
              Explore Events <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn-outline text-base px-10 py-4">
              Create Account
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
