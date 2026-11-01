// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // --- Admin state ---
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('evently_admin'));
    } catch {
      return null;
    }
  });

  const adminLogin = (token, adminData) => {
    localStorage.setItem('evently_admin_token', token);
    localStorage.setItem('evently_token', token); // backward compat
    localStorage.setItem('evently_admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const adminLogout = () => {
    localStorage.removeItem('evently_admin_token');
    localStorage.removeItem('evently_token');
    localStorage.removeItem('evently_admin');
    setAdmin(null);
  };

  const isAdminAuthenticated = !!admin && !!(localStorage.getItem('evently_admin_token') || localStorage.getItem('evently_token'));

  // --- User state ---
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('evently_user'));
    } catch {
      return null;
    }
  });

  const userLogin = (token, userData) => {
    localStorage.setItem('evently_user_token', token);
    localStorage.setItem('evently_user', JSON.stringify(userData));
    setUser(userData);
  };

  const userLogout = () => {
    localStorage.removeItem('evently_user_token');
    localStorage.removeItem('evently_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    localStorage.setItem('evently_user', JSON.stringify(updated));
    setUser(updated);
  };

  const isUserAuthenticated = !!user && !!localStorage.getItem('evently_user_token');

  return (
    <AuthContext.Provider
      value={{
        // Admin
        admin,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,

        // Backwards compatibility for existing admin components
        isAuthenticated: isAdminAuthenticated,
        login: adminLogin,
        logout: adminLogout,

        // User
        user,
        isUserAuthenticated,
        userLogin,
        userLogout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
