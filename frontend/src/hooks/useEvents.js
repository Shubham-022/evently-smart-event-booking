// src/hooks/useEvents.js
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getEvents } from '../services/eventsService';

/**
 * Fetches all events once and exposes search / filter / sort / category controls.
 * Supports URL search params (e.g., /events?category=Music).
 */
export function useEvents() {
  const routerLocation = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(routerLocation.search), [routerLocation.search]);
  const initialCategory = searchParams.get('category') || 'All';

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filter state
  const [search,   setSearch]     = useState('');
  const [category, setCategory]   = useState(initialCategory);
  const [location, setLocation]   = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo,   setDateTo]     = useState('');
  const [sortBy,   setSortBy]     = useState('date_asc');

  // Keep category in sync if URL query parameter changes
  useEffect(() => {
    const qCat = searchParams.get('category');
    if (qCat) setCategory(qCat);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getEvents()
      .then((res) => setAllEvents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load events. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Derived unique locations for dropdown
  const locations = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.location).filter(Boolean));
    return ['', ...Array.from(set).sort()];
  }, [allEvents]);

  // Derived categories
  const categoriesList = useMemo(() => {
    const standard = ['All', 'Technology', 'Conferences', 'Music', 'Arts & Design', 'Sports'];
    const fromEvents = allEvents.map(e => e.category).filter(Boolean);
    const combined = Array.from(new Set([...standard, ...fromEvents]));
    return combined;
  }, [allEvents]);

  // Filtered + sorted events
  const events = useMemo(() => {
    let list = [...allEvents];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      list = list.filter((e) => e.category?.toLowerCase() === category.toLowerCase());
    }

    if (location) {
      list = list.filter((e) => e.location === location);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((e) => new Date(e.date) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      list = list.filter((e) => new Date(e.date) <= to);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':   return new Date(a.date)  - new Date(b.date);
        case 'date_desc':  return new Date(b.date)  - new Date(a.date);
        case 'price_asc':  return (Number(a.price) ?? 0) - (Number(b.price) ?? 0);
        case 'price_desc': return (Number(b.price) ?? 0) - (Number(a.price) ?? 0);
        default:           return 0;
      }
    });

    return list;
  }, [allEvents, search, category, location, dateFrom, dateTo, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setLocation('');
    setDateFrom('');
    setDateTo('');
    setSortBy('date_asc');
  };

  const hasActiveFilters =
    search ||
    (category && category !== 'All') ||
    location ||
    dateFrom ||
    dateTo ||
    sortBy !== 'date_asc';

  return {
    events,
    loading,
    error,
    locations,
    categoriesList,
    hasActiveFilters,
    filters: { search, category, location, dateFrom, dateTo, sortBy },
    setSearch,
    setCategory,
    setLocation,
    setDateFrom,
    setDateTo,
    setSortBy,
    clearFilters,
  };
}
