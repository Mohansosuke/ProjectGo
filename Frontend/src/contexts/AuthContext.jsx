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
      } catch (_error) {
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
      {loading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-black text-xl tracking-tight">Project<span className="text-violet-400">Go</span></span>
          </div>
          <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
