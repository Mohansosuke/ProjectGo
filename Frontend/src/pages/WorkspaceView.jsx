import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Folder, Clock, Users, CheckCircle, User,
  Settings, LogOut, ChevronDown, ChevronRight, Star, Bell,
  Activity, SlidersHorizontal, PlusCircle, Calendar, Grid,
  Sparkles, FileText, Mail, AlertTriangle, ArrowRight, TrendingUp,
  BarChart3, Target, Zap, Code, Megaphone, Lightbulb, Palette,
  Check, Circle, AlertCircle, BookOpen, Hash, ExternalLink,
  MoreHorizontal, Layers, Globe, Lock, UserPlus, Flame,
  CheckCircle2, PlayCircle, AlertOctagon, ArrowUpRight,
  Filter, CheckCheck, RefreshCw
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Avatar, Badge, Dropdown, EmptyState, WorkspaceLogo } from '../components/ui';
import apiClient from '../services/apiClient';

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', dot: 'bg-red-500', chip: 'bg-red-50 text-red-600 border-red-100', color: 'bg-red-500' },
  HIGH: { label: 'High', dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-600 border-orange-100', color: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-600 border-blue-100', color: 'bg-blue-500' },
  LOW: { label: 'Low', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-500 border-gray-200', color: 'bg-gray-400' },
};

export const getTaskPriorityKey = (priority) => {
  const p = (priority || '').toUpperCase();
  if (p === 'CRITICAL' || p === 'URGENT') return 'CRITICAL';
  if (p === 'HIGH') return 'HIGH';
  if (p === 'LOW') return 'LOW';
  return 'MEDIUM';
};

const STATUS_CONFIG = {
  COMPLETED: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  IN_PROGRESS: { label: 'Active', color: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  TO_DO: { label: 'Todo', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  BACKLOG: { label: 'Backlog', color: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
};

// Helper to match a task to the current user (by ID, full name, nickname, email, or u1/Mohan handle)
export const isTaskAssignedToUser = (task, user) => {
  if (!user || !task) return false;

  const userIds = [
    user.id,
    user._id,
    user.uid,
  ].filter(Boolean).map(String);

  // Normalize user names & handles
  const userNames = [
    user.fullName,
    user.name,
    user.nickname,
    user.email,
    user.email?.split('@')?.[0]
  ].filter(Boolean).map(s => String(s).trim().toLowerCase());

  // Check if user is Mohan / Mohanaprasanth / ProjectGo admin handle
  const isMohanUser = userNames.some(n => n.includes('mohan') || n.includes('prasanth'));
  if (isMohanUser) {
    userIds.push('u1');
    userNames.push('mohan');
    userNames.push('mohanaprasanth');
    userNames.push('mohana');
  }

  // 1. Direct ID matches on assignee
  const taskAssigneeId = String(
    task.assignee?._id ||
    task.assignee?.id ||
    task.assigneeId ||
    task.assigneeUser?._id ||
    task.assigneeUser?.id ||
    (typeof task.assignee === 'string' && task.assignee.length > 20 ? task.assignee : '') ||
    ''
  ).trim();

  if (taskAssigneeId && userIds.includes(taskAssigneeId)) return true;

  // 2. Check assignee name / string (e.g. "mohanaprasanth", "Mohan", "u1")
  const taskAssigneeStr = String(
    task.assigneeUser?.fullName ||
    task.assigneeUser?.name ||
    task.assignee?.fullName ||
    task.assignee?.name ||
    task.assigneeName ||
    (typeof task.assignee === 'string' ? task.assignee : '') ||
    ''
  ).trim().toLowerCase();

  if (taskAssigneeStr) {
    if (userIds.map(id => id.toLowerCase()).includes(taskAssigneeStr)) return true;
    if (userNames.some(un => un === taskAssigneeStr || taskAssigneeStr.includes(un) || un.includes(taskAssigneeStr))) {
      return true;
    }
  }

  // 3. Check assignee email
  const taskAssigneeEmail = String(
    task.assigneeUser?.email ||
    task.assignee?.email ||
    ''
  ).trim().toLowerCase();

  if (taskAssigneeEmail && userNames.some(un => un === taskAssigneeEmail || taskAssigneeEmail.includes(un))) {
    return true;
  }

  return false;
};

const WorkspaceView = () => {
  const { workspaces, selectWorkspace, activeWorkspace, globalSearchQuery } = useWorkspace();
  const { tasks, moveTask } = useTask();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [homeActiveTab, setHomeActiveTab] = useState('Primary');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [now, setNow] = useState(new Date());

  // Dashboard specific state
  const [dashboardScope, setDashboardScope] = useState('ALL'); // 'ALL' or workspaceId
  const [dashboardUserMode, setDashboardUserMode] = useState('ME'); // 'ME' (logged in user default) or 'ALL'
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('ALL');
  const [dashboardPriorityFilter, setDashboardPriorityFilter] = useState('ALL');
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [dashboardTimeRange, setDashboardTimeRange] = useState('sprint');
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [hoveredPieSlice, setHoveredPieSlice] = useState(null);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [activeStatusDropdownTaskId, setActiveStatusDropdownTaskId] = useState(null);

  // Real team members state
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  // Teams filter
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [teamFilterQuery, setTeamFilterQuery] = useState('');
  const [appliedTeamFilter, setAppliedTeamFilter] = useState(null); // { type: 'workspace'|'member', id, label }
  const [filterWorkspaceMembers, setFilterWorkspaceMembers] = useState(null); // members for filtered workspace

  useEffect(() => {
    if (location.state?.initialTab) setActiveTab(location.state.initialTab);
  }, [location.state]);

  // Live clock for greeting
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Close member action menu when clicking anywhere outside
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    const timer = setTimeout(() => { document.addEventListener('click', close); }, 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [openMenuId]);

  // Close filter panel when clicking outside
  useEffect(() => {
    if (!showFilterPanel) return;
    const close = (e) => {
      if (!e.target.closest('#teams-filter-panel') && !e.target.closest('#teams-filter-btn')) {
        setShowFilterPanel(false);
      }
    };
    const timer = setTimeout(() => { document.addEventListener('click', close); }, 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [showFilterPanel]);

  // Close workspace scope dropdown when clicking outside
  useEffect(() => {
    if (!showScopeDropdown) return;
    const close = (e) => {
      if (!e.target.closest('#workspace-scope-picker')) {
        setShowScopeDropdown(false);
      }
    };
    const timer = setTimeout(() => { document.addEventListener('click', close); }, 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [showScopeDropdown]);

  // Close quick status dropdown when clicking outside
  useEffect(() => {
    if (!activeStatusDropdownTaskId) return;
    const close = (e) => {
      if (!e.target.closest('#quick-status-popover')) {
        setActiveStatusDropdownTaskId(null);
      }
    };
    const timer = setTimeout(() => { document.addEventListener('click', close); }, 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [activeStatusDropdownTaskId]);

  // When filter workspace changes, fetch its members
  useEffect(() => {
    if (appliedTeamFilter?.type !== 'workspace') {
      setFilterWorkspaceMembers(null);
      return;
    }
    const wsId = appliedTeamFilter.id;
    apiClient.get(`/invitations/workspace/${wsId}`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setFilterWorkspaceMembers(list);
      })
      .catch(() => setFilterWorkspaceMembers([]));
  }, [appliedTeamFilter]);

  // Fetch real team members when Teams tab is active
  useEffect(() => {
    if (activeTab !== 'Teams') return;
    const wsId = activeWorkspace?.id || activeWorkspace?._id;
    if (!wsId) return;
    const load = async () => {
      setTeamLoading(true);
      try {
        const [membersRes, invitesRes] = await Promise.allSettled([
          apiClient.get(`/invitations/workspace/${wsId}`),
          apiClient.get(`/workspaces/${wsId}/invitations`),
        ]);
        if (membersRes.status === 'fulfilled') {
          const list = Array.isArray(membersRes.value.data)
            ? membersRes.value.data
            : (membersRes.value.data?.data || []);
          setTeamMembers(list);
        }
        if (invitesRes.status === 'fulfilled') {
          const inv = Array.isArray(invitesRes.value.data)
            ? invitesRes.value.data
            : (invitesRes.value.data?.data || []);
          setPendingInvitesCount(inv.length);
          setPendingInvites(inv);
        }
      } catch (err) {
        console.error('Failed to load team members:', err);
      } finally {
        setTeamLoading(false);
      }
    };
    load();
  }, [activeTab, activeWorkspace]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleSelect = useCallback((id) => {
    selectWorkspace(id);
    navigate(`/workspace/${id}/kanban`);
  }, [selectWorkspace, navigate]);

  // Filter tasks based on current user mode (defaults to 'ME' for personal perspective)
  const userFilteredTasks = useMemo(() => {
    if (!currentUser) return tasks;
    return tasks.filter(t => isTaskAssignedToUser(t, currentUser));
  }, [tasks, currentUser]);

  const activeModeTasks = dashboardUserMode === 'ME' ? userFilteredTasks : tasks;

  // Real computed stats from task data
  const totalTasks = activeModeTasks.length;
  const completedT = activeModeTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressT = activeModeTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentT = activeModeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const velocity = totalTasks > 0 ? Math.round((completedT / totalTasks) * 100) : 0;

  const getWorkspaceStats = useCallback((wId) => {
    const wTasks = tasks.filter(t => t.workspaceId === wId);
    const total = wTasks.length;
    const done = wTasks.filter(t => t.status === 'COMPLETED').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [tasks]);

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

  const filteredWorkspaces = useMemo(() => workspaces.filter(w => {
    const query = globalSearchQuery || searchQuery;
    const matchSearch = (w.name || '').toLowerCase().includes(query.toLowerCase());
    const matchFilter = filterType === 'All' || (w.visibility || '').toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchFilter;
  }), [workspaces, globalSearchQuery, searchQuery, filterType]);

  const homeFilteredTasks = useMemo(() => activeModeTasks.filter(t => {
    let matchTab = true;
    if (homeActiveTab === 'Primary') matchTab = t.status !== 'COMPLETED';
    else if (homeActiveTab === 'Other') matchTab = getTaskPriorityKey(t.priority) === 'LOW';
    else if (homeActiveTab === 'Later') matchTab = t.status === 'BACKLOG' || !t.dueDate;
    else if (homeActiveTab === 'Cleared') matchTab = t.status === 'COMPLETED';
    const matchPriority = priorityFilter === 'All' || getTaskPriorityKey(t.priority) === getTaskPriorityKey(priorityFilter);
    const matchSearch = !globalSearchQuery || (t.title || '').toLowerCase().includes(globalSearchQuery.toLowerCase());
    return matchTab && matchPriority && matchSearch;
  }), [activeModeTasks, homeActiveTab, priorityFilter, globalSearchQuery]);

  const recentTasks = useMemo(() => [...activeModeTasks]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5), [activeModeTasks]);

  const STAT_CARDS = useMemo(() => [
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
  ], [totalTasks, completedT, inProgressT, urgentT, velocity]);

  // Calendar helpers
  const calMonth = now;
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const todayDate = now.getDate();
  const monthStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}`;

  // Build a map of memberId -> avatarUrl from the real teamMembers API data
  const memberAvatars = useMemo(() => teamMembers.reduce((acc, m) => {
    const id = m.userId || m.id || m._id;
    if (id && (m.avatarUrl || m.avatar)) acc[id] = m.avatarUrl || m.avatar;
    return acc;
  }, {}), [teamMembers]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <AnimatePresence mode="sync">
        <motion.div
          key={activeTab + homeActiveTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto"
        >

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
                        <WorkspaceLogo workspace={w} size="md" className="shrink-0 ring-2 ring-slate-100/80" />
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
                <div className="flex items-center gap-2">
                  {/* Filter button */}
                  <div className="relative">
                    <button
                      id="teams-filter-btn"
                      onClick={() => setShowFilterPanel(p => !p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        appliedTeamFilter
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                      title="Filter members"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{appliedTeamFilter ? appliedTeamFilter.label : 'Filter'}</span>
                      {appliedTeamFilter && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppliedTeamFilter(null);
                            setTeamFilterQuery('');
                          }}
                          className="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold cursor-pointer text-xs"
                          title="Remove filter"
                        >
                          ×
                        </span>
                      )}
                    </button>

                    {/* Filter floating panel */}
                    {showFilterPanel && (
                      <div
                        id="teams-filter-panel"
                        className="absolute right-0 top-full mt-2 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Filter Team Members</p>
                          <button
                            onClick={() => setShowFilterPanel(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs p-1"
                          >
                            ×
                          </button>
                        </div>

                        {/* Currently Active Filter Badge */}
                        {appliedTeamFilter ? (
                          <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                                {appliedTeamFilter.type === 'workspace' ? 'Workspace' : 'Member'}
                              </span>
                              <span className="text-xs font-bold text-indigo-900 truncate">
                                {appliedTeamFilter.label}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setAppliedTeamFilter(null);
                                setTeamFilterQuery('');
                              }}
                              className="ml-2 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                              title="Remove this filter"
                            >
                              <span>Remove</span>
                              <span className="text-sm font-bold leading-none">×</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mb-2 text-[11px] text-slate-400 font-medium">
                            Select a workspace or teammate to filter by:
                          </div>
                        )}

                        {/* Search input */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search workspace or member name…"
                            value={teamFilterQuery}
                            onChange={e => setTeamFilterQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium"
                          />
                          {teamFilterQuery && (
                            <button
                              onClick={() => setTeamFilterQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Workspaces list */}
                        {(() => {
                          const filteredWs = workspaces.filter(w =>
                            !teamFilterQuery.trim() || w.name.toLowerCase().includes(teamFilterQuery.toLowerCase())
                          );
                          if (filteredWs.length === 0) return null;
                          return (
                            <div className="mb-3">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>Filter By Workspace</span>
                                <span className="text-slate-300 font-normal">{filteredWs.length} available</span>
                              </p>
                              <div className="max-h-28 overflow-y-auto space-y-0.5 scrollbar-thin">
                                {filteredWs.map(w => {
                                  const isSelected = appliedTeamFilter?.type === 'workspace' && appliedTeamFilter.id === w.id;
                                  return (
                                    <button
                                      key={w.id}
                                      onClick={() => {
                                        setAppliedTeamFilter({ type: 'workspace', id: w.id, label: w.name });
                                        setShowFilterPanel(false);
                                        setTeamFilterQuery('');
                                      }}
                                      className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                                          : 'hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <Layers className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                                        <span className="truncate">{w.name}</span>
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Member suggestions */}
                        {(() => {
                          const filteredMem = teamMembers.filter(m =>
                            !teamFilterQuery.trim() || (m.name || m.email || '').toLowerCase().includes(teamFilterQuery.toLowerCase())
                          );
                          if (filteredMem.length === 0) return null;
                          return (
                            <div className="mb-2">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>Filter By Teammate</span>
                                <span className="text-slate-300 font-normal">{filteredMem.length} members</span>
                              </p>
                              <div className="max-h-32 overflow-y-auto space-y-0.5 scrollbar-thin">
                                {filteredMem.map(m => {
                                  const id = m.id || m._id;
                                  const isSelected = appliedTeamFilter?.type === 'member' && appliedTeamFilter.id === id;
                                  return (
                                    <button
                                      key={id}
                                      onClick={() => {
                                        setAppliedTeamFilter({ type: 'member', id, label: m.name || m.email });
                                        setShowFilterPanel(false);
                                        setTeamFilterQuery('');
                                      }}
                                      className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                                          : 'hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        {m.avatar ? (
                                          <img src={m.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <User className="w-3 h-3 text-slate-500" />
                                          </div>
                                        )}
                                        <div className="truncate">
                                          <span className="truncate block leading-tight">{m.name || m.email}</span>
                                          {m.name && m.email && (
                                            <span className="text-[10px] text-slate-400 font-normal truncate block">{m.email}</span>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Empty state when query matches nothing */}
                        {teamFilterQuery.trim() &&
                          workspaces.filter(w => w.name.toLowerCase().includes(teamFilterQuery.toLowerCase())).length === 0 &&
                          teamMembers.filter(m => (m.name || m.email || '').toLowerCase().includes(teamFilterQuery.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-400">
                            No workspaces or teammates matching "{teamFilterQuery}"
                          </div>
                        )}

                        <div className="border-t border-slate-100 mt-2.5 pt-2.5 flex justify-between items-center">
                          {appliedTeamFilter ? (
                            <button
                              onClick={() => {
                                setAppliedTeamFilter(null);
                                setTeamFilterQuery('');
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                            >
                              Clear filter
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">No filter active</span>
                          )}
                          <button
                            onClick={() => setShowFilterPanel(false)}
                            className="text-[11px] px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
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
              </div>

              {/* Team stats — real data */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Members', value: teamMembers.length, icon: Users, color: 'text-violet-600 bg-violet-50', clickable: false },
                  { label: 'Active Now', value: teamMembers.filter(m => m.isOnline).length, icon: Activity, color: 'text-emerald-600 bg-emerald-50', clickable: false },
                  { label: 'Pending Invites', value: pendingInvitesCount, icon: Mail, color: 'text-amber-600 bg-amber-50', clickable: activeWorkspace?.userRole === 'Admin' },
                ].map(s => (
                  <div
                    key={s.label}
                    onClick={() => s.clickable && setShowPendingModal(true)}
                    className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs ${s.clickable ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{teamLoading ? '—' : s.value}</div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {s.label}{s.clickable ? ' · click to view' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="grid grid-cols-12 gap-0 px-5 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-2xl text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <div className="col-span-4">Member</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Tasks</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {teamLoading ? (
                    // Skeleton loading
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`sk-${i}`} className="grid grid-cols-12 gap-0 px-5 py-3 items-center animate-pulse">
                        <div className="col-span-4 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200" />
                          <div className="h-2.5 w-24 rounded bg-slate-200" />
                        </div>
                        <div className="col-span-3"><div className="h-2.5 w-32 rounded bg-slate-200" /></div>
                        <div className="col-span-2"><div className="h-4 w-12 rounded bg-slate-200" /></div>
                        <div className="col-span-2"><div className="h-2.5 w-10 rounded bg-slate-200" /></div>
                        <div className="col-span-1"><div className="h-2.5 w-4 rounded bg-slate-200" /></div>
                      </div>
                    ))
                  ) : teamMembers.length === 0 ? (
                    <div className="py-14 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500">No members yet</p>
                      <p className="text-[11px] text-slate-400">Invite teammates to get started.</p>
                    </div>
                  ) : (() => {
                    // Determine which list to show based on active filter
                    let displayedMembers = teamMembers;
                    if (appliedTeamFilter?.type === 'workspace' && filterWorkspaceMembers !== null) {
                      displayedMembers = filterWorkspaceMembers;
                    } else if (appliedTeamFilter?.type === 'member') {
                      displayedMembers = teamMembers.filter(m =>
                        (m.id || m._id) === appliedTeamFilter.id
                      );
                    }

                    if (displayedMembers.length === 0) {
                      return (
                        <div className="py-10 flex flex-col items-center justify-center gap-2">
                          <Search className="w-5 h-5 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-400">No members match this filter</p>
                          <button
                            onClick={() => setAppliedTeamFilter(null)}
                            className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                          >Clear filter</button>
                        </div>
                      );
                    }

                    return displayedMembers.map(m => {

                      const memberId = m.id || m._id;
                      const memberTasks = tasks.filter(t =>
                        String(t.assignee || t.assigneeId) === String(memberId)
                      ).length;
                      const isOnline = !!m.isOnline;
                      const initials = (m.name || m.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      const isAdmin = activeWorkspace?.userRole === 'Admin';
                      const isOwnerRow = m.role === 'Owner';
                      const canRemove = isAdmin && !isOwnerRow;

                      const handleRemove = async () => {
                        setOpenMenuId(null);
                        if (!window.confirm(`Remove ${m.name || m.email} from this workspace?`)) return;
                        const wsId = activeWorkspace?.id || activeWorkspace?._id;
                        setRemovingMemberId(memberId);
                        try {
                          await apiClient.delete(`/invitations/workspace/${wsId}/member/${memberId}`);
                          setTeamMembers(prev => prev.filter(x => (x.id || x._id) !== memberId));
                        } catch (err) {
                          alert(err?.response?.data?.message || 'Failed to remove member');
                        } finally {
                          setRemovingMemberId(null);
                        }
                      };

                      return (
                        <div key={memberId} className="relative grid grid-cols-12 gap-0 px-5 py-3 hover:bg-slate-50/50 transition-colors items-center group">
                          <div className="col-span-4 flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              {m.avatar ? (
                                <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center border border-slate-200">
                                  {initials}
                                </div>
                              )}
                              <span
                                title={isOnline ? 'Online' : 'Offline'}
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate">{m.name || m.email}</span>
                          </div>
                          <div className="col-span-3 text-[11px] text-slate-500 font-medium truncate">{m.email}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.role === 'Owner' ? 'bg-violet-50 text-[#5f35f5]' :
                                m.role === 'Admin' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                              }`}>{m.role || 'Member'}</span>
                          </div>
                          <div className="col-span-2 text-[11px] font-bold">
                            <span className={`flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                            {!isOnline && m.lastSeen && (
                              <span className="text-[13px] text-slate-300 font-medium mt-0.5 block leading-tight">
                                {formatLastSeen(m.lastSeen)}
                              </span>
                            )}
                          </div>
                          {/* Tasks */}
                          <div className="col-span-1 text-xs font-bold text-slate-500">{memberTasks}</div>

                          {/* Three-dot remove menu — only for admins on non-owner rows */}
                          {canRemove ? (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                              <div className="relative">
                                <button
                                  disabled={removingMemberId === memberId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(prev => prev === memberId ? null : memberId);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer border border-transparent hover:border-rose-100"
                                  title="Member options"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {openMenuId === memberId && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
                                  >
                                    <button
                                      onClick={handleRemove}
                                      disabled={removingMemberId === memberId}
                                      className="w-full text-left px-3 py-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <UserPlus className="w-3 h-3 rotate-180" />
                                      {removingMemberId === memberId ? 'Removing…' : 'Remove from workspace'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Pending Invites Modal — admin only */}
              {showPendingModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowPendingModal(false)}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Pending Invitations</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">{pendingInvitesCount} invite{pendingInvitesCount !== 1 ? 's' : ''} awaiting response</p>
                      </div>
                      <button
                        onClick={() => setShowPendingModal(false)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                      {pendingInvites.length === 0 ? (
                        <div className="py-10 text-center">
                          <Mail className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-medium">No pending invites</p>
                        </div>
                      ) : (
                        pendingInvites.map((inv, i) => (
                          <div key={inv._id || i} className="flex items-center justify-between px-5 py-3">
                            <div>
                              <p className="text-[12px] font-bold text-slate-800">{inv.email}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Sent {inv.createdAt ? formatLastSeen(inv.createdAt) : '—'}
                                {inv.expiresAt ? ` · expires ${formatLastSeen(inv.expiresAt)}` : ''}
                              </p>
                            </div>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                              Pending
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
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
          {activeTab === 'Dashboard' && (() => {
            // Accessible workspaces for logged-in user
            const currentUserId = String(currentUser?.id || currentUser?._id || '');
            const userAccessibleWorkspaces = workspaces.filter(w => {
              if (!currentUserId) return true;
              const isOwner = String(w.ownerId || w.owner?._id || w.owner || '') === currentUserId;
              const isMember = (w.members || []).some(m => String(m.id || m._id || m) === currentUserId);
              return isOwner || isMember;
            });

            // Tasks scoped by workspace
            const baseTasks = dashboardScope === 'ALL'
              ? tasks.filter(t => userAccessibleWorkspaces.length === 0 || userAccessibleWorkspaces.some(w => w.id === t.workspaceId))
              : tasks.filter(t => t.workspaceId === dashboardScope);

            // Filter tasks based on logged-in user by default (only show all when Team View is explicitly selected)
            const activeScopeTasks = dashboardUserMode === 'ME'
              ? baseTasks.filter(t => isTaskAssignedToUser(t, currentUser))
              : baseTasks;

            const activeScopeWs = workspaces.find(w => w.id === dashboardScope);

            const total = activeScopeTasks.length;
            const completed = activeScopeTasks.filter(t => t.status === 'COMPLETED').length;
            const inProgress = activeScopeTasks.filter(t => t.status === 'IN_PROGRESS').length;
            const todo = activeScopeTasks.filter(t => t.status === 'TO_DO' || t.status === 'TODO').length;
            const backlog = activeScopeTasks.filter(t => t.status === 'BACKLOG' || t.status === 'IN_REVIEW').length;
            const critical = activeScopeTasks.filter(t => getTaskPriorityKey(t.priority) === 'CRITICAL').length;
            const high = activeScopeTasks.filter(t => getTaskPriorityKey(t.priority) === 'HIGH').length;
            const medium = activeScopeTasks.filter(t => getTaskPriorityKey(t.priority) === 'MEDIUM').length;
            const low = activeScopeTasks.filter(t => getTaskPriorityKey(t.priority) === 'LOW').length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Tasks filtered for the radar table
            const radarTasks = activeScopeTasks.filter(t => {
              const matchStatus = dashboardStatusFilter === 'ALL' || t.status === dashboardStatusFilter;
              const matchPriority = dashboardPriorityFilter === 'ALL' || getTaskPriorityKey(t.priority) === dashboardPriorityFilter;
              const matchSearch = !dashboardSearchQuery || (t.title || '').toLowerCase().includes(dashboardSearchQuery.toLowerCase());
              return matchStatus && matchPriority && matchSearch;
            });

            const handleStatusChange = async (taskId, newStatus, e) => {
              e?.stopPropagation?.();
              setMovingTaskId(taskId);
              try {
                if (moveTask) {
                  await moveTask(taskId, newStatus);
                }
              } catch (err) {
                console.error('Failed to change status:', err);
              } finally {
                setMovingTaskId(null);
              }
            };

            const userDisplayName = currentUser?.fullName || currentUser?.name || 'Mohanaprasanth';

            return (
              <div className="p-6 space-y-6 max-w-full">
                {/* ── Top Header & Scope Bar ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <BarChart3 className="w-5 h-5" />
                      </span>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">Workspace Command Center</h1>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Metrics
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {dashboardUserMode === 'ME'
                        ? `Viewing metrics personalized for you (${userDisplayName}).`
                        : 'Viewing overall team workload across workspace tasks.'}
                    </p>
                  </div>

                  {/* Scope & Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* User Mode Toggle: My Tasks vs Team Tasks */}
                    <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                      <button
                        onClick={() => setDashboardUserMode('ME')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          dashboardUserMode === 'ME'
                            ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Show tasks assigned to you"
                      >
                        <span>👤 My Tasks</span>
                        <span className="text-[10px] font-medium opacity-80">
                          ({userDisplayName.split(' ')[0]})
                        </span>
                      </button>
                      <button
                        onClick={() => setDashboardUserMode('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          dashboardUserMode === 'ALL'
                            ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Show all workspace tasks"
                      >
                        <span>👥 Team View</span>
                        <span className="text-[10px] font-medium opacity-80">
                          (All)
                        </span>
                      </button>
                    </div>

                    {/* Workspace Scope Custom Dropdown */}
                    <div className="relative" id="workspace-scope-picker">
                      <button
                        type="button"
                        onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                        className="h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span className="truncate max-w-[170px]">
                          {dashboardScope === 'ALL'
                            ? `🌐 Your Workspaces (${userAccessibleWorkspaces.length})`
                            : `📁 ${userAccessibleWorkspaces.find(w => w.id === dashboardScope)?.name || 'Workspace'}`}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showScopeDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showScopeDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setDashboardScope('ALL');
                                setShowScopeDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                dashboardScope === 'ALL' ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>🌐 Your Workspaces ({userAccessibleWorkspaces.length})</span>
                              {dashboardScope === 'ALL' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <div className="max-h-52 overflow-y-auto">
                              {userAccessibleWorkspaces.map(w => (
                                <button
                                  key={w.id}
                                  onClick={() => {
                                    setDashboardScope(w.id);
                                    setShowScopeDropdown(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    dashboardScope === w.id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span>📁</span>
                                    <span className="truncate">{w.name}</span>
                                  </div>
                                  {dashboardScope === w.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        const targetId = dashboardScope !== 'ALL' ? dashboardScope : (activeWorkspace?.id || userAccessibleWorkspaces[0]?.id);
                        if (targetId) navigate(`/workspace/${targetId}/kanban`);
                        else navigate('/create-workspace');
                      }}
                      className="h-9 px-3 text-xs"
                    >
                      New Task
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={PlusCircle}
                      onClick={() => navigate('/create-workspace')}
                      className="h-9 px-3 text-xs"
                    >
                      New Space
                    </Button>
                  </div>
                </div>

                {/* ── KPI Highlight Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Velocity */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-2xl p-5 text-white shadow-elevated relative overflow-hidden flex flex-col justify-between min-h-[145px]"
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">Sprint Velocity</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                        {rate >= 70 ? 'High Momentum' : rate >= 40 ? 'On Track' : 'In Progress'}
                      </span>
                    </div>

                    <div className="my-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight">{rate}%</span>
                      <span className="text-xs text-indigo-200/80 font-medium">completion rate</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rate}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-indigo-200/70 font-semibold">
                        <span>{completed} completed</span>
                        <span>{total} total tasks</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Active Workload */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[145px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Workload</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="my-2">
                      <div className="text-3xl font-black text-slate-900 tracking-tight">{inProgress + todo}</div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks actively in flight</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs font-semibold">
                      <span className="text-indigo-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> {inProgress} In Progress
                      </span>
                      <span className="text-blue-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" /> {todo} To Do
                      </span>
                    </div>
                  </motion.div>

                  {/* Card 3: Critical Watchlist */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[145px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Critical Priority Radar</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="my-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-rose-600 tracking-tight">{critical + high}</span>
                        {critical > 0 && (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                            {critical} Critical
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks requiring priority focus</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setDashboardPriorityFilter(p => p === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {dashboardPriorityFilter === 'CRITICAL' ? 'Show all priorities' : 'Filter critical items'}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>

                  {/* Card 4: Workspaces & Members */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between min-h-[145px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Workspaces & Team</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="my-2">
                      <div className="text-3xl font-black text-slate-900 tracking-tight">{workspaces.length}</div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Active Project Spaces</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {teamMembers.length || 1} team members
                      </span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {teamMembers.filter(m => m.isOnline).length || 1} online
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* ── Visual Pipelines: Status Flow & Priority Matrix ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ── Status Pipeline (Advance Pie / Donut Chart) ── */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">Execution Pipeline</h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                            Interactive Donut
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Distribution across workflow stages</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {dashboardStatusFilter !== 'ALL' && (
                          <button
                            onClick={() => setDashboardStatusFilter('ALL')}
                            className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            Reset Filter ×
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {total} Total
                        </span>
                      </div>
                    </div>

                    {/* Interactive Donut & Legend Container */}
                    {(() => {
                      const pieItems = [
                        { key: 'COMPLETED', label: 'Completed', count: completed, color: '#10b981', hoverColor: '#059669', dot: 'bg-emerald-500', border: 'border-emerald-500', lightBg: 'bg-emerald-50' },
                        { key: 'IN_PROGRESS', label: 'In Progress', count: inProgress, color: '#6366f1', hoverColor: '#4f46e5', dot: 'bg-indigo-500', border: 'border-indigo-500', lightBg: 'bg-indigo-50' },
                        { key: 'TO_DO', label: 'To Do', count: todo, color: '#3b82f6', hoverColor: '#2563eb', dot: 'bg-blue-400', border: 'border-blue-400', lightBg: 'bg-blue-50' },
                        { key: 'BACKLOG', label: 'Backlog', count: backlog, color: '#94a3b8', hoverColor: '#64748b', dot: 'bg-slate-400', border: 'border-slate-400', lightBg: 'bg-slate-50' },
                      ];

                      // SVG Arc calculations
                      const cx = 100;
                      const cy = 100;
                      const R = 80;
                      const r = 54;
                      let cumulativeAngle = -Math.PI / 2;

                      const slices = pieItems.map(item => {
                        if (total === 0 || item.count === 0) {
                          return { ...item, path: '', pct: 0 };
                        }
                        const sliceAngle = (item.count / total) * 2 * Math.PI;
                        const start = cumulativeAngle;
                        const end = cumulativeAngle + sliceAngle;
                        cumulativeAngle = end;

                        // Slight gap padding between slices
                        const gap = 0.03;
                        const adjStart = start + gap;
                        const adjEnd = Math.max(adjStart, end - gap);

                        const x1 = cx + R * Math.cos(adjStart);
                        const y1 = cy + R * Math.sin(adjStart);
                        const x2 = cx + R * Math.cos(adjEnd);
                        const y2 = cy + R * Math.sin(adjEnd);

                        const ix1 = cx + r * Math.cos(adjEnd);
                        const iy1 = cy + r * Math.sin(adjEnd);
                        const ix2 = cx + r * Math.cos(adjStart);
                        const iy2 = cy + r * Math.sin(adjStart);

                        const largeArc = sliceAngle > Math.PI ? 1 : 0;

                        const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

                        return {
                          ...item,
                          path,
                          pct: Math.round((item.count / total) * 100)
                        };
                      });

                      const activeHover = hoveredPieSlice ? pieItems.find(p => p.key === hoveredPieSlice) : null;
                      const activeFilter = dashboardStatusFilter !== 'ALL' ? pieItems.find(p => p.key === dashboardStatusFilter) : null;
                      const displayTarget = activeHover || activeFilter;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-2">
                          {/* Left: Interactive SVG Donut Chart */}
                          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
                            <div className="relative w-[190px] h-[190px]">
                              <svg viewBox="0 0 200 200" className="w-full h-full transform transition-transform duration-300">
                                {/* Base track circle */}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={(R + r) / 2}
                                  strokeWidth={R - r}
                                  fill="none"
                                  stroke="#f1f5f9"
                                />

                                {total > 0 && slices.map((slice) => {
                                  if (!slice.path) return null;
                                  const isHov = hoveredPieSlice === slice.key;
                                  const isSelected = dashboardStatusFilter === slice.key;

                                  return (
                                    <path
                                      key={slice.key}
                                      d={slice.path}
                                      fill={slice.color}
                                      opacity={hoveredPieSlice && !isHov ? 0.45 : isSelected ? 1 : 0.9}
                                      filter={isHov || isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : undefined}
                                      className="transition-all duration-200 cursor-pointer"
                                      style={{
                                        transformOrigin: `${cx}px ${cy}px`,
                                        transform: isHov ? 'scale(1.04)' : isSelected ? 'scale(1.02)' : 'scale(1)',
                                      }}
                                      onMouseEnter={() => setHoveredPieSlice(slice.key)}
                                      onMouseLeave={() => setHoveredPieSlice(null)}
                                      onClick={() => setDashboardStatusFilter(curr => curr === slice.key ? 'ALL' : slice.key)}
                                    />
                                  );
                                })}
                              </svg>

                              {/* Center Readout inside Donut Hole */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-2">
                                <motion.span
                                  key={displayTarget ? displayTarget.key : 'TOTAL'}
                                  initial={{ scale: 0.85, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-2xl font-black text-slate-900 leading-none"
                                >
                                  {displayTarget ? displayTarget.count : total}
                                </motion.span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1 truncate max-w-[100px]">
                                  {displayTarget ? displayTarget.label : 'Total Tasks'}
                                </span>
                                {total > 0 && (
                                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">
                                    {displayTarget ? `${displayTarget.pct || Math.round((displayTarget.count / total) * 100)}%` : `${rate}% done`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-1.5 text-center">
                              Click any slice or card to filter
                            </span>
                          </div>

                          {/* Right: Rich Interactive Legend with Progress Bars */}
                          <div className="md:col-span-6 space-y-2">
                            {pieItems.map((item) => {
                              const isHov = hoveredPieSlice === item.key;
                              const isSelected = dashboardStatusFilter === item.key;
                              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

                              return (
                                <div
                                  key={item.key}
                                  onMouseEnter={() => setHoveredPieSlice(item.key)}
                                  onMouseLeave={() => setHoveredPieSlice(null)}
                                  onClick={() => setDashboardStatusFilter(curr => curr === item.key ? 'ALL' : item.key)}
                                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20'
                                      : isHov
                                        ? 'border-slate-300 bg-slate-50 shadow-xs'
                                        : 'border-slate-200/70 bg-white hover:bg-slate-50/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2.5 h-2.5 rounded-full ${item.dot} shrink-0`} />
                                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-slate-900">{item.count}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold w-7 text-right">{pct}%</span>
                                    </div>
                                  </div>

                                  {/* Progress micro-bar */}
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: item.color,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Priority Spectrum */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Priority Spectrum</h3>
                        <p className="text-xs text-slate-400 font-medium">Risk and urgency allocation</p>
                      </div>
                      {dashboardPriorityFilter !== 'ALL' && (
                        <button
                          onClick={() => setDashboardPriorityFilter('ALL')}
                          className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'CRITICAL', label: 'Critical', count: critical, color: 'bg-red-500', chip: 'bg-red-50 text-red-700' },
                        { key: 'HIGH', label: 'High', count: high, color: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700' },
                        { key: 'MEDIUM', label: 'Medium', count: medium, color: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700' },
                        { key: 'LOW', label: 'Low', count: low, color: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' },
                      ].map((p, i) => {
                        const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                        const isSelected = dashboardPriorityFilter === p.key;
                        return (
                          <div
                            key={p.key}
                            onClick={() => setDashboardPriorityFilter(curr => curr === p.key ? 'ALL' : p.key)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isSelected ? 'border-indigo-500 bg-indigo-50/40' : 'border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                                <span className="text-slate-800">{p.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900 font-black">{p.count}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">({pct}%)</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.08 }}
                                className={`h-full ${p.color} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Actionable Task Radar (Workable directly from Dashboard!) ── */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
                  {/* Task Radar Toolbar */}
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                        <Target className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Task Radar & Actions</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Update status, inspect assignments, and jump to boards</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search */}
                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={dashboardSearchQuery}
                          onChange={(e) => setDashboardSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      {/* Status Filter Tab Pills */}
                      <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl shadow-xs">
                        {['ALL', 'IN_PROGRESS', 'TO_DO', 'COMPLETED'].map(statusKey => (
                          <button
                            key={statusKey}
                            onClick={() => setDashboardStatusFilter(statusKey)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              dashboardStatusFilter === statusKey
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {statusKey === 'ALL' ? 'All' : statusKey === 'IN_PROGRESS' ? 'Active' : statusKey === 'TO_DO' ? 'Todo' : 'Done'}
                          </button>
                        ))}
                      </div>

                      {(dashboardStatusFilter !== 'ALL' || dashboardPriorityFilter !== 'ALL' || dashboardSearchQuery) && (
                        <button
                          onClick={() => {
                            setDashboardStatusFilter('ALL');
                            setDashboardPriorityFilter('ALL');
                            setDashboardSearchQuery('');
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Rows */}
                  <div className="divide-y divide-slate-100">
                    {radarTasks.length > 0 ? (
                      radarTasks.slice(0, 8).map((task, idx) => {
                        const pc = PRIORITY_CONFIG[getTaskPriorityKey(task.priority)] || PRIORITY_CONFIG.MEDIUM;
                        const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.TO_DO;
                        const taskWs = workspaces.find(w => w.id === task.workspaceId);
                        const isMoving = movingTaskId === task.id;

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => task.workspaceId && handleSelect(task.workspaceId)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 transition-all cursor-pointer group gap-3"
                          >
                            {/* Left info */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {/* Workspace Logo badge */}
                              <WorkspaceLogo workspace={taskWs} size="sm" className="shrink-0 ring-1 ring-slate-200/50" />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${pc.dot}`} />
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                    {task.title}
                                  </h4>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-400">
                                  <span className="font-semibold text-slate-600">
                                    {taskWs?.name || 'Workspace'}
                                  </span>
                                  {task.dueDate && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-medium text-slate-500">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        Due {task.dueDate}
                                      </span>
                                    </>
                                  )}
                                  {task.points && (
                                    <>
                                      <span>•</span>
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                        {task.points} pts
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right actions: Priority Pill, Assignee, Quick Status Switcher */}
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                              {/* Priority */}
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${pc.chip}`}>
                                {pc.label}
                              </span>

                              {/* Quick Move Status Custom Dropdown */}
                              <div className="relative" id={`quick-status-${task.id}`}>
                                <button
                                  type="button"
                                  disabled={isMoving}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveStatusDropdownTaskId(activeStatusDropdownTaskId === task.id ? null : task.id);
                                  }}
                                  className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${sc.color} ${
                                    isMoving ? 'opacity-50' : 'hover:shadow-xs'
                                  }`}
                                >
                                  <span>{sc.label}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeStatusDropdownTaskId === task.id ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                  {activeStatusDropdownTaskId === task.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                                    >
                                      {[
                                        { id: 'TO_DO', label: 'To Do', dot: 'bg-blue-400' },
                                        { id: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-indigo-500' },
                                        { id: 'COMPLETED', label: 'Completed', dot: 'bg-emerald-500' },
                                        { id: 'BACKLOG', label: 'Backlog', dot: 'bg-slate-400' }
                                      ].map((st) => (
                                        <button
                                          key={st.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveStatusDropdownTaskId(null);
                                            handleStatusChange(task.id, st.id, e);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                            task.status === st.id ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                            <span>{st.label}</span>
                                          </div>
                                          {task.status === st.id && <Check className="w-3 h-3 text-indigo-600" />}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Assignee Avatar */}
                              {memberAvatars[task.assigneeId || task.assignee] ? (
                                <img
                                  src={memberAvatars[task.assigneeId || task.assignee]}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center border border-indigo-200/50">
                                  {currentUser?.name?.charAt(0) || 'U'}
                                </div>
                              )}

                              <button
                                onClick={() => task.workspaceId && handleSelect(task.workspaceId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Open in Board"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {dashboardUserMode === 'ME'
                            ? `No tasks assigned to ${userDisplayName}`
                            : 'No tasks match your filter'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {dashboardUserMode === 'ME'
                            ? 'Switch to Team View to inspect all tasks across the workspace, or assign a task to yourself.'
                            : 'Try resetting your filter parameters or create a new task in this workspace.'}
                        </p>
                        {dashboardUserMode === 'ME' && (
                          <button
                            onClick={() => setDashboardUserMode('ALL')}
                            className="mt-3.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>👥 Switch to Team View</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {radarTasks.length > 8 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                      <button
                        onClick={() => {
                          const targetId = dashboardScope !== 'ALL' ? dashboardScope : (activeWorkspace?.id || workspaces[0]?.id);
                          if (targetId) navigate(`/workspace/${targetId}/kanban`);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        View all {radarTasks.length} tasks in board <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Workspace Fleet Overview ── */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Workspace Fleet Performance</h3>
                      <p className="text-xs text-slate-400 font-medium">Cross-workspace velocity and delivery metrics</p>
                    </div>
                    <Button size="xs" variant="outline" icon={Plus} onClick={() => navigate('/create-workspace')}>
                      New Space
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map((ws, i) => {
                      const { total: wsTotal, done: wsDone, pct: wsPct } = getWorkspaceStats(ws.id);
                      return (
                        <motion.div
                          key={ws.id}
                          whileHover={{ y: -2 }}
                          onClick={() => handleSelect(ws.id)}
                          className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between min-h-[140px]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <WorkspaceLogo workspace={ws} size="md" className="shrink-0 ring-2 ring-slate-100" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {ws.name}
                                </h4>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {ws.visibility || 'Private'} · {ws.userRole || 'Member'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                              {wsPct}%
                            </span>
                          </div>

                          <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500">
                              <span>Progress</span>
                              <span>{wsDone} / {wsTotal} done</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${wsPct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceView;
