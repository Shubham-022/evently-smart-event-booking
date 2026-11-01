// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import VerifyTicketPage from './pages/VerifyTicketPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public customer routes */}
          <Route path="/"                     element={<LandingPage />} />
          <Route path="/events"               element={<EventsPage />} />
          <Route path="/events/:id"           element={<EventDetailsPage />} />
          <Route path="/booking/:id"          element={<BookingPage />} />
          <Route path="/booking/success/:id"  element={<BookingSuccessPage />} />
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/register"             element={<RegisterPage />} />
          <Route path="/profile"              element={<UserProfilePage />} />
          <Route path="/my-bookings"          element={<UserProfilePage />} />
          <Route path="/verify-ticket"        element={<VerifyTicketPage />} />
          <Route path="/verify-ticket/:refOrId" element={<VerifyTicketPage />} />

          {/* Admin public routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin protected routes */}
          <Route path="/admin"          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/events"   element={<ProtectedRoute><AdminEventsPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute><AdminBookingsPage /></ProtectedRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
