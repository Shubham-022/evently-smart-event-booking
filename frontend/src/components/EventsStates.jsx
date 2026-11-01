import React from 'react';

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 bg-brand-border/40" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-5 bg-brand-border/40 rounded-lg w-3/4" />
        <div className="h-4 bg-brand-border/30 rounded-lg w-full" />
        <div className="h-4 bg-brand-border/30 rounded-lg w-5/6" />
        <div className="mt-3 pt-3 border-t border-brand-border flex flex-col gap-2">
          <div className="h-3 bg-brand-border/30 rounded w-1/2" />
          <div className="h-3 bg-brand-border/30 rounded w-2/5" />
        </div>
        <div className="h-10 bg-brand-border/40 rounded-xl mt-2" />
      </div>
    </div>
  );
}

export function EventsLoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function EventsEmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mb-6">
        <span className="text-4xl">🔍</span>
      </div>
      <h3 className="font-display font-bold text-2xl text-white mb-3">
        {hasFilters ? 'No events match your filters' : 'No events available'}
      </h3>
      <p className="text-gray-400 max-w-sm mb-8">
        {hasFilters
          ? 'Try adjusting your search, location or date range to find more events.'
          : 'New events are added regularly. Check back soon!'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="btn-primary">
          Clear Filters
        </button>
      )}
    </div>
  );
}

export function EventsErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h3 className="font-display font-bold text-2xl text-white mb-3">Unable to load events</h3>
      <p className="text-gray-400 max-w-sm mb-8">
        We couldn't connect to the server. Please check your connection or try again.
      </p>
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}
