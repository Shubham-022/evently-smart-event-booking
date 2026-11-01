import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images } from 'lucide-react';

const gallery = [
  {
    id: 1, src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    alt: 'Tech Summit Stage', span: 'col-span-2 row-span-2',
  },
  {
    id: 2, src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    alt: 'Festival Crowd',
  },
  {
    id: 3, src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    alt: 'Music Performance',
  },
  {
    id: 4, src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
    alt: 'Business Conference',
  },
  {
    id: 5, src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
    alt: 'Art Exhibition',
  },
  {
    id: 6, src: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
    alt: 'Workshop',
  },
  {
    id: 7, src: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
    alt: 'Award Ceremony',
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="gallery" className="section-padding">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-label mb-5 inline-flex">
            <Images size={12} /> Event Gallery
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mt-4 mb-4">
            Moments & <span className="text-gradient">Memories</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            A glimpse of the extraordinary experiences we've helped create.
          </p>
        </motion.div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {gallery.map(({ id, src, alt, span }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`relative overflow-hidden rounded-2xl cursor-pointer group ${span || ''}`}
              onClick={() => setSelected({ src, alt })}
            >
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white text-sm font-semibold">{alt}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
              onClick={() => setSelected(null)}
            >
              <motion.img
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.35 }}
                src={selected.src}
                alt={selected.alt}
                className="max-w-4xl max-h-[85vh] w-full h-full object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
