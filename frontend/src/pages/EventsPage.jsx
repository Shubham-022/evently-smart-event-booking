// src/pages/EventsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import {
  EventsLoadingSkeleton,
  EventsEmptyState,
  EventsErrorState,
} from '../components/EventsStates';
import { useEvents } from '../hooks/useEvents';

const PAGE_SIZE = 6;

export default function EventsPage() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage] = useState(1);

  const {
    events,
    loading,
    error,
    locations,
    categoriesList,
    hasActiveFilters,
    filters,
    setSearch,
    setCategory,
    setLocation,
    setDateFrom,
    setDateTo,
    setSortBy,
    clearFilters,
  } = useEvents();

  // Reset to first page when any filter criteria changes
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.category, filters.location, filters.dateFrom, filters.dateTo, filters.sortBy]);

  const totalPages = Math.ceil(events.length / PAGE_SIZE) || 1;
  const paginatedEvents = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />

      {/* ─── Page Header ─── */}
      <section className="relative pt-32 pb-12 px-4 md:px-8 lg:px-16 xl:px-24 overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-[500px] h-[500px] bg-brand-purple/15 -top-20 left-1/2 -translate-x-1/2 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="container-max relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <span className="section-label">
              <Sparkles size={12} /> Explore All Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-display font-black text-4xl md:text-6xl text-white mb-3 leading-tight"
          >
            Discover <span className="text-gradient">Upcoming Events</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-gray-400 text-base md:text-lg max-w-xl mx-auto"
          >
            Browse by category, search live venues, choose your ticket tier, and secure your seats in real-time.
          </motion.p>
        </div>
      </section>

      {/* ─── Main content ─── */}
      <main className="flex-1 px-4 md:px-8 lg:px-16 xl:px-24 pb-20">
        <div className="container-max">
          {/* Filters bar with category selector */}
          <EventFilters
            filters={filters}
            locations={locations}
            categoriesList={categoriesList}
            hasActiveFilters={hasActiveFilters}
            setSearch={setSearch}
            setCategory={setCategory}
            setLocation={setLocation}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            setSortBy={setSortBy}
            clearFilters={clearFilters}
            totalResults={events.length}
          />

          {/* View toggle & pagination indicator */}
          {!loading && !error && events.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <p className="text-xs text-gray-400">
                Page <span className="text-white font-semibold">{page}</span> of {totalPages}
                {' '}&mdash; showing {paginatedEvents.length} of {events.length} events
              </p>

              <div className="flex gap-2">
                <button
                  id="view-grid-btn"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border transition-all duration-200
                    ${viewMode === 'grid'
                      ? 'bg-brand-purple border-brand-purple text-white shadow-md shadow-brand-purple/20'
                      : 'border-brand-border text-gray-500 hover:text-white hover:border-brand-purple/40'}`}
                  title="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  id="view-list-btn"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border transition-all duration-200
                    ${viewMode === 'list'
                      ? 'bg-brand-purple border-brand-purple text-white shadow-md shadow-brand-purple/20'
                      : 'border-brand-border text-gray-500 hover:text-white hover:border-brand-purple/40'}`}
                  title="List view"
                >
                  <List size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── States ─── */}
          {loading && <EventsLoadingSkeleton count={6} />}

          {!loading && error && (
            <EventsErrorState onRetry={() => window.location.reload()} />
          )}

          {!loading && !error && events.length === 0 && (
            <EventsEmptyState
              hasFilters={hasActiveFilters}
              onClear={clearFilters}
            />
          )}

          {/* ─── Event cards ─── */}
          {!loading && !error && paginatedEvents.length > 0 && (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key={`grid-page-${page}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {paginatedEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} variant="grid" />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`list-page-${page}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  {paginatedEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} variant="list" />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ─── Pagination Controls ─── */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2.5 rounded-xl border border-brand-border bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                    ${page === p
                      ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/30 border border-brand-purple'
                      : 'border border-brand-border bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2.5 rounded-xl border border-brand-border bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
