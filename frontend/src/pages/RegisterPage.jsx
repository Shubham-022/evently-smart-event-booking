// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, User, Mail, Phone, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userRegister } from '../services/userService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  );
}

export default function RegisterPage() {
  const { userLogin: saveUserSession, isUserAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = location.state?.from || searchParams.get('redirect') || '/events';

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isUserAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isUserAuthenticated, navigate, from]);

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    const cleanMobile = form.mobile.replace(/[\s-]/g, '');
    if (!/^\d{7,15}$/.test(cleanMobile)) {
      errors.mobile = 'Mobile number must be 7 to 15 digits.';
    }
    if (!form.password || form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setApiError('');
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await userRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      saveUserSession(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      const errRes = err.response?.data;
      setApiError(
        Array.isArray(errRes?.errors)
          ? errRes.errors.join(', ')
          : (errRes?.error || 'Registration failed. Please try again.')
      );
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-purple/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-violet glow-purple mb-4">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="font-display font-black text-3xl mb-2">
              Create an <span className="text-gradient">Account</span>
            </h1>
            <p className="text-gray-400 text-sm">Join Evently to book tickets and manage reservations</p>
          </div>

          <div className="glass rounded-2xl p-8 border border-brand-border shadow-xl">
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{apiError}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium mb-1.5 text-gray-300">
                  <User size={13} className="inline mr-1.5 text-brand-purple" /> Full Name
                </label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${formErrors.name ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                />
                <FieldError msg={formErrors.name} />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5 text-gray-300">
                  <Mail size={13} className="inline mr-1.5 text-brand-purple" /> Email Address
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="rahul@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${formErrors.email ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                />
                <FieldError msg={formErrors.email} />
              </div>

              <div>
                <label htmlFor="reg-mobile" className="block text-sm font-medium mb-1.5 text-gray-300">
                  <Phone size={13} className="inline mr-1.5 text-brand-purple" /> Mobile Number
                </label>
                <input
                  id="reg-mobile"
                  name="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${formErrors.mobile ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                />
                <FieldError msg={formErrors.mobile} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5 text-gray-300">
                    <Lock size={13} className="inline mr-1.5 text-brand-purple" /> Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-white/5 border ${formErrors.password ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError msg={formErrors.password} />
                </div>

                <div>
                  <label htmlFor="reg-confirmPassword" className="block text-sm font-medium mb-1.5 text-gray-300">
                    <Lock size={13} className="inline mr-1.5 text-brand-purple" /> Confirm Password
                  </label>
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${formErrors.confirmPassword ? 'border-red-500/60' : 'border-brand-border'} text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition`}
                  />
                  <FieldError msg={formErrors.confirmPassword} />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="user-register-btn"
                  disabled={loading}
                  className="w-full py-3.5 btn-primary justify-center font-semibold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Creating Account…
                    </>
                  ) : (
                    <>
                      Sign Up <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-border text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to={from !== '/events' ? `/login?redirect=${encodeURIComponent(from)}` : '/login'}
                className="text-brand-lavender hover:text-white font-medium underline underline-offset-4 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

