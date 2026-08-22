import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch current user session on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setCurrentUser(response.data);
        
        // Fetch users list
        const usersRes = await apiClient.get('/auth/users');
        setUsers(usersRes.data);
      } catch (error) {
        console.log('No active session found.');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setCurrentUser(response.data);
      
      // Refresh user list
      const usersRes = await apiClient.get('/auth/users');
      setUsers(usersRes.data);
      
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
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
};
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      setCurrentUser(null);
      setUsers([]);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
