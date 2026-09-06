import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        if (userParam) {
          const parsed = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('projectgo_current_user', JSON.stringify(parsed));
          urlParams.delete('user');
          const newSearch = urlParams.toString();
          const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
          window.history.replaceState({}, '', newUrl);
          return parsed;
        }
      }
      const cached = localStorage.getItem('projectgo_current_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const heartbeatRef = useRef(null);

  // Send a lightweight presence ping
  const sendHeartbeat = () => {
    apiClient.patch('/auth/heartbeat').catch(() => {/* silently ignore */});
  };

  // Start/stop heartbeat whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      clearInterval(heartbeatRef.current);
      return;
    }
    // Immediately mark as online
    sendHeartbeat();
    // Then ping every 30 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, 30_000);

    // Also refresh on tab focus so short idle gaps don't flip to Offline
    const onFocus = () => sendHeartbeat();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser]);

  // Fetch current user session on mount (non-blocking revalidation)
  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      try {
        const response = await apiClient.get('/auth/me', { timeout: 4000 });
        if (!isMounted) return;
        setCurrentUser(response.data);
        localStorage.setItem('projectgo_current_user', JSON.stringify(response.data));
        
        // Fetch users list in background
        apiClient.get('/auth/users', { timeout: 5000 })
          .then(usersRes => {
            if (isMounted) setUsers(usersRes.data);
          })
          .catch(() => {});
      } catch (err) {
        if (!isMounted) return;
        // If 401 Unauthorized or 403 Forbidden, invalidate cached user
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          console.log('No active session found.');
          setCurrentUser(null);
          localStorage.removeItem('projectgo_current_user');
        }
      }
    };

    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setCurrentUser(response.data);
      localStorage.setItem('projectgo_current_user', JSON.stringify(response.data));
      
      // Refresh user list in background
      apiClient.get('/auth/users').then(usersRes => setUsers(usersRes.data)).catch(() => {});
      
      return response.data;
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  const signup = async (name, email, password, confirmPassword) => {
    try {
      await apiClient.post('/auth/signup', {
        fullName: name,
        email,
        password,
        confirmPassword
      });

      return true;
    } catch (err) {
      throw new Error(
        err?.response?.data?.message ||
        err?.message ||
        'Signup failed'
      );
    }
  };

  const googleLogin = () => {
    const base = import.meta.env.VITE_API_URL || 'https://projectgo-backend.onrender.com';
    window.location.href = `${base.replace(/\/+$/, '')}/api/auth/google`;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      setCurrentUser(null);
      setUsers([]);
      localStorage.removeItem('projectgo_current_user');
      localStorage.removeItem('projectgo_active_workspace');
      localStorage.removeItem('projectgo_workspaces_cache');
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || 'Forgot password request failed');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await apiClient.put('/auth/profile', updates);
      setCurrentUser(response.data);
      localStorage.setItem('projectgo_current_user', JSON.stringify(response.data));
      
      // Refresh users list
      const usersRes = await apiClient.get('/auth/users');
      setUsers(usersRes.data);
      
      return response.data;
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.message || 'Profile update failed');
    }
  };

  const value = {
    currentUser,
    users,
    loading,
    login,
    signup,
    googleLogin,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
