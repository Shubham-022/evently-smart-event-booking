// frontend/src/components/SeatMap.jsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, X, Sparkles, Crown, Star, Ticket } from 'lucide-react';

const TIER_ICONS = {
  VIP: Crown,
  Premium: Star,
  General: Ticket,
};

const TIER_COLORS = {
  VIP: 'text-amber-400',
  Premium: 'text-brand-lavender',
  General: 'text-blue-400',
};

export default function SeatMap({
  seats = [],
  selectedSeats = [],
  lockedByOthers = [],
  onToggleSeat,
  selectedTier = 'General',
  maxSelectable = 10,
}) {
  // Group seats by row_label
  const rows = useMemo(() => {
    const map = new Map();
    for (const seat of seats) {
      const row = seat.rowLabel || seat.row_label || seat.seatNumber?.charAt(0) || 'A';
      if (!map.has(row)) {
        map.set(row, []);
      }
      map.get(row).push(seat);
    }
    // Sort seats in each row by seatIndex
    for (const [, list] of map.entries()) {
      list.sort((a, b) => (a.seatIndex || 0) - (b.seatIndex || 0));
    }
    return Array.from(map.entries());
  }, [seats]);

  const lockedSet = useMemo(() => {
    const set = new Set();
    for (const item of lockedByOthers) {
      set.add(typeof item === 'string' ? item : item.seatNumber);
    }
    return set;
  }, [lockedByOthers]);

  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const getSeatState = (seat) => {
    const num = seat.seatNumber;
    if (seat.status === 'booked') return 'booked';
    if (selectedSet.has(num)) return 'selected';
    if (lockedSet.has(num)) return 'locked';
    return 'available';
  };

  return (
    <div className="w-full select-none">
      {/* Stage Screen Area */}
      <div className="relative mb-8 text-center">
        <div className="mx-auto w-3/4 max-w-md h-3 bg-gradient-to-r from-transparent via-brand-purple to-transparent rounded-full opacity-80 shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
        <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-purple">
          <Sparkles size={12} />
          <span>Stage / Screen View</span>
          <Sparkles size={12} />
        </div>
      </div>

      {/* Seat Layout Grid */}
      <div className="overflow-x-auto pb-4 pt-2">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            <p>Loading interactive seat layout…</p>
          </div>
        ) : (
          <div className="min-w-fit mx-auto flex flex-col items-center gap-2.5 px-2">
            {rows.map(([rowLabel, rowSeats]) => {
            const isRowOfSelectedTier = rowSeats.some(s => s.ticketCategory === selectedTier);

            return (
              <div key={rowLabel} className="flex items-center gap-2 sm:gap-3">
                {/* Left Row Label */}
                <span className="w-6 text-right font-mono text-xs font-bold text-gray-500">
                  {rowLabel}
                </span>

                {/* Seats in this row */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.map((seat) => {
                    const seatNum = seat.seatNumber;
                    const state = getSeatState(seat);
                    const isSelected = state === 'selected';
                    const isLocked = state === 'locked';
                    const isBooked = state === 'booked';
                    const isAvailable = state === 'available';

                    // Tier styling
                    const category = seat.ticketCategory || 'General';
                    const matchesTier = category === selectedTier;

                    let btnClasses =
                      'relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center transition-all duration-200 border ';

                    if (isBooked) {
                      btnClasses +=
                        'bg-red-950/40 border-red-500/20 text-red-500/50 cursor-not-allowed opacity-50';
                    } else if (isLocked) {
                      btnClasses +=
                        'bg-amber-950/40 border-amber-500/40 text-amber-400 cursor-not-allowed animate-pulse';
                    } else if (isSelected) {
                      btnClasses +=
                        'bg-gradient-to-br from-brand-purple to-brand-violet border-brand-lavender text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-105 z-10';
                    } else {
                      // Available
                      if (matchesTier) {
                        btnClasses +=
                          'bg-white/10 hover:bg-brand-purple/30 border-brand-purple/40 hover:border-brand-purple text-white cursor-pointer hover:scale-105';
                      } else {
                        btnClasses +=
                          'bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30 text-gray-400 cursor-pointer hover:scale-105';
                      }
                    }

                    return (
                      <motion.button
                        key={seatNum}
                        type="button"
                        whileHover={isAvailable || isSelected ? { scale: 1.1 } : {}}
                        whileTap={isAvailable || isSelected ? { scale: 0.95 } : {}}
                        onClick={() => {
                          if (isAvailable || isSelected) {
                            onToggleSeat(seat);
                          }
                        }}
                        disabled={isBooked || isLocked}
                        title={`Seat ${seatNum} (${category}) — ${
                          isBooked
                            ? 'Booked'
                            : isLocked
                            ? 'Temporarily Held by Another User'
                            : isSelected
                            ? 'Selected'
                            : 'Available'
                        }`}
                        className={btnClasses}
                      >
                        {isBooked ? (
                          <X size={13} className="text-red-500/60" />
                        ) : isLocked ? (
                          <Lock size={12} className="text-amber-400" />
                        ) : isSelected ? (
                          <Check size={14} className="stroke-[3]" />
                        ) : (
                          <span>{seat.seatIndex}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <span className="w-6 text-left font-mono text-xs font-bold text-gray-500">
                  {rowLabel}
                </span>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-brand-border/60 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white/10 border border-brand-purple/40" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-brand-purple to-brand-violet border border-brand-lavender flex items-center justify-center text-white">
            <Check size={10} className="stroke-[3]" />
          </div>
          <span className="text-white font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock size={10} />
          </div>
          <span className="text-amber-400">Locked (5 min hold)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-500/50">
            <X size={10} />
          </div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}

