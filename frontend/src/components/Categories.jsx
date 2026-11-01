import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Music, Laptop, Palette, Dumbbell, Book, Utensils,
  Camera, HeartHandshake, Film, Mic2, Globe, Gamepad2, ArrowRight
} from 'lucide-react';

const categories = [
  { icon: Laptop,         label: 'Technology',   color: 'from-violet-600 to-purple-500', count: 142 },
  { icon: Music,          label: 'Music',        color: 'from-pink-600 to-rose-500',    count: 98  },
  { icon: Palette,        label: 'Arts & Design',color: 'from-amber-500 to-orange-500', count: 74  },
  { icon: Dumbbell,       label: 'Sports',       color: 'from-green-500 to-emerald-400',count: 61  },
  { icon: Mic2,           label: 'Conferences',  color: 'from-indigo-600 to-violet-400',count: 85  },
  { icon: Book,           label: 'Education',    color: 'from-blue-600 to-cyan-400',    count: 53  },
  { icon: Utensils,       label: 'Food & Drink', color: 'from-orange-500 to-yellow-400',count: 47  },
  { icon: Camera,         label: 'Photography',  color: 'from-sky-600 to-blue-400',     count: 39  },
  { icon: HeartHandshake, label: 'Community',    color: 'from-teal-600 to-cyan-400',    count: 66  },
  { icon: Film,           label: 'Film & Media', color: 'from-red-600 to-pink-500',     count: 28  },
  { icon: Globe,          label: 'Travel',       color: 'from-purple-600 to-violet-400',count: 32  },
  { icon: Gamepad2,       label: 'Gaming',       color: 'from-fuchsia-600 to-pink-400', count: 44  },
];

export default function Categories() {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryLabel) => {
    navigate(`/events?category=${encodeURIComponent(categoryLabel)}`);
  };

  return (
    <section id="categories" className="section-padding">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">Event Categories</span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Explore by <span className="text-gradient">Category</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Browse handpicked experiences tailored to your interests. Click to view matching events.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map(({ icon: Icon, label, color, count }, i) => (
            <motion.button
              key={label}
              onClick={() => handleCategoryClick(label)}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: 'backOut' }}
              whileHover={{ y: -5, scale: 1.04, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-5 flex flex-col items-center gap-3 group cursor-pointer border border-brand-border/60 hover:border-brand-purple/50 transition-all text-left"
              id={`category-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center glow-purple-sm group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white text-center leading-tight group-hover:text-brand-lavender transition-colors">{label}</span>
              <span className="text-xs text-gray-500">{count} events</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
