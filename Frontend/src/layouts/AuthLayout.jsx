import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare, Zap, Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: Zap,       text: 'Blazing-fast task management' },
  { icon: Users,     text: 'Real-time team collaboration' },
  { icon: Shield,    text: 'Enterprise-grade security' },
  { icon: CheckSquare, text: 'Smart workflow automation' },
];

const AuthLayout = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/workspaces" replace />;
  }

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── Left branded panel (desktop only) ──────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] shrink-0 relative flex-col bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] text-white overflow-hidden">
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Mark */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
                  <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* Wordmark */}
            <span className="text-white font-black text-[17px] tracking-tight leading-none select-none">
              Project<span className="text-violet-300">Go</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="mt-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-4">
                Enterprise Task Management
              </p>
              <h1 className="text-4xl xl:text-5xl font-black leading-[1.08] tracking-tight text-white">
                Work smarter,<br />
                ship <span className="text-indigo-300">faster</span>.
              </h1>
              <p className="mt-5 text-indigo-200/80 text-base leading-relaxed max-w-sm">
                The premium workspace platform trusted by high-performing teams to manage projects, track progress, and collaborate in real-time.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-8 space-y-3"
            >
              {features.map((f, i) => (
                <motion.li
                  key={f.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center gap-3 text-sm text-indigo-100/90"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <f.icon className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                  {f.text}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border border-white/10 rounded-2xl p-5 bg-white/5 backdrop-blur-sm"
          >
            <p className="text-sm text-indigo-100/90 leading-relaxed italic">
              "ProjectGo transformed how our team collaborates. We ship 40% faster with complete visibility across every project."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <img
                src="https://i.pravatar.cc/80?img=47"
                alt="Testimonial"
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
              <div>
                <p className="text-white text-xs font-semibold">Sarah Chen</p>
                <p className="text-indigo-300 text-[11px]">VP Engineering, NovaTech</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right auth form panel ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 p-6 pb-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Mark */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* Wordmark */}
            <span className="font-black text-base tracking-tight leading-none select-none text-gray-900">
              Project<span className="text-violet-600">Go</span>
            </span>
          </Link>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            <Outlet />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="shrink-0 pb-8 flex items-center justify-center gap-4 text-xs text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <a href="#" className="hover:text-gray-600 transition-colors">Help Center</a>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
