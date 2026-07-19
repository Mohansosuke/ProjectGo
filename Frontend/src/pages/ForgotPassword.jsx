import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import apiClient from '../services/apiClient';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resetToken = searchParams.get('resetToken');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('A password reset email has been sent. Please check your inbox.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password) {
      setError('Please enter your new password');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token: resetToken, newPassword: password });
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Header Info */}
      <div className="text-center mb-8">
        <div className="relative w-12 h-12 flex-shrink-0 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
          {resetToken ? 'New Password' : 'Reset Password'}
        </h2>
        <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-wider">
          ProjectGo SaaS Platform Security
        </p>
      </div>

      {/* Card Container */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-xl p-8 transition-all">
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-5 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-5 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold border border-emerald-100"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {resetToken ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <Input
              label="Choose a New Password"
              type="password"
              placeholder="Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={Lock}
              hint="Please meet all password complexity requirements."
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
            >
              Save New Password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={Mail}
              hint="We'll send you a link to reset your password safely."
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
            >
              Send Reset Email
            </Button>
          </form>
        )}
      </div>

      {/* Footer redirection */}
      <div className="mt-6 text-center text-sm text-slate-500 font-semibold">
        Remember your password?{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-bold">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
