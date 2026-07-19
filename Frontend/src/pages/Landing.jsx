import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Sparkles, CheckCircle2, Zap, Users, Shield,
  BarChart3, Globe, ArrowRight, Star, Quote, Play, Kanban, Bell,
  Lock, Clock, TrendingUp, MessageSquare, Menu, X, Rocket, Target,
  Layers, Send, Mail, ArrowUpRight, Activity, Check, GitBranch,
  Cpu, ChevronUp, ExternalLink, MoveRight,
  FileText, Database, Video, Cloud
} from 'lucide-react';
import Button from '../components/ui/Button';

/* ─── Animation Variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ─── Helpers ─────────────────────────────────────────────── */
function Section({ id, children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-72px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function StatCounter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const step = end / (2000 / 16);
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Logo ─────────────────────────────────────────────────── */
const Logo = ({ variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const accentColor = variant === 'light' ? 'text-violet-300' : 'text-violet-600';
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      {/* Mark */}
      <div className="relative w-9 h-9 flex-shrink-0">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
            {/* Double forward arrow — represents going fast / ProjectGo */}
            <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {/* Wordmark */}
      <span className={`font-black text-[17px] tracking-tight leading-none select-none ${textColor}`}>
        Project<span className={accentColor}>Go</span>
      </span>
    </Link>
  );
};

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar({ onNavClick, annHeight = 0 }) {
  const [scrolled, setScrolled] = useState(false);
  const [atHero, setAtHero] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 8);
      setAtHero(window.scrollY < window.innerHeight * 0.72);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Features', id: 'features' },
    { label: 'How it works', id: 'how-it-works' },
    { label: 'Integrations', id: 'integrations' },
    { label: 'Pricing', id: 'pricing' },
  ];

  const isLight = atHero; // navbar is transparent over the dark hero

  return (
    <>
      <motion.nav
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ top: annHeight }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/10 shadow-xl shadow-black/20 backdrop-blur-2xl bg-[#030712]/80'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-[62px] flex items-center justify-between gap-6">
          <Logo variant="light" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => onNavClick(id)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/8 transition-all cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer">
                Sign in
              </button>
            </Link>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow cursor-pointer"
              >
                Get started free
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-0 right-0 z-40 bg-[#030712]/95 backdrop-blur-2xl border-b border-white/10 px-5 py-5 flex flex-col gap-2"
            style={{ top: annHeight + 62 }}
          >
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => { onNavClick(id); setOpen(false); }}
                className="text-left py-2.5 px-3 text-slate-300 text-sm font-medium rounded-xl hover:bg-white/10 hover:text-white transition-all"
              >
                {label}
              </button>
            ))}
            <div className="flex gap-3 mt-2 pt-4 border-t border-white/10">
              <Link to="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full text-white border-white/20 hover:bg-white/10">Sign in</Button></Link>
              <Link to="/signup" className="flex-1">
                <button className="w-full py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                  Get started
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Hero Background Mesh ───────────────────────────────── */
function HeroMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,58,237,0.35),transparent)]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Orbs */}
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-24 left-[8%] w-80 h-80 bg-violet-700/20 rounded-full blur-3xl" />
      <motion.div animate={{ x: [0, -25, 0], y: [0, 30, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute top-32 right-[12%] w-96 h-96 bg-indigo-700/15 rounded-full blur-3xl" />
      <motion.div animate={{ x: [0, 15, 0], y: [0, -25, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-0 left-[40%] w-64 h-64 bg-blue-700/10 rounded-full blur-3xl" />
    </div>
  );
}

/* ─── Live Mini Kanban Board — Light Theme ───────────────── */
const boardTasks = [
  { col: 'To Do',       label: 'API Gateway Design',    tag: 'Backend',  tc: 'bg-blue-50 text-blue-600',     av: 'https://i.pravatar.cc/40?img=11', prog: 0   },
  { col: 'To Do',       label: 'Onboarding Flow v2',    tag: 'Design',   tc: 'bg-pink-50 text-pink-600',     av: 'https://i.pravatar.cc/40?img=47', prog: 0   },
  { col: 'In Progress', label: 'Authentication Module', tag: 'Security', tc: 'bg-amber-50 text-amber-600',  av: 'https://i.pravatar.cc/40?img=12', prog: 72  },
  { col: 'In Progress', label: 'Dashboard Analytics',   tag: 'Frontend', tc: 'bg-violet-50 text-violet-600',av: 'https://i.pravatar.cc/40?img=32', prog: 45  },
  { col: 'Done',        label: 'Design System v3',      tag: 'Design',   tc: 'bg-emerald-50 text-emerald-600', av: 'https://i.pravatar.cc/40?img=5', prog: 100 },
];
function KanbanPreview() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % boardTasks.length), 2400);
    return () => clearInterval(t);
  }, []);
  const cols = ['To Do', 'In Progress', 'Done'];
  return (
    <div className="w-full h-full bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Kanban className="w-3 h-3" />
          <span>Q4 Sprint · ProjectGo</span>
        </div>
        <div className="flex gap-2 items-center">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <img src="https://i.pravatar.cc/40?img=5" alt="user" className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm" />
        </div>
      </div>
      {/* Columns */}
      <div className="flex-1 flex gap-2.5 p-3 overflow-hidden bg-slate-50/60">
        {cols.map(col => {
          const tasks = boardTasks.filter(t => t.col === col);
          const dotColor = col === 'To Do' ? 'bg-slate-400' : col === 'In Progress' ? 'bg-blue-500' : 'bg-emerald-500';
          return (
            <div key={col} className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{col}</span>
                <span className="text-[9px] text-slate-500 bg-slate-200 px-1 rounded font-semibold">{tasks.length}</span>
              </div>
              {tasks.map((task, i) => {
                const idx = boardTasks.indexOf(task);
                const isActive = idx === pulse;
                return (
                  <motion.div key={i}
                    animate={{ scale: isActive ? 1.03 : 1, boxShadow: isActive ? '0 4px 16px rgba(109,40,217,0.15)' : '0 1px 3px rgba(0,0,0,0.04)' }}
                    transition={{ duration: 0.35 }}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col gap-1.5"
                  >
                    <p className="text-[9px] font-semibold text-slate-700 leading-snug">{task.label}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${task.tc}`}>{task.tag}</span>
                      <img src={task.av} alt="" className="w-4 h-4 rounded-full object-cover border border-white shadow-sm" />
                    </div>
                    {task.prog > 0 && (
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${task.prog}%` }}
                          transition={{ duration: 1.2, delay: 0.3 }}
                          className={`h-full rounded-full ${task.prog === 100 ? 'bg-emerald-400' : 'bg-violet-500'}`}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {col === 'To Do' && (
                <div className="border border-dashed border-slate-200 rounded-xl h-7 flex items-center justify-center">
                  <span className="text-[9px] text-slate-400">+ Add task</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Bottom bar */}
      <div className="h-8 border-t border-slate-100 bg-white flex items-center px-4 gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-slate-500">3 members online</span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <span className="text-[9px] text-slate-400">Last updated just now</span>
      </div>
    </div>
  );
}

/* ─── Feature Card ───────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, gradient, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-violet-100 shadow-sm hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-300 cursor-default"
    >
      <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-bold text-slate-900 text-[15px] mb-1.5">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl" />
    </motion.div>
  );
}

/* ─── Integration Grid ───────────────────────────────────── */
const integrations = [
  { name: 'TeamSync',   cat: 'Messaging',   color: 'from-purple-600 to-violet-700',   Icon: MessageSquare },
  { name: 'CodeBase',   cat: 'Dev Tools',   color: 'from-slate-700 to-slate-900',      Icon: GitBranch },
  { name: 'DesignKit',  cat: 'Design',      color: 'from-pink-500 to-rose-600',        Icon: Layers },
  { name: 'PaperDocs',  cat: 'Docs',        color: 'from-amber-500 to-orange-600',     Icon: FileText },
  { name: 'DataVault',  cat: 'Storage',     color: 'from-emerald-600 to-teal-700',     Icon: Database },
  { name: 'VideoHub',   cat: 'Meetings',    color: 'from-blue-500 to-cyan-600',        Icon: Video },
  { name: 'FlowDesk',   cat: 'Analytics',   color: 'from-indigo-600 to-blue-700',      Icon: BarChart3 },
  { name: 'QuickTrack', cat: 'Tracking',    color: 'from-violet-600 to-purple-700',    Icon: Target },
  { name: 'AutoPilot',  cat: 'Automation',  color: 'from-orange-500 to-red-600',       Icon: Zap },
  { name: 'CloudSync',  cat: 'Infra',       color: 'from-sky-500 to-blue-600',         Icon: Cloud },
];

/* ─── How-it-works Step ─────────────────────────────────── */
function WorkStep({ number, title, description, features, icon: Icon, visual, delay = 0, flip = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={`flex flex-col ${flip ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 md:gap-16 items-center`}
    >
      {/* Text */}
      <motion.div variants={fadeUp} transition={{ delay }} className="flex-1 space-y-5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-base shadow-lg shadow-violet-500/25">
          {number}
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 leading-tight">{title}</h3>
          <p className="text-slate-500 text-base leading-relaxed">{description}</p>
        </div>
        <ul className="space-y-2.5">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-violet-600" />
              </div>
              <span className="text-slate-600 text-sm">{f}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Visual card */}
      <motion.div variants={fadeUp} transition={{ delay: delay + 0.12 }} className="flex-1 w-full">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/60 bg-white">
          {/* Top bar */}
          <div className="flex items-center gap-1.5 px-4 h-9 border-b border-slate-100 bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="ml-auto text-[10px] text-slate-400 font-medium">ProjectGo</span>
          </div>
          {/* Mockup content */}
          <div className="p-5 min-h-[200px] flex flex-col gap-3">
            {visual}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Testimonial Components ─────────────────────────────── */
function SmallTestimonialCard({ quote, author, role, company, initials, avatarImg, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -4, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)' }}
      className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 group transition-shadow duration-300"
    >
      <div className="flex gap-0.5">
        {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
        <img src={avatarImg} alt={author} className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 shrink-0" />
        <div>
          <p className="text-slate-900 text-sm font-semibold">{author}</p>
          <p className="text-slate-400 text-xs">{role} · {company}</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

/* ─── Pricing Card ───────────────────────────────────────── */
function PricingCard({ name, price, period, desc, features, cta, highlight, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -6 }}
      className={`relative rounded-2xl p-7 flex flex-col gap-5 border transition-all duration-300 ${
        highlight
          ? 'bg-gradient-to-b from-violet-600 to-indigo-700 border-transparent text-white shadow-2xl shadow-violet-500/30'
          : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg shadow-amber-500/30">
          ✦ Most Popular
        </div>
      )}
      <div>
        <h3 className={`font-black text-lg ${highlight ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
        <p className={`text-sm mt-1 ${highlight ? 'text-violet-200' : 'text-slate-500'}`}>{desc}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-slate-900'}`}>{price}</span>
        {period && <span className={`text-sm ${highlight ? 'text-violet-300' : 'text-slate-400'}`}>{period}</span>}
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-violet-200' : 'text-emerald-500'}`} />
            <span className={highlight ? 'text-violet-100' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/signup">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            highlight
              ? 'bg-white text-violet-700 hover:bg-violet-50 shadow-lg'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
          }`}
        >
          {cta}
        </motion.button>
      </Link>
    </motion.div>
  );
}

/* ─── Scroll Progress ────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div
      style={{ width }}
      className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-400 to-blue-500 z-[200] origin-left"
    />
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
════════════════════════════════════════════════════════════ */
export default function Landing() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const h = () => setBackToTopVisible(window.scrollY > 600);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Track announcement bar height for navbar offset
  const announceRef = useRef(null);
  const ANN_HEIGHT = announceDismissed ? 0 : 40; // py-2.5 * 2 + text ≈ 40px

  return (
    <div className="min-h-screen bg-[#030712] text-slate-900 overflow-x-hidden">
      <ScrollProgress />

      {/* ── Fixed header: announcement + navbar stacked ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        {/* Announcement bar — always on top */}
        <AnimatePresence>
          {!announceDismissed && (
            <motion.div
              ref={announceRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-gradient-to-r from-violet-900 to-indigo-900 border-b border-violet-700/30 overflow-hidden"
              style={{ minHeight: 0 }}
            >
              <div className="h-10 flex items-center justify-center px-5 gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-300 flex-shrink-0" />
                  <span className="text-slate-300 font-medium text-xs">
                    Announcing <strong className="text-white">ProjectGo AI</strong> — your intelligent project co-pilot
                  </span>
                </div>
                <button className="flex items-center gap-1 text-violet-300 hover:text-white font-semibold text-xs transition-colors flex-shrink-0">
                  Learn more <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setAnnounceDismissed(true)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navbar sits directly below */}
        <Navbar onNavClick={scrollToSection} annHeight={ANN_HEIGHT} />
      </div>

      {/* Spacer to push content below the fixed header */}
      <div style={{ height: ANN_HEIGHT + 62 }} />

      {/* ══════════════════════════════════════════════════════
          HERO — Dark, grid, big headline
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 md:px-8 overflow-hidden bg-[#030712]">
        <HeroMesh />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-7 cursor-default"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Trusted by 50,000+ engineering teams
          <ArrowRight className="w-3 h-3" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-[68px] font-black tracking-tight leading-[1.05] text-white text-center max-w-5xl"
        >
          Built for teams who
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              refuse to slow down.
            </span>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 origin-left"
            />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-7 text-[17px] text-slate-400 max-w-xl text-center leading-relaxed"
        >
          ProjectGo unifies your tasks, sprints, teammates, and insights into one workspace that adapts to your team — not the other way around.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-3.5"
        >
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-violet-500/30 transition-all cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              Start for free
              <ChevronRight className="w-4 h-4 ml-1" />
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/8 border border-white/12 text-slate-200 font-semibold text-sm hover:bg-white/12 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
            </div>
            Watch 2-min demo
          </motion.button>
        </motion.div>

        {/* Social proof avatars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-7 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {[32, 44, 64, 22, 7].map((n, i) => (
              <img key={i} src={`https://i.pravatar.cc/40?img=${n}`} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#030712]" />
            ))}
          </div>
          <p className="text-slate-400 text-xs font-medium">
            <span className="text-white font-bold">4.9 / 5</span> · from 2,400+ reviews
          </p>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 56, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 w-full max-w-5xl relative"
        >
          {/* Glow under card */}
          <div className="absolute inset-x-8 bottom-0 h-32 bg-violet-600/20 blur-3xl" />
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-2xl shadow-slate-900/20 p-2.5 bg-white">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#030712] to-transparent z-10 pointer-events-none rounded-b-xl" />
            <div className="h-[400px] md:h-[460px]">
              <KanbanPreview />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Trust bar — real logos ── */}
      <section className="bg-[#030712] border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 text-center">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest mb-8">Trusted by the world's most ambitious teams</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {[
              { name: 'Vercel',     domain: 'vercel.com' },
              { name: 'Stripe',     domain: 'stripe.com' },
              { name: 'Figma',      domain: 'figma.com' },
              { name: 'Atlassian',  domain: 'atlassian.com' },
              { name: 'Cloudflare', domain: 'cloudflare.com' },
              { name: 'Linear',     domain: 'linear.app' },
              { name: 'Supabase',   domain: 'supabase.com' },
            ].map(({ name, domain }) => (
              <img
                key={name}
                src={`https://logo.clearbit.com/${domain}`}
                alt={name}
                className="h-7 w-auto object-contain opacity-30 hover:opacity-60 grayscale hover:grayscale-0 transition-all duration-300 cursor-default"
                onError={e => { e.target.style.display='none'; }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS — Clean white section
      ══════════════════════════════════════════════════════ */}
      <Section id="stats" className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { n: 50000, suf: '+', label: 'Teams worldwide', sub: 'Across 140 countries', icon: Globe, color: 'text-violet-600 bg-violet-50' },
              { n: 98, suf: '%', label: 'Customer satisfaction', sub: 'Based on 2024 survey', icon: Star, color: 'text-amber-600 bg-amber-50' },
              { n: 3, suf: '×', label: 'Faster delivery', sub: 'vs. baseline tooling', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
              { n: 99, suf: '.9%', label: 'Uptime SLA', sub: '24/7 infrastructure', icon: Shield, color: 'text-blue-600 bg-blue-50' },
            ].map(({ n, suf, label, sub, icon: Icon, color }, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ delay: i * 0.08 }} className="flex flex-col items-center text-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-4xl font-black text-slate-900"><StatCounter end={n} suffix={suf} /></p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <Section id="features" className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div variants={fadeUp} className="max-w-xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-4">
              <Layers className="w-3.5 h-3.5" /> Everything you need, nothing you don't
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Purpose-built for how<br />great teams operate
            </h2>
            <p className="text-slate-500 mt-4 text-base leading-relaxed">
              Every feature in ProjectGo was designed around reducing friction, sharpening focus, and making your entire team faster.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Kanban, title: 'Kanban & Sprint Boards', desc: 'Drag-and-drop boards with WIP limits, swimlanes, and sprint automation built right in.', gradient: 'bg-gradient-to-br from-violet-500 to-indigo-600' },
              { icon: Users, title: 'Real-time Collaboration', desc: 'Live cursors, instant comments, and conflict-free editing — your team stays perfectly in sync.', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
              { icon: BarChart3, title: 'Velocity Analytics', desc: 'Auto-generated burndown charts, cycle time histograms, and bottleneck heatmaps.', gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
              { icon: Zap, title: 'AI Automation', desc: 'Smart task assignment, deadline prediction, and auto-categorization trained on your team\'s patterns.', gradient: 'bg-gradient-to-br from-amber-500 to-orange-500' },
              { icon: Lock, title: 'Enterprise Security', desc: 'SOC 2 Type II, SSO, SAML, audit logs, and granular RBAC — security that scales with you.', gradient: 'bg-gradient-to-br from-rose-500 to-pink-600' },
              { icon: Bell, title: 'Smart Notifications', desc: 'AI-filtered alerts surface only what needs your attention — zero inbox noise, full context.', gradient: 'bg-gradient-to-br from-fuchsia-500 to-violet-600' },
              { icon: Target, title: 'OKR Goal Tracking', desc: 'Link tasks directly to company objectives. Progress rolls up automatically — no status meetings.', gradient: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
              { icon: Clock, title: 'Time Tracking', desc: 'Log hours directly on tasks. Auto-generate reports and see where your team\'s time actually goes.', gradient: 'bg-gradient-to-br from-sky-500 to-blue-600' },
              { icon: GitBranch, title: 'Dev Workflow Integration', desc: 'Link PRs, commits, and CI pipelines to tasks. See code status without leaving your board.', gradient: 'bg-gradient-to-br from-slate-600 to-slate-800' },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.04} />
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — Premium alternating steps
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white py-28 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          {/* Heading */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-4">
                <Rocket className="w-3.5 h-3.5" /> Ship in minutes, not months
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Zero to shipped in<br />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">three simple steps</span>
              </h2>
              <p className="mt-4 text-slate-500 text-base max-w-lg mx-auto">
                No week-long onboarding. No armies of consultants. Just a workspace that works the way your team thinks.
              </p>
            </motion.div>
          </div>

          {/* Steps */}
          <div className="space-y-24">
            <WorkStep
              number="01"
              title="Create your workspace in under 60 seconds"
              description="Sign up, name your workspace, and invite your entire team with one link. Import existing projects from any tool instantly."
              features={[
                'One-click import from Jira, Trello, Asana, or Linear',
                'Invite unlimited teammates with a single shareable link',
                'Pre-built templates for 50+ engineering workflows',
                'Auto-detect your team structure from email domains',
              ]}
              visual={
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Workspace created</p>
                      <p className="text-[11px] text-slate-500">Acme Engineering — 12 members</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700">Team invited</p>
                      <div className="flex -space-x-1.5 mt-1">
                        {[15, 32, 47, 54].map((n, i) => (
                          <img key={i} src={`https://i.pravatar.cc/32?img=${n}`} alt="" className="w-5 h-5 rounded-full object-cover border-2 border-white" />
                        ))}
                        <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[7px] text-slate-500 font-bold">+8</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <Kanban className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700">22 tasks imported from Jira</p>
                      <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden w-full">
                        <motion.div initial={{width:0}} whileInView={{width:'100%'}} viewport={{once:true}} transition={{duration:1.2, delay:0.2}}
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            <WorkStep
              number="02"
              title="Set up boards that match your workflow"
              description="Choose from 50+ expert templates or design your own. Custom fields, statuses, and automation rules — all configured in minutes."
              features={[
                'Drag-and-drop board builder with custom columns',
                'Powerful automation — no-code rules for any trigger',
                'Custom fields: dropdowns, dates, people, or any data type',
                'Nested subtasks with dependencies and blocking indicators',
              ]}
              flip
              visual={
                <div className="space-y-2">
                  {['To Do', 'In Progress', 'Review', 'Done'].map((col, ci) => (
                    <div key={col} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50 group hover:bg-violet-50 hover:border-violet-100 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${ci===0?'bg-slate-400':ci===1?'bg-blue-400':ci===2?'bg-amber-400':'bg-emerald-400'}`} />
                      <span className="text-xs font-semibold text-slate-700 flex-1">{col}</span>
                      <span className="text-[11px] text-slate-400">{[2,3,1,4][ci]} tasks</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-violet-400 transition-colors" />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg border border-dashed border-violet-200 bg-violet-50/50">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs text-violet-600 font-medium">When task moves to Review → notify designer</span>
                  </div>
                </div>
              }
            />

            <WorkStep
              number="03"
              title="Ship with confidence — every time"
              description="Real-time analytics, AI insights, and automated reporting keep everyone aligned. Celebrate milestones with your team as they happen."
              features={[
                'Live velocity and burndown charts update automatically',
                'AI flags blockers before they become incidents',
                'Automated sprint retrospective reports in one click',
                'Slack-style celebration feeds when milestones hit',
              ]}
              visual={
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Sprint 24 · Velocity</span>
                    <span className="text-xs text-emerald-600 font-bold">↑ 34% vs last sprint</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40,55,48,70,65,80,72,88].map((h,i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: i * 0.07 }}
                          className={`rounded-sm ${i===7?'bg-gradient-to-t from-violet-600 to-indigo-400':'bg-gradient-to-t from-slate-200 to-slate-100'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-[11px] text-emerald-700 font-medium">🎉 Sprint goal achieved! 21/21 tasks shipped on time.</p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          INTEGRATIONS — Dark, premium
      ══════════════════════════════════════════════════════ */}
      <section id="integrations" className="bg-[#030712] py-28 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold mb-4">
              <Globe className="w-3.5 h-3.5" /> 200+ native integrations
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              The hub your tools call home
            </h2>
            <p className="mt-4 text-slate-400 text-base max-w-xl mx-auto">
              ProjectGo connects natively with the tools your team already loves. One integration setup, everything in sync — forever.
            </p>
          </motion.div>

          {/* Center hub + radial cards */}
          <div className="relative flex flex-col items-center">
            {/* Central ProjectGo node */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex flex-col items-center justify-center shadow-2xl shadow-violet-500/30 mb-8"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[9px] text-violet-200 font-bold mt-0.5">ProjectGo</span>
            </motion.div>

            {/* Two-row marquee */}
            <div className="w-full relative overflow-hidden py-2">
              <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

              {/* Row 1 — left to right */}
              <div className="flex gap-4 mb-4 overflow-hidden">
                <motion.div
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="flex gap-4 flex-shrink-0"
                >
                  {[...integrations, ...integrations].map(({ name, cat, color, Icon }, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -3, scale: 1.04 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm cursor-default flex-shrink-0"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{name}</p>
                        <p className="text-slate-500 text-[11px]">{cat}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Row 2 — right to left */}
              <div className="flex gap-4 overflow-hidden">
                <motion.div
                  animate={{ x: ['-50%', '0%'] }}
                  transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                  className="flex gap-4 flex-shrink-0"
                >
                  {[...integrations.slice(5), ...integrations.slice(0,5), ...integrations.slice(5), ...integrations.slice(0,5)].map(({ name, cat, color, Icon }, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -3, scale: 1.04 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm cursor-default flex-shrink-0"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="text-white w-[18px] h-[18px]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{name}</p>
                        <p className="text-slate-500 text-[11px]">{cat}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Bottom tag */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-slate-500 text-sm"
            >
              All integrations sync in real-time · No per-integration fees · One-click setup
            </motion.p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS — Premium, not generic
      ══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="bg-white py-28 border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-4">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9 / 5 across 2,400+ reviews
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              What engineering leaders<br />are saying
            </h2>
          </motion.div>

          {/* Featured testimonial — full width, dark */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="relative bg-gradient-to-br from-[#0d0f1a] to-[#0a0514] rounded-3xl p-8 md:p-12 mb-8 overflow-hidden border border-white/5"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-24 h-24 text-violet-300" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-1">
                <div className="flex gap-1 mb-5">
                  {Array(5).fill(0).map((_,i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <blockquote className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6 max-w-2xl">
                  "Moving from our previous tooling to ProjectGo was the single best operational decision we made in 2024. Our average cycle time dropped from 3 weeks to 4 days. It didn't just improve our workflow — it fundamentally changed how we think about shipping."
                </blockquote>
                <div className="flex items-center gap-4">
                  <img src="https://i.pravatar.cc/56?img=5" alt="Sarah Chen" className="w-12 h-12 rounded-2xl object-cover border-2 border-white/10 shadow-lg flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold">Sarah Chen</p>
                    <p className="text-slate-400 text-sm">VP of Engineering · Vercel</p>
                  </div>
                  <div className="ml-auto hidden md:block">
                    <img src="https://logo.clearbit.com/vercel.com" alt="Vercel" className="h-6 opacity-40 grayscale" onError={e => { e.target.style.display='none'; }} />
                  </div>
                </div>
              </div>

              {/* Stat callout */}
              <div className="flex-shrink-0 w-full md:w-48 bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                <p className="text-5xl font-black text-white">3×</p>
                <p className="text-violet-300 text-sm font-semibold mt-1">faster delivery</p>
                <div className="h-px bg-white/10 my-3" />
                <p className="text-3xl font-black text-white">40%</p>
                <p className="text-violet-300 text-sm font-semibold mt-1">more features shipped</p>
              </div>
            </div>
          </motion.div>

          {/* 3-col grid of smaller testimonials */}
          <Section className="grid md:grid-cols-3 gap-5 mb-12">
            <SmallTestimonialCard
              quote="The Kanban boards are so intuitive we onboarded 40 engineers in a single afternoon. Zero resistance from the team — that's never happened before."
              author="Marcus Johnson"
              role="CTO"
              company="Stripe"
              initials="MJ"
              avatarImg="https://i.pravatar.cc/48?img=12"
              delay={0}
            />
            <SmallTestimonialCard
              quote="Finally, a project tool that feels designed for humans. The AI automation alone saves our PM team 12+ hours every week. That's half a sprint."
              author="Priya Sharma"
              role="Head of Product"
              company="Figma"
              initials="PS"
              avatarImg="https://i.pravatar.cc/48?img=47"
              delay={0.1}
            />
            <SmallTestimonialCard
              quote="The analytics are genuinely insane. I can spot bottlenecks before they become incidents. It changed how I run sprints entirely."
              author="Alex Rivera"
              role="Engineering Manager"
              company="Atlassian"
              initials="AR"
              avatarImg="https://i.pravatar.cc/48?img=15"
              delay={0.2}
            />
          </Section>

          {/* Second row — 2 cards + a metric card */}
          <Section className="grid md:grid-cols-3 gap-5">
            <SmallTestimonialCard
              quote="We migrated from a legacy tool in one afternoon. I never thought I'd say this — our engineers now actually enjoy updating task statuses."
              author="Lisa Thompson"
              role="Scrum Master"
              company="Cloudflare"
              initials="LT"
              avatarImg="https://i.pravatar.cc/48?img=25"
              delay={0}
            />
            <SmallTestimonialCard
              quote="SOC 2 compliance was a hard requirement. ProjectGo had everything out-of-the-box. Security + usability is a rare and beautiful thing."
              author="David Park"
              role="CISO"
              company="Linear"
              initials="DP"
              avatarImg="https://i.pravatar.cc/48?img=54"
              delay={0.1}
            />
            {/* Social proof card */}
            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-violet-500/20"
            >
              <div>
                <div className="flex -space-x-2 mb-5">
                  {[12, 47, 15, 25].map((n, i) => (
                    <img key={i} src={`https://i.pravatar.cc/40?img=${n}`} alt="" className="w-9 h-9 rounded-full object-cover shadow-md" style={{border:'3px solid #5b21b6'}} />
                  ))}
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold" style={{border:'3px solid #5b21b6'}}>
                    49k+
                  </div>
                </div>
                <p className="text-white font-black text-2xl">50,000+</p>
                <p className="text-violet-200 text-sm mt-1">teams shipped with ProjectGo this year</p>
              </div>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white text-violet-700 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Join them free <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════ */}
      <Section id="pricing" className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Transparent pricing, always
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Start free, scale without surprises</h2>
            <p className="mt-3 text-slate-500 text-base max-w-lg mx-auto">
              No hidden fees. No per-seat complexity. Every plan includes a 14-day trial of Pro.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard name="Starter" price="Free" desc="For small teams getting started" cta="Start for free"
              features={['Up to 5 members','3 active projects','Basic Kanban boards','1 GB storage','Community support']} highlight={false} delay={0} />
            <PricingCard name="Pro" price="$12" period="/user/mo" desc="For growing teams that need more" cta="Start 14-day free trial"
              features={['Unlimited members','Unlimited projects','Advanced analytics','AI automation (50 runs/mo)','Priority support','Time tracking & reports']} highlight delay={0.1} />
            <PricingCard name="Enterprise" price="Custom" desc="For large-scale organizations" cta="Contact sales"
              features={['Everything in Pro','SSO & advanced security','Custom integrations','Unlimited AI automation','Dedicated success manager','Custom SLA & audit logs']} highlight={false} delay={0.2} />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          CTA — Ultra premium, non-standard
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#030712] py-28 border-t border-white/5 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(109,40,217,0.2),transparent)]" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-32 -left-32 w-[500px] h-[500px] border border-violet-900/30 rounded-full" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-32 -right-32 w-[600px] h-[600px] border border-indigo-900/20 rounded-full" />
          {/* Stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.15 + Math.random() * 0.25 }}
              animate={{ opacity: [0.1, 0.6, 0.1] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4 }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Join 50,000+ teams
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Your team's best sprint<br />starts
                <span className="relative ml-3">
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">today.</span>
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                No credit card needed. No setup cost. Just a workspace your whole team will actually use — up and running in under 5 minutes.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Check, text: 'Free 14-day trial · all Pro features included' },
                  { icon: Check, text: 'Import from any tool in one click' },
                  { icon: Check, text: 'Cancel anytime · no questions asked' },
                  { icon: Check, text: 'SOC 2 certified from day one' },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Right — Signup widget */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.15 }}
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 rounded-3xl blur-2xl scale-95" />
                <div className="relative bg-[#0d0f1a] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                  <h3 className="text-white font-black text-xl mb-1">Get started free</h3>
                  <p className="text-slate-400 text-sm mb-6">No credit card · 14-day Pro trial</p>

                  {/* Email input */}
                  <div className="relative mb-3">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@company.com"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:bg-white/8 transition-all"
                    />
                  </div>

                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all cursor-pointer mb-4"
                    >
                      <Rocket className="w-4 h-4" /> Start building for free
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-slate-600 text-xs">or continue with</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: 'Google', icon: '🇬', bg: 'from-red-600 to-orange-500' },
                      { name: 'GitHub', icon: '⬡', bg: 'from-slate-700 to-slate-900' },
                    ].map(({ name, bg }) => (
                      <motion.button
                        key={name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                      >
                        {name}
                      </motion.button>
                    ))}
                  </div>

                  {/* Trust signals */}
                  <div className="mt-5 pt-5 border-t border-white/8 flex items-center gap-4">
                    <div className="flex -space-x-1.5">
                      {[35, 48, 62].map((n, i) => (
                        <img key={i} src={`https://i.pravatar.cc/32?img=${n}`} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-[#0d0f1a]" />
                      ))}
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      <span className="text-slate-300 font-semibold">2,400 teams</span> signed up this month
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER — Premium dark
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#020509] border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-5 md:px-8">
          {/* Top row — logo + newsletter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/5">
            <div className="space-y-3">
              <Logo variant="light" />
              <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
                The workspace where ambitious teams ship their best work.
              </p>
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] font-semibold">All systems operational</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="w-full md:w-auto">
              <p className="text-slate-300 font-semibold text-sm mb-1">Product updates, zero noise.</p>
              <p className="text-slate-600 text-xs mb-3">Join 8,000+ subscribers. Unsubscribe anytime.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 md:w-60 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Subscribe
                </motion.button>
              </div>
            </div>
          </div>

          {/* Links columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-white/5">
            {[
              { heading: 'Product', links: ['Features','Integrations','Pricing','Changelog','Roadmap','Security'] },
              { heading: 'Solutions', links: ['Engineering Teams','Startups','Enterprise','Agencies','Remote Teams'] },
              { heading: 'Resources', links: ['Documentation','API Reference','Blog','Community','Tutorials','Webinars'] },
              { heading: 'Company', links: ['About','Careers','Press','Partners','Contact'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-slate-300 text-xs font-black uppercase tracking-widest mb-4">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 text-sm hover:text-slate-200 transition-colors group flex items-center gap-1">
                        {link}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <p className="text-slate-600 text-xs">© 2025 ProjectGo, Inc. All rights reserved.</p>
              <div className="hidden md:flex items-center gap-4">
                {['Privacy','Terms','Cookies','Acceptable Use'].map(l => (
                  <a key={l} href="#" className="text-slate-600 text-xs hover:text-slate-400 transition-colors">{l}</a>
                ))}
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { label: '𝕏', href: '#' },
                { label: 'in', href: '#' },
                { label: '◎', href: '#' },
                { label: '▶', href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all text-xs font-bold"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </footer>

      {/* ── Back to top ── */}
      <AnimatePresence>
        {backToTopVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-colors cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
