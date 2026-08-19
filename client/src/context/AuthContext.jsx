import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setUser(null);
          } else {
            try {
              const res = await api.get('/auth/me');
              setUser(res.data);
            } catch (err) {
              console.error('Failed to fetch profile', err);
              setUser(decoded); // fallback
            }
          }
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (token, role) => {
    localStorage.setItem('token', token);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (e) {
      console.error('Failed to fetch profile on login', e);
      const decoded = jwtDecode(token);
      setUser(decoded); // fallback
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Allow components to manually refresh the user context
  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
