import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // Check sessionStorage first (enables independent multi-window logins)
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.user || res.data);
      } catch (err) {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    // Storing in sessionStorage allows different windows/tabs to run different accounts simultaneously
    sessionStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token, user: userData } = res.data;
    sessionStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
