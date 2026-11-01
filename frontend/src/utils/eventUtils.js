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
 * Fallback image URL
 */
export const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';

/**
 * Given an event object return a display image src
 */
export function eventImgSrc(event) {
  return event?.img || FALLBACK_IMG;
}
