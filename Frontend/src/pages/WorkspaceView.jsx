import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Folder, Clock, Users, CheckCircle, User,
  Settings, LogOut, ChevronDown, ChevronRight, Star, Bell,
  Activity, SlidersHorizontal, PlusCircle, Calendar, Grid,
  Sparkles, FileText, Mail, AlertTriangle, ArrowRight, TrendingUp,
  BarChart3, Target, Zap, Code, Megaphone, Lightbulb, Palette,
  Check, Circle, AlertCircle, BookOpen, Hash, ExternalLink,
  MoreHorizontal, Layers, Globe, Lock
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Avatar, Badge, Dropdown, EmptyState } from '../components/ui';

const memberAvatars = {
  u1: "https://i.pravatar.cc/80?img=12",
  u2: "https://i.pravatar.cc/80?img=47",
  u3: "https://i.pravatar.cc/80?img=15",
};

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent', dot: 'bg-red-500', chip: 'bg-red-50 text-red-600 border-red-100' },
  HIGH: { label: 'High', dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-600 border-orange-100' },
  MEDIUM: { label: 'Medium', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600 border-amber-100' },
  LOW: { label: 'Low', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const STATUS_CONFIG = {
  COMPLETED: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  IN_PROGRESS: { label: 'Active', color: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  TO_DO: { label: 'Todo', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  BACKLOG: { label: 'Backlog', color: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const WorkspaceView = () => {
  const { workspaces, selectWorkspace, activeWorkspace, globalSearchQuery } = useWorkspace();
  const { tasks } = useTask();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [homeActiveTab, setHomeActiveTab] = useState('Primary');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (location.state?.initialTab) setActiveTab(location.state.initialTab);
  }, [location.state]);

  // Live clock for greeting
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleSelect = (id) => {
    selectWorkspace(id);
    navigate(`/workspace/${id}/kanban`);
  };

  // Real computed stats from task data
  const totalTasks = tasks.length;
  const completedT = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressT = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentT = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const velocity = totalTasks > 0 ? Math.round((completedT / totalTasks) * 100) : 0;

  const getWorkspaceStats = (wId) => {
    const wTasks = tasks.filter(t => t.workspaceId === wId);
    const total = wTasks.length;
    const done = wTasks.filter(t => t.status === 'COMPLETED').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  };

  const WORKSPACE_CONFIGS = [
    { Icon: Code, bg: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', role: 'ADMIN' },
    { Icon: Megaphone, bg: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', role: 'MEMBER' },
    { Icon: Lightbulb, bg: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', role: 'ADMIN' },
    { Icon: Palette, bg: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', role: 'MEMBER' },
    { Icon: Users, bg: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500', role: 'MEMBER' },
  ];

  const getWorkspaceConfig = (name, idx) => {
    const n = name.toLowerCase();
    if (n.includes('engine') || n.includes('tech') || n.includes('backend')) return WORKSPACE_CONFIGS[0];
    if (n.includes('market') || n.includes('campaign') || n.includes('ops')) return WORKSPACE_CONFIGS[1];
    if (n.includes('product') || n.includes('project') || n.includes('road')) return WORKSPACE_CONFIGS[2];
    if (n.includes('design') || n.includes('ui') || n.includes('ux')) return WORKSPACE_CONFIGS[3];
    return WORKSPACE_CONFIGS[idx % WORKSPACE_CONFIGS.length];
  };

  const filteredWorkspaces = workspaces.filter(w => {
    const query = globalSearchQuery || searchQuery;
    const matchSearch = (w.name || '').toLowerCase().includes(query.toLowerCase());
    const matchFilter = filterType === 'All' || (w.visibility || '').toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchFilter;
  });

  const homeFilteredTasks = tasks.filter(t => {
    let matchTab = true;
    if (homeActiveTab === 'Primary') matchTab = t.status !== 'COMPLETED';
    else if (homeActiveTab === 'Other') matchTab = t.priority === 'LOW' || !t.priority;
    else if (homeActiveTab === 'Later') matchTab = t.status === 'BACKLOG' || !t.dueDate;
    else if (homeActiveTab === 'Cleared') matchTab = t.status === 'COMPLETED';
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchSearch = !globalSearchQuery || (t.title || '').toLowerCase().includes(globalSearchQuery.toLowerCase());
    return matchTab && matchPriority && matchSearch;
  });

  const recentTasks = [...tasks]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  const STAT_CARDS = [
    {
      label: 'Total Tasks', value: totalTasks, icon: Layers, trend: '+12% this week',
      trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100',
    },
    {
      label: 'Completed', value: completedT, icon: CheckCircle, trend: `${velocity}% completion rate`,
      trendUp: true, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
    },
    {
      label: 'In Progress', value: inProgressT, icon: Activity, trend: 'Currently active',
      trendUp: null, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
    },
    {
      label: 'High Priority', value: urgentT, icon: AlertCircle, trend: 'Need attention',
      trendUp: false, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100',
    },
  ];

  // Calendar helpers
  const calMonth = now;
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const todayDate = now.getDate();
  const monthStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + homeActiveTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto"
        >

          {/* ── HOME ── */}
          {activeTab === 'Home' && (
            <div className="p-6 space-y-5 max-w-full">
              {/* Greeting Banner */}
              <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-2xl p-6 text-white flex items-center justify-between shadow-elevated overflow-hidden relative">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 75% 50%, rgba(167,139,250,0.15) 0%, transparent 60%)' }} />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative">
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">{greeting} 👋</p>
                  <h1 className="text-2xl font-black mt-1 leading-tight tracking-tight">{currentUser?.name?.split(' ')[0] || 'Team'}</h1>
                  <p className="text-indigo-200/80 text-sm mt-2">
                    <span className="text-white font-semibold">{inProgressT}</span> tasks in progress
                    {' · '}
                    <span className="text-white font-semibold">{urgentT}</span> urgent
                  </p>
                </div>
                <div className="relative flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-3xl font-black leading-none">{velocity}%</div>
                    <div className="text-indigo-300 text-xs font-medium tracking-wide mt-0.5">Sprint velocity</div>
                  </div>
                  <div className="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${velocity}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <span className="text-indigo-300/70 text-[10px] font-medium">{completedT} of {totalTasks} tasks done</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className={`bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-all duration-200 ${s.border}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center shrink-0`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-black text-gray-900 leading-none">{s.value}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5 truncate">{s.label}</div>
                      <div className={`text-[10px] font-semibold mt-1 ${s.trendUp === true ? 'text-emerald-600' : s.trendUp === false ? 'text-rose-500' : 'text-gray-400'}`}>
                        {s.trend}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Two-column layout: Tasks + Recent Activity */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Tasks Panel */}
                <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">My Tasks</span>
                      <div className="flex gap-0.5">
                        {['Primary', 'Other', 'Later', 'Cleared'].map(t => (
                          <button
                            key={t}
                            onClick={() => setHomeActiveTab(t)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${homeActiveTab === t
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Dropdown
                      align="right"
                      width="w-36"
                      trigger={
                        <button className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg cursor-pointer">
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>{priorityFilter === 'All' ? 'Priority' : priorityFilter.charAt(0) + priorityFilter.slice(1).toLowerCase()}</span>
                          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                      }
                    >
                      {['All', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                        <Dropdown.Item key={p} onClick={() => setPriorityFilter(p)}>
                          {p === 'All' ? 'All Priority' : p.charAt(0) + p.slice(1).toLowerCase()}
                        </Dropdown.Item>
                      ))}
                    </Dropdown>
                  </div>

                  {homeFilteredTasks.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {homeFilteredTasks.slice(0, 10).map((t, idx) => {
                        const pc = PRIORITY_CONFIG[t.priority];
                        const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG['TO_DO'];
                        return (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => t.workspaceId && handleSelect(t.workspaceId)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer group transition-colors"
                          >
                            {/* Priority dot */}
                            <div className={`w-2 h-2 rounded-full shrink-0 ${pc?.dot || 'bg-gray-300'}`} />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors truncate">{t.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">
                                  {workspaces.find(w => w.id === t.workspaceId)?.name || 'Default'}
                                </span>
                                {t.dueDate && (
                                  <>
                                    <span className="text-gray-200">·</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />{t.dueDate}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {pc && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pc.chip}`}>
                                  {pc.label}
                                </span>
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${sc.color}`}>
                                {sc.label}
                              </span>
                              <img
                                src={memberAvatars[t.assigneeId || 'u1']}
                                alt=""
                                className="w-6 h-6 rounded-lg border border-gray-200 object-cover"
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                        <CheckCircle className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No tasks here</p>
                      <p className="text-xs text-gray-400 mt-1">Create a task or change your filter</p>
                    </div>
                  )}

                  {homeFilteredTasks.length > 10 && (
                    <div className="px-5 py-3 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/workspace/${activeWorkspace?.id || activeWorkspace?._id}/kanban`)}
                        className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1.5"
                      >
                        View all {homeFilteredTasks.length} tasks <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right sidebar: quick actions + activity */}
                <div className="flex flex-col gap-4">
                  {/* Quick Actions */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-4">
                    <p className="eyebrow mb-3">Quick Actions</p>
                    <div className="space-y-1">
                      {[
                        { icon: Plus, label: 'New Task', action: () => activeWorkspace?.id ? navigate(`/workspace/${activeWorkspace.id}/kanban`) : navigate('/create-workspace'), color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { icon: PlusCircle, label: 'New Space', action: () => navigate('/create-workspace'), color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Users, label: 'Invite Member', action: () => activeWorkspace?.id ? navigate(`/workspace/${activeWorkspace.id}/invite`) : navigate('/create-workspace'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { icon: Settings, label: 'Settings', action: () => activeWorkspace?.id ? navigate(`/workspace/${activeWorkspace.id}/settings`) : navigate('/create-workspace'), color: 'text-gray-500', bg: 'bg-gray-100' },
                      ].map(a => (
                        <button
                          key={a.label}
                          onClick={a.action}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-left group"
                        >
                          <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center shrink-0`}>
                            <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                          </div>
                          <span className="text-sm font-medium">{a.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workload Distribution */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-4">
                    <p className="eyebrow mb-3">Workload</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Completed', count: completedT, color: 'bg-emerald-500' },
                        { label: 'In Progress', count: inProgressT, color: 'bg-indigo-500' },
                        { label: 'Pending', count: totalTasks - completedT - inProgressT, color: 'bg-gray-200' },
                      ].map(s => {
                        const pct = totalTasks > 0 ? Math.round((s.count / totalTasks) * 100) : 0;
                        return (
                          <div key={s.label}>
                            <div className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
                              <span>{s.label}</span>
                              <span className="text-gray-400">{s.count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className={`h-full ${s.color} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Spaces */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-4">
                    <p className="eyebrow mb-3">Spaces</p>
                    <div className="space-y-0.5">
                      {workspaces.slice(0, 4).map((w, i) => {
                        const cfg = getWorkspaceConfig(w.name, i);
                        const { total } = getWorkspaceStats(w.id);
                        return (
                          <button
                            key={w.id}
                            onClick={() => handleSelect(w.id)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 group transition-colors text-left"
                          >
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                              <cfg.Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-700 transition-colors">{w.name}</p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{total}</span>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => navigate('/create-workspace')}
                        className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 rounded-xl border border-dashed border-gray-200 hover:border-indigo-400 text-gray-400 hover:text-indigo-600 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> New Space
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SPACES ── */}
          {activeTab === 'Spaces' && (
            <div className="p-6 space-y-5 max-w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Workspaces</h1>
                  <p className="text-sm text-gray-500 mt-1">All your project workspaces in one place.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-gray-200 p-1 rounded-xl shadow-xs gap-0.5">
                    {['All', 'Public', 'Private'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${filterType === type ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" icon={Plus} onClick={() => navigate('/create-workspace')}>
                    New Space
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => navigate('/create-workspace')}
                  className="bg-white border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-center items-center text-center group min-h-[185px] shadow-card"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">New Workspace</p>
                  <p className="text-xs text-gray-400 mt-1">Create a project hub for your team</p>
                </motion.div>

                {filteredWorkspaces.map((w, index) => {
                  const { total, done, pct } = getWorkspaceStats(w.id);
                  const cfg = getWorkspaceConfig(w.name, index);
                  return (
                    <motion.div
                      key={w.id}
                      whileHover={{ y: -2 }}
                      onClick={() => handleSelect(w.id)}
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 cursor-pointer transition-all flex flex-col gap-4 min-h-[185px] shadow-card hover:shadow-card-hover group"
                    >
                      <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                          <cfg.Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-500">
                            {w.visibility || 'Private'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${w.userRole === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                            {w.userRole || 'Member'}
                          </span>
                          {w.userRole === 'Admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/workspace/${w.id}/settings`);
                              }}
                              className="p-1 rounded-md text-gray-400 hover:text-indigo-650 hover:bg-slate-100 transition-all cursor-pointer"
                              title="Workspace Settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700 transition-colors truncate">{w.name}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{w.description || 'No description.'}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{w.members?.length || 3} members</span>
                          <span>{done}/{total} done</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full ${cfg.bar} rounded-full`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PLANNER ── */}
          {activeTab === 'Planner' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">Sprint Calendar</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })} — {tasks.filter(t => t.dueDate?.startsWith(monthStr)).length} tasks scheduled
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate(`/workspace/${activeWorkspace?.id || activeWorkspace?._id}/kanban`)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
                </Button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2.5 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {Array(firstDay).fill(null).map((_, i) => (
                    <div key={`e${i}`} className="min-h-[90px] border-b border-r border-slate-50 bg-slate-50/30" />
                  ))}
                  {Array(daysInMonth).fill(null).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === todayDate;
                    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                    return (
                      <div
                        key={day}
                        className={`min-h-[90px] p-1.5 border-b border-r border-slate-100 flex flex-col transition-colors hover:bg-slate-50/50 ${isToday ? 'bg-violet-50/30' : ''}`}
                      >
                        <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-[#5f35f5] text-white' : 'text-slate-500'
                          }`}>
                          {day}
                        </span>
                        <div className="space-y-0.5 overflow-hidden flex-1">
                          {dayTasks.slice(0, 3).map(task => {
                            const pc = PRIORITY_CONFIG[task.priority];
                            return (
                              <div
                                key={task.id}
                                onClick={() => task.workspaceId && handleSelect(task.workspaceId)}
                                className={`text-[9px] font-bold px-1 py-0.5 rounded truncate cursor-pointer transition-colors ${pc ? `border ${pc.chip}` : 'bg-violet-50 text-violet-700 border border-violet-100'
                                  }`}
                              >
                                {task.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <div className="text-[9px] text-slate-400 font-bold px-1">+{dayTasks.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TEAMS ── */}
          {activeTab === 'Teams' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">Team Members</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage roles, permissions, and collaboration access.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/workspace/${activeWorkspace?.id || activeWorkspace?._id}/invite`)
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Invite Member
                </Button>
              </div>

              {/* Team stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Members', value: 3, icon: Users, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Active Now', value: 2, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pending Invites', value: 0, icon: Mail, color: 'text-amber-600 bg-amber-50' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{s.value}</div>
                      <div className="text-[10px] font-semibold text-slate-400">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="grid grid-cols-12 gap-0 px-5 py-2.5 border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <div className="col-span-4">Member</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Tasks</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    { name: 'Mohan Kumar', email: 'mohan@company.com', role: 'Owner', status: 'Active', id: 'u1' },
                    { name: 'Sarah Connor', email: 'sarah@company.com', role: 'Admin', status: 'Active', id: 'u2' },
                    { name: 'David Park', email: 'david@company.com', role: 'Member', status: 'Idle', id: 'u3' },
                  ].map(m => {
                    const memberTasks = tasks.filter(t => t.assigneeId === m.id).length;
                    return (
                      <div key={m.id} className="grid grid-cols-12 gap-0 px-5 py-3 hover:bg-slate-50/50 transition-colors items-center group">
                        <div className="col-span-4 flex items-center gap-2.5">
                          <div className="relative">
                            <img src={memberAvatars[m.id]} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">{m.name}</span>
                        </div>
                        <div className="col-span-3 text-[11px] text-slate-500 font-medium truncate">{m.email}</div>
                        <div className="col-span-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.role === 'Owner' ? 'bg-violet-50 text-[#5f35f5]' :
                            m.role === 'Admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>{m.role}</span>
                        </div>
                        <div className="col-span-2 text-[11px] font-bold">
                          <span className={`flex items-center gap-1 ${m.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            {m.status}
                          </span>
                        </div>
                        <div className="col-span-1 text-xs font-bold text-slate-500">{memberTasks}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── DOCS ── */}
          {activeTab === 'Docs' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">Docs & Specs</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Project documentation, specs, and release notes.</p>
                </div>
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New Doc
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'API Gateway Specs', desc: 'Detailed endpoint routing configurations for the backend proxy gateway setup.', date: '3 hours ago', tag: 'Architecture', icon: Code, color: 'bg-blue-50 text-blue-600' },
                  { title: 'Sprint 24 Roadmap', desc: 'Goals, features, and key milestone dates for the current project release cycle.', date: 'Yesterday', tag: 'Planning', icon: Target, color: 'bg-violet-50 text-violet-600' },
                  { title: 'Design Tokens', desc: 'Branding details, color codes, border radius specs, and icons references.', date: '3 days ago', tag: 'Design System', icon: Palette, color: 'bg-rose-50 text-rose-500' },
                  { title: 'Onboarding Guide', desc: 'Step-by-step guide for new team members to get started with the platform.', date: '1 week ago', tag: 'Team', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
                  { title: 'Release Notes v2.4', desc: 'Changelog and upgrade notes for the latest production deployment.', date: '2 weeks ago', tag: 'Release', icon: Zap, color: 'bg-amber-50 text-amber-600' },
                  { title: 'Analytics Dashboard', desc: 'Metrics tracking setup, KPIs, and how to read velocity charts.', date: '3 weeks ago', tag: 'Analytics', icon: BarChart3, color: 'bg-sky-50 text-sky-600' },
                ].map((doc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-8 h-8 rounded-lg ${doc.color} flex items-center justify-center`}>
                        <doc.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">{doc.tag}</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#5f35f5] transition-colors">{doc.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{doc.desc}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2 mt-auto">
                      <span>Updated {doc.date}</span>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activeTab === 'Dashboard' && (
            <div className="p-5 space-y-4">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Sprint Analytics</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Live metrics and workload indicators for your team.</p>
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Sprint Velocity', value: `${velocity}%`, sub: velocity > 70 ? '↑ On track' : 'Needs attention', color: 'text-violet-600 bg-violet-50', positive: velocity > 70 },
                  { label: 'Total Tasks', value: totalTasks, sub: `${inProgressT} active`, color: 'text-blue-600 bg-blue-50', positive: true },
                  { label: 'Completed', value: completedT, sub: `${velocity}% completion rate`, color: 'text-emerald-600 bg-emerald-50', positive: true },
                  { label: 'Avg Cycle Time', value: '4.2d', sub: '↓ 1.8d faster', color: 'text-amber-600 bg-amber-50', positive: true },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
                  >
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
                    <p className={`text-[10px] font-bold mt-1 ${s.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{s.sub}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Workload breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Task Workload Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Completed', count: completedT, color: 'bg-emerald-500' },
                      { name: 'In Progress', count: inProgressT, color: 'bg-violet-500' },
                      { name: 'Todo', count: tasks.filter(t => t.status === 'TO_DO').length, color: 'bg-blue-400' },
                      { name: 'Backlog', count: tasks.filter(t => t.status === 'BACKLOG').length, color: 'bg-slate-200' },
                    ].map((s, i) => {
                      const pct = totalTasks > 0 ? Math.round((s.count / totalTasks) * 100) : 0;
                      return (
                        <div key={s.name}>
                          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${s.color}`} />
                              <span>{s.name}</span>
                            </div>
                            <span className="text-slate-400">{s.count} tasks ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full ${s.color} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Priority Distribution</p>
                  <div className="space-y-3">
                    {Object.entries(PRIORITY_CONFIG).map(([key, pc], i) => {
                      const count = tasks.filter(t => t.priority === key).length;
                      const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                              <span>{pc.label}</span>
                            </div>
                            <span className="text-slate-400">{count} tasks ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full ${pc.dot} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Per-workspace breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Workspace Overview</p>
                <div className="space-y-3">
                  {workspaces.map((w, i) => {
                    const { total, done, pct } = getWorkspaceStats(w.id);
                    const cfg = getWorkspaceConfig(w.name, i);
                    return (
                      <div key={w.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleSelect(w.id)}>
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <cfg.Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px] font-bold text-slate-700 group-hover:text-[#5f35f5] truncate">{w.name}</p>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">{done}/{total} · {pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full ${cfg.bar} rounded-full`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceView;
