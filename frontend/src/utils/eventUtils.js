/**
 * Format a date string into "Dec 15, 2025" style
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string into "10:00 AM" style
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date into "Sat, Dec 15" for compact displays
 */
export function formatDateCompact(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns a currency-formatted price string or "FREE"
 */
export function formatPrice(price) {
  if (price === 0 || price == null) return 'FREE';
  return `₹${Number(price).toLocaleString()}`;
}

/**
 * Returns a seat-status label and colour class
 */
export function seatStatus(available) {
  if (available === 0)   return { label: 'Sold Out',    color: 'text-red-400' };
  if (available <= 10)   return { label: `${available} left`,  color: 'text-amber-400' };
  return                        { label: `${available} seats`, color: 'text-green-400' };
}

/**
 * Fallback image URL - High-definition 16:9 professional event photography
 */
export const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&h=675&q=80';

/**
 * Curated category-based fallbacks for realistic photography
 */
export const CATEGORY_FALLBACKS = {
  Technology: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&h=675&q=80',
  Conferences: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&h=675&q=80',
  Music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=675&q=80',
  'Arts & Design': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&h=675&q=80',
  Sports: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&h=675&q=80',
};

/**
 * Given an event object return a high-quality display image src
 */
export function eventImgSrc(event) {
  if (event?.img && !event.img.includes('example.com')) {
    return event.img;
  }
  if (event?.category && CATEGORY_FALLBACKS[event.category]) {
    return CATEGORY_FALLBACKS[event.category];
  }
  return FALLBACK_IMG;
}
