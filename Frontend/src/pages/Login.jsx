import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, Input } from '../components/ui';
import apiClient from '../services/apiClient';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const { fetchWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    const inviteToken = searchParams.get('inviteToken');
    if (inviteToken) {
      localStorage.setItem('pendingInviteToken', inviteToken);
    }
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    if (searchParams.get('error')) {
      setError(searchParams.get('error'));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      
      const inviteToken = searchParams.get('inviteToken') || localStorage.getItem('pendingInviteToken');
      if (inviteToken) {
        try {
          const inviteRes = await apiClient.post('/invitations/accept', { token: inviteToken });
          localStorage.removeItem('pendingInviteToken');
          await fetchWorkspaces();
          navigate(`/workspace/${inviteRes.data.workspaceId}/kanban`);
          return;
        } catch (inviteErr) {
          console.error("Failed to accept invitation automatically:", inviteErr);
        }
      }
      
      navigate('/workspaces');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    setLoading(true);
    setError('');
    try {
      await googleLogin();
      navigate('/workspaces');
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Google Sign-in was cancelled before completion.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Welcome back
        </h2>
        <p className="text-gray-500 mt-1.5 text-sm">
          Sign in to your workspace to continue.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgb(0_0_0_/_0.08),_0_0_0_1px_rgb(0_0_0_/_0.04)] p-7">
        {/* Success */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2.5 p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium border border-emerald-100"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            {success}
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2.5 p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium border border-red-100"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={Mail}
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={Lock}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-1 h-10 text-sm font-semibold"
            size="lg"
          >
            Sign in to workspace
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-1 border-t border-gray-100" />
          <span className="px-4 text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
            or continue with
          </span>
          <div className="flex-1 border-t border-gray-100" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLoginClick}
            className="justify-center text-xs font-semibold gap-2 w-full"
            size="md"
            isLoading={loading}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to={`/signup${searchParams.get('inviteToken') || sessionStorage.getItem('pendingInviteToken') ? `?inviteToken=${searchParams.get('inviteToken') || sessionStorage.getItem('pendingInviteToken')}` : ''}`} className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  );
};

export default Login;
