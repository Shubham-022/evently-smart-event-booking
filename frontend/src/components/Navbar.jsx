import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Calendar, User, LogOut, Ticket, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'Events',      href: '#events' },
  { label: 'About',       href: '#about' },
  { label: 'Categories',  href: '#categories' },
  { label: 'Schedule',    href: '#schedule' },
  { label: 'Pricing',     href: '#pricing' },
  { label: 'FAQ',         href: '#faq' },
];

export default function Navbar() {
  const { user, isUserAuthenticated, userLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAnchor = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + href);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSignOut = () => {
    setUserDropdown(false);
    setMenuOpen(false);
    userLogout();
    navigate('/');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled ? 'glass border-b border-brand-border shadow-lg shadow-brand-purple/10' : 'bg-brand-darker/70 backdrop-blur-md'}`}
      >
        <div className="container-max px-4 md:px-8 lg:px-16 xl:px-24 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center glow-purple-sm group-hover:scale-110 transition-transform">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="text-white">Event</span><span className="text-gradient">ly</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleAnchor(e, l.href)}
                className="text-sm font-medium text-gray-400 hover:text-brand-lavender transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Auth & CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/events" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-purple" /> Browse Events
            </Link>

            {isUserAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdown(p => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-border bg-white/5 hover:bg-white/10 text-white transition text-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name || 'Account'}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <AnimatePresence>
                  {userDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass border border-brand-border shadow-2xl py-2 z-50 bg-brand-dark"
                    >
                      <div className="px-4 py-2 border-b border-brand-border/60">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                        >
                          <Ticket size={15} className="text-brand-purple" /> My Bookings
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                        >
                          <User size={15} className="text-brand-purple" /> Profile Settings
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-brand-border/60">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  id="navbar-login-btn"
                  className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="navbar-register-btn"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-brand-border md:hidden bg-brand-darker/95 backdrop-blur-xl"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              <Link
                to="/events"
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-gray-200 hover:text-brand-lavender transition-colors flex items-center gap-2"
              >
                <Calendar size={16} className="text-brand-purple" /> Browse Events
              </Link>

              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleAnchor(e, l.href)}
                  className="text-base font-medium text-gray-400 hover:text-brand-lavender transition-colors"
                >
                  {l.label}
                </a>
              ))}

              <div className="pt-3 border-t border-brand-border flex flex-col gap-3">
                {isUserAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-1 py-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="btn-primary justify-center text-sm"
                    >
                      <Ticket size={16} /> My Profile & Bookings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-left text-sm text-red-400 py-2 hover:underline"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-base font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="btn-primary justify-center"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
