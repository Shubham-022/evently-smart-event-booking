import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Users, Calendar, Star, Globe } from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString()}${suffix}`);

  React.useEffect(() => {
    if (inView) raw.set(target);
  }, [inView, target, raw]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

const stats = [
  { icon: Calendar, value: 500,    suffix: '+',  label: 'Events Hosted',    color: 'from-violet-600 to-purple-500' },
  { icon: Users,    value: 50000,  suffix: '+',  label: 'Happy Attendees',  color: 'from-purple-600 to-pink-500'   },
  { icon: Globe,    value: 60,     suffix: '+',  label: 'Cities Covered',   color: 'from-pink-600 to-rose-500'    },
  { icon: Star,     value: 4.9,    suffix: '★',  label: 'Average Rating',   color: 'from-amber-500 to-orange-400' },
];

export default function Statistics() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-glow opacity-30 pointer-events-none" />
      <div className="orb w-[500px] h-[500px] bg-brand-purple/15 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="container-max relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">By the Numbers</span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4">
            Platform <span className="text-gradient">Statistics</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, suffix, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-8 text-center group"
            >
              <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center glow-purple-sm group-hover:scale-110 transition-transform`}>
                <Icon size={26} className="text-white" />
              </div>
              <div className="font-display font-black text-4xl md:text-5xl text-white mb-2">
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-widest font-medium">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
