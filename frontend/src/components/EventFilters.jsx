// src/components/EventFilters.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Calendar, ArrowUpDown, X, SlidersHorizontal, Tag
} from 'lucide-react';

const inputClass =
  'w-full bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 ' +
  'focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet/30 transition-colors';

const sortOptions = [
  { value: 'date_asc',   label: 'Date: Soonest First' },
  { value: 'date_desc',  label: 'Date: Latest First'  },
  { value: 'price_asc',  label: 'Price: Low → High'   },
  { value: 'price_desc', label: 'Price: High → Low'   },
];

export default function EventFilters({
  filters,
  locations,
  categoriesList = [],
  hasActiveFilters,
  setSearch,
  setCategory,
  setLocation,
  setDateFrom,
  setDateTo,
  setSortBy,
  clearFilters,
  totalResults,
}) {
  const { search, category, location, dateFrom, dateTo, sortBy } = filters;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-5 md:p-6 mb-8 border border-brand-border shadow-xl"
    >
      {/* Top row: search + result count + clear */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <SlidersHorizontal size={15} className="text-brand-violet" />
          <span>
            Showing <span className="text-white font-semibold">{totalResults}</span> event{totalResults !== 1 ? 's' : ''}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-brand-lavender hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-brand-purple/10 border border-brand-purple/20"
            id="clear-filters-btn"
          >
            <X size={13} /> Clear all filters
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      {categoriesList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 mr-1">
            <Tag size={12} className="text-brand-purple" /> Category:
          </span>
          {categoriesList.map((cat) => {
            const isSelected = (category || 'All').toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200
                  ${isSelected
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/30 border border-brand-purple'
                    : 'bg-white/5 border border-brand-border text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter controls grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Search */}
        <div className="relative min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            id="events-search"
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Location Dropdown */}
        <div className="relative min-w-0">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            id="events-location-filter"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`${inputClass} pl-9 appearance-none cursor-pointer`}
          >
            <option value="">All Locations</option>
            {locations.filter(Boolean).map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative min-w-0 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="events-date-from" className="flex items-center gap-1 text-xs text-gray-400 font-medium pl-1">
              <Calendar size={11} className="text-brand-purple" />
              From Date
            </label>
            <input
              id="events-date-from"
              type="date"
              title="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${inputClass} px-2.5 text-xs`}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="events-date-to" className="flex items-center gap-1 text-xs text-gray-400 font-medium pl-1">
              <Calendar size={11} className="text-brand-purple" />
              To Date
            </label>
            <input
              id="events-date-to"
              type="date"
              title="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${inputClass} px-2.5 text-xs`}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-0">
          <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            id="events-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`${inputClass} pl-9 appearance-none cursor-pointer`}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}
