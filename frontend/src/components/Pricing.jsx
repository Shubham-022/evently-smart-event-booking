import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Crown } from 'lucide-react';

const plans = [
  {
    id: 'general',
    icon: Zap,
    label: 'General',
    price: 49,
    color: 'from-violet-600 to-purple-500',
    popular: false,
    features: [
      'Access to all General sessions',
      'Networking lounge access',
      'Digital event programme',
      'Event recordings (30 days)',
      'Community forum access',
    ],
  },
  {
    id: 'professional',
    icon: Star,
    label: 'Professional',
    price: 149,
    color: 'from-purple-600 to-pink-500',
    popular: true,
    features: [
      'Everything in General',
      'Priority seating in keynotes',
      'Workshop session access',
      'Speakers Q&A access',
      'Networking dinner invitation',
      '1-year recording access',
    ],
  },
  {
    id: 'vip',
    icon: Crown,
    label: 'VIP',
    price: 349,
    color: 'from-amber-500 to-orange-500',
    popular: false,
    features: [
      'Everything in Professional',
      'VIP lounge & concierge service',
      'Private 1:1 speaker sessions',
      'Exclusive VIP dinner',
      'Signed event merchandise',
      'Lifetime recording access',
      'Next event 20% discount',
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="section-padding relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-purple-700/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="container-max relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">Ticket Pricing</span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Choose Your <span className="text-gradient">Experience</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Flexible ticket tiers for every attendee. No hidden fees, ever.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 glass px-4 py-2 rounded-full">
            <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-gray-500'}`}>Per Event</span>
            <button
              id="pricing-toggle"
              onClick={() => setAnnual(!annual)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${annual ? 'bg-brand-purple' : 'bg-brand-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-gray-500'}`}>
              Annual Pass <span className="text-brand-violet text-xs ml-1">–20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(({ id, icon: Icon, label, price, color, popular, features }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`relative glass rounded-2xl p-8 flex flex-col
                ${popular ? 'border-brand-purple/60 glow-purple' : ''}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-purple to-brand-violet px-5 py-1 rounded-full text-xs font-bold text-white tracking-wide">
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 glow-purple-sm`}>
                <Icon size={22} className="text-white" />
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-1">{label}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="font-display font-black text-4xl text-white">
                  ${annual ? Math.round(price * 0.8) : price}
                </span>
                <span className="text-gray-400 text-sm mb-1">/ ticket</span>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check size={15} className="text-brand-violet mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                id={`pricing-cta-${id}`}
                className={popular ? 'btn-primary justify-center' : 'btn-outline justify-center'}
              >
                Get {label} Ticket
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
