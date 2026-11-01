// src/components/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, LayoutDashboard, Calendar, BookOpen,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard',  href: '/admin',          icon: LayoutDashboard },
  { label: 'Events',     href: '/admin/events',    icon: Calendar },
  { label: 'Bookings',   href: '/admin/bookings',  icon: BookOpen },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-brand-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center glow-purple-sm">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-display font-bold text-lg">
          <span className="text-white">Event</span><span className="text-gradient">ly</span>
        </span>
        <span className="ml-auto text-[10px] font-semibold text-brand-purple bg-brand-purple/15 border border-brand-purple/25 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = location.pathname === href || (href !== '/admin' && location.pathname.startsWith(href));
          return (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active
                  ? 'bg-brand-purple/20 text-brand-lavender border border-brand-purple/30 glow-purple-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={17} className={active ? 'text-brand-purple' : ''} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-brand-purple" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-4 py-4 border-t border-brand-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-violet flex items-center justify-center text-white text-xs font-bold">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{admin?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-brand-darker text-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-brand-border bg-brand-dark/60 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-64 z-50 bg-brand-dark border-r border-brand-border flex flex-col md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              ><X size={20} /></button>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-dark/60">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold">
            <span className="text-white">Event</span><span className="text-gradient">ly</span>
            <span className="ml-2 text-xs text-brand-purple">Admin</span>
          </span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
