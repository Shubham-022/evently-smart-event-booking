// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userLogin } from '../services/userService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { userLogin: saveUserSession, isUserAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after login (e.g., /booking/5)
  const searchParams = new URLSearchParams(location.search);
  const from = location.state?.from || searchParams.get('redirect') || '/events';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isUserAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isUserAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await userLogin({
        email: form.email.trim(),
        password: form.password,
      });

      saveUserSession(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      const errRes = err.response?.data;
      setError(errRes?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-darker text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        {/* Background glow orb */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-brand-purple/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-violet glow-purple mb-4">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="font-display font-black text-3xl mb-2">
              Welcome <span className="text-gradient">Back</span>
            </h1>
            <p className="text-gray-400 text-sm">Sign in to your Evently account</p>
          </div>

          <div className="glass rounded-2xl p-8 border border-brand-border shadow-xl">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium mb-2 text-gray-300">
                  <Mail size={14} className="inline mr-1.5 text-brand-purple" /> Email Address
                </label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label htmlFor="user-password" className="block text-sm font-medium mb-2 text-gray-300">
                  <Lock size={14} className="inline mr-1.5 text-brand-purple" /> Password
                </label>
                <div className="relative">
                  <input
                    id="user-password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-brand-border text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="user-login-btn"
                disabled={loading}
                className="w-full py-3.5 btn-primary justify-center font-semibold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Signing In…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-border text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                to={from !== '/events' ? `/register?redirect=${encodeURIComponent(from)}` : '/register'}
                className="text-brand-lavender hover:text-white font-medium underline underline-offset-4 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/admin/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Are you an Admin? Access Admin Portal &rarr;
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

