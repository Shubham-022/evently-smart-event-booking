import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'How do I book an event on Evently?',
    a: 'Simply browse our events, select the one you love, choose your ticket quantity, and complete checkout in seconds. Your digital ticket is delivered instantly to your email.',
  },
  {
    q: 'What is your cancellation and refund policy?',
    a: 'You can cancel a confirmed booking up to 48 hours before the event for a full refund. Cancellations within 48 hours are subject to a 50% cancellation fee.',
  },
  {
    q: 'Can I transfer my ticket to someone else?',
    a: 'Yes! Ticket transfers are supported for most events. Navigate to "My Bookings" and use the Transfer option. Some organizer-specific restrictions may apply.',
  },
  {
    q: 'How does real-time seat availability work?',
    a: 'Evently uses Socket.IO to push live seat count updates. When another user books a seat, the available count updates on your screen instantly — no refresh needed.',
  },
  {
    q: 'Are my payment details secure?',
    a: 'Absolutely. All transactions are encrypted end-to-end. We never store raw card data — all payments are processed through PCI-compliant secure gateways.',
  },
  {
    q: 'Can I organize and list my own events?',
    a: 'Yes! Registered organizers can list events with full details including schedules, pricing, seating capacity, and imagery. Apply for an organizer account to get started.',
  },
  {
    q: 'Do you support group bookings?',
    a: 'Absolutely. You can book multiple seats in a single transaction. For large corporate or group bookings (20+ seats), contact us for dedicated group rates.',
  },
  {
    q: 'What happens if an event is cancelled by the organizer?',
    a: 'If an organizer cancels an event, all attendees receive an automatic full refund and an email notification. No action is required on your part.',
  },
];

function FAQItem({ item, index, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      <button
        id={`faq-${index}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <span className={`font-medium text-base transition-colors ${isOpen ? 'text-brand-lavender' : 'text-white'}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 ml-4"
        >
          <ChevronDown size={18} className={`transition-colors ${isOpen ? 'text-brand-violet' : 'text-gray-500'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-brand-border pt-4">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(null);
  const toggle = (i) => setOpen(open === i ? null : i);

  return (
    <section id="faq" className="section-padding">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">
            <HelpCircle size={12} /> FAQ
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you need to know about booking events on Evently.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              index={i}
              isOpen={open === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
