import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Folder, Lock, Globe, Clock, Users, Users2, CheckCircle,
  User, Settings, LogOut, ChevronDown, ChevronRight, Star, Bell,
  Activity, SlidersHorizontal, PlusCircle, Calendar, CalendarDays, Grid, Sparkles,
  FileText, Mail, AlertTriangle, ArrowRight, Menu, X, Compass,
  Check, MoreHorizontal, Camera, Home, BookOpen, LayoutDashboard, BarChart3, Hash, Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { Button, Input, Avatar, Badge, Dropdown, Breadcrumb, WorkspaceLogo } from '../components/ui';

/* ─── Custom Icons ────────────────────────────────────────── */
const OrbitIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-30 12 12)" />
  </svg>
);

const DocsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8M16 13H8M16 17H8" />
  </svg>
);

/* ─── Sidebar Close / Open SVG Icons ───────────────────────── */
const SidebarCloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="3" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </svg>
);

const SidebarOpenIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="3" />
    <path d="M9 3v18" />
    <path d="m13 9 3 3-3 3" />
  </svg>
);

/* ─── Unique Application Logo Component ─────────────────────── */
const ProjectGoAppLogo = ({ size = "md", showWordmark = true }) => (
  <div className="flex items-center gap-2.5 select-none">
    <div className={`relative ${size === 'sm' ? 'w-8 h-8' : 'w-8.5 h-8.5'} flex-shrink-0 group`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'}>
          <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
    {showWordmark && (
      <div className="flex items-baseline gap-0.5 min-w-0">
        <span className="font-black text-[17px] tracking-tight text-slate-900 leading-none">
          Project<span className="text-indigo-600">Go</span>
        </span>
      </div>
    )}
  </div>
);

const memberAvatars = {
  u1: "https://i.pravatar.cc/80?img=12",
  u2: "https://i.pravatar.cc/80?img=47",
  u3: "https://i.pravatar.cc/80?img=15",
};

const DashboardLayout = () => {
  const { currentUser, loading, logout, updateProfile } = useAuth();
  const { workspaces, activeWorkspace, selectWorkspace, clearActiveWorkspace, globalSearchQuery, setGlobalSearchQuery, workspacesLoading } = useWorkspace();
  const { tasks } = useTask();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const path = location.pathname;

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(() =>
    localStorage.getItem('projectgo_sidebar_collapsed') === 'true'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || currentUser?.avatar || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [coverUrl, setCoverUrl] = useState(
    currentUser?.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  );
  const coverFileInputRef = useRef(null);
  const openCoverFilePicker = () => { coverFileInputRef.current?.click(); };

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.name || '');
      setBio(currentUser.bio || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.photoURL || currentUser.avatar || '');
      setNickname(currentUser.nickname || '');
      setEmail(currentUser.email || '');
      setCoverUrl(currentUser.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
    }
  }, [currentUser]);

  const handleImageUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') setAvatarUrl(reader.result);
        else if (type === 'cover') setCoverUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentDisplayTab = hoveredTab || activeTab;
  const isSecondaryVisible = !isSecondaryCollapsed || hoveredTab !== null;

  useEffect(() => {
    localStorage.setItem('projectgo_sidebar_collapsed', String(isSecondaryCollapsed));
  }, [isSecondaryCollapsed]);

  useEffect(() => {
    if (activeWorkspace?.id) {
      setExpandedWorkspaces(prev => ({ ...prev, [activeWorkspace.id]: true }));
    }
  }, [activeWorkspace]);

  // Sync workspace when on workspace page; disconnect when leaving workspace pages
  useEffect(() => {
    if (params.workspaceId) {
      const found = workspaces.find(w => w.id === params.workspaceId);
      if (found && activeWorkspace?.id !== found.id) {
        selectWorkspace(found.id);
      }
    } else if (!path.includes('/workspace/')) {
      // Leaving workspace - disconnect active workspace so it doesn't follow to next pages
      if (activeWorkspace) {
        clearActiveWorkspace?.();
      }
    }
  }, [path, params.workspaceId, workspaces]);

  useEffect(() => {
    if (path === '/profile') {
      setActiveTab('Dashboard');
      setIsProfilePanelOpen(true);
      navigate('/workspaces', { replace: true });
    } else if (path === '/workspaces') {
      setActiveTab(location.state?.initialTab || 'Dashboard');
    } else if (path.includes('/workspace/')) {
      setActiveTab('Spaces');
    }
  }, [path, location.state, navigate]);

  if (loading) return <div className="min-h-screen bg-gray-50" />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSelect = (id) => { selectWorkspace(id); navigate(`/workspace/${id}/kanban`); };

  const getNestedLists = (wId) => {
    const wTasks = tasks.filter(t => t.workspaceId === wId);
    return [
      { id: `${wId}-all`, name: 'All Tasks', count: wTasks.length },
      { id: `${wId}-active`, name: 'Active', count: wTasks.filter(t => t.status !== 'COMPLETED').length },
      { id: `${wId}-done`, name: 'Completed', count: wTasks.filter(t => t.status === 'COMPLETED').length },
    ];
  };

  const primaryNavItems = [
    { id: 'Dashboard', label: 'Dashboard', Icon: BarChart3, route: '/workspaces', badge: null },
    { id: 'Spaces', label: 'Spaces', Icon: Layers, route: '/workspaces', badge: workspaces.length },
    { id: 'Planner', label: 'Planner', Icon: CalendarDays, route: '/workspaces', badge: null },
    { id: 'Teams', label: 'Teams', Icon: Users2, route: '/workspaces', badge: null },
    { id: 'Docs', label: 'Docs', Icon: FileText, route: '/workspaces', badge: null },
  ];

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  const handlePrimaryClick = (item) => {
    setActiveTab(item.id);
    navigate(item.route, { state: { initialTab: item.id } });
  };

  const toggleWorkspaceAccordion = (wId) => {
    setExpandedWorkspaces(prev => ({ ...prev, [wId]: !prev[wId] }));
  };

  const getPageTitle = () => {
    if (path === '/workspaces') return activeTab;
    if (path === '/create-workspace') return 'New Workspace';
    if (path === '/profile') return 'Profile';
    if (path.includes('/members')) return 'Team Members';
    if (path.includes('/invite')) return 'Invite Members';
    if (path.includes('/settings')) return 'Workspace Settings';
    if (path.includes('/task/')) return `Task ${(params.taskId || '').toUpperCase()}`;
    return 'Dashboard';
  };

  const isCollapsed = isSecondaryCollapsed;
  const toggleSidebar = () => setIsSecondaryCollapsed(prev => !prev);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased relative">

      {/* ═══════════════════════════════════════════════════════
          UNIFIED MODERN SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 bg-white border-r border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.03)] transition-[width] duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {/* ── Top Header: Unique Application Logo & Sidebar Close/Expand Controls ── */}
        <div className="h-16 px-3 border-b border-slate-100 flex items-center justify-between shrink-0 relative">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full min-w-0">
              {/* Left: Unique Application Logo */}
              <Link to="/" className="flex items-center gap-2 group cursor-pointer" title="ProjectGo Home">
                <ProjectGoAppLogo />
              </Link>

              {/* Right: Sidebar Close Icon Button (at the top end of the left sidebar) */}
              <button
                onClick={() => setIsSecondaryCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <SidebarCloseIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Collapsed Mode: Hover Application Logo to reveal Sidebar Expand Icon instead */
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={() => setIsSecondaryCollapsed(false)}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-indigo-50"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                {isLogoHovered ? (
                  <div className="w-8.5 h-8.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30 flex items-center justify-center transition-transform scale-100">
                    <SidebarOpenIcon className="w-4.5 h-4.5" />
                  </div>
                ) : (
                  <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/25 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]">
                      <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Workspace Switcher (Expanded only - no workspace icon) ── */}
        {!isCollapsed && (
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100/80">
            <div className="relative">
              <button
                onClick={() => setIsWorkspaceDropdownOpen(prev => !prev)}
                className="w-full flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {activeWorkspace?.name || 'Select Workspace'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 capitalize truncate">
                    {activeWorkspace ? (activeWorkspace.userRole || 'Workspace Space') : 'Click to select'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-slate-600 transition-transform duration-200 ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Switcher Dropdown */}
              {isWorkspaceDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Switch Workspace
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {workspaces.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            selectWorkspace(w.id);
                            setIsWorkspaceDropdownOpen(false);
                            navigate(`/workspace/${w.id}/kanban`);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            w.id === activeWorkspace?.id
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <span className="truncate">{w.name}</span>
                          </div>
                          {w.id === activeWorkspace?.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsWorkspaceDropdownOpen(false);
                          navigate('/create-workspace');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50/80 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-indigo-500" />
                        <span>Create New Workspace</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Quick Action Button (Expanded) ── */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => {
                if (activeWorkspace?.id) navigate(`/workspace/${activeWorkspace.id}/kanban`);
                else navigate('/create-workspace');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          </div>
        )}

        {/* ── Main Navigation Items (Exactly: Home, Dashboard, Spaces, Planner, Teams, Docs) ── */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-thin">
          {!isCollapsed && (
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 py-1">
              Main Menu
            </p>
          )}

          {primaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handlePrimaryClick(item)}
                  className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center h-11' : 'gap-3 px-3 py-2.5 text-xs font-semibold'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`} />
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge !== null && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Tooltip in collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap shadow-xl border border-white/10">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}

          {/* Expanded Spaces Sub-list (when Spaces is active or expanded) */}
          {!isCollapsed && (
            <div className="pt-3">
              <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <span>Active Spaces</span>
                <button
                  onClick={() => navigate('/create-workspace')}
                  className="hover:text-indigo-600 transition-colors p-0.5"
                  title="Create Workspace"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5 mt-1">
                {workspaces.map(w => {
                  const isCurrent = w.id === activeWorkspace?.id;
                  const isExpanded = !!expandedWorkspaces[w.id];
                  return (
                    <div key={w.id} className="rounded-xl overflow-hidden">
                      <div
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100/90 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        onClick={() => handleSelect(w.id)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <WorkspaceLogo workspace={w} size="xs" className="shrink-0" />
                          <span className="truncate">{w.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkspaceAccordion(w.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="pl-7 pr-2 py-1 space-y-0.5 bg-slate-50/50"
                          >
                            <button
                              onClick={() => navigate(`/workspace/${w.id}/kanban`)}
                              className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <LayoutDashboard className="w-3 h-3 text-slate-400" />
                                Sprint Board
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {tasks.filter(t => t.workspaceId === w.id).length}
                              </span>
                            </button>
                            <button
                              onClick={() => navigate(`/workspace/${w.id}/members`)}
                              className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-slate-400" />
                                Members
                              </span>
                            </button>
                            <button
                              onClick={() => navigate(`/workspace/${w.id}/settings`)}
                              className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <Settings className="w-3 h-3 text-slate-400" />
                                Settings
                              </span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer / User Profile Strip ── */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-200/60 shadow-xs">
              <div
                onClick={() => setIsProfilePanelOpen(true)}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img
                    src={currentUser?.photoURL || currentUser?.avatar || "https://i.pravatar.cc/80?img=12"}
                    alt=""
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {currentUser?.fullName || currentUser?.name || 'Account'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser?.email || 'Logged in'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsProfilePanelOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Profile settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsProfilePanelOpen(true)}
                className="relative rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-indigo-500 transition-all cursor-pointer"
                title="Profile settings"
              >
                <img
                  src={currentUser?.photoURL || currentUser?.avatar || "https://i.pravatar.cc/80?img=12"}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
              </button>
            </div>
          )}
        </div>


      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT AREA (adjusted padding for new sidebar)
      ═══════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden transition-[padding] duration-300 w-full"
        style={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? (isCollapsed ? '68px' : '260px')
            : '0px',
        }}
      >
        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-5 gap-4 shrink-0 shadow-[0_1px_0_rgb(0_0_0_/_0.04)]">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Left Topbar Content: Workspace Logo + Name ONLY on Kanban, otherwise Single Page Name Alone */}
            {path.includes('/kanban') ? (
              <div className="flex items-center gap-2.5">
                <WorkspaceLogo workspace={activeWorkspace} size="sm" />
                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                  {activeWorkspace?.name || 'Workspace'}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ Sprint Board</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-800 tracking-tight">
                  {getPageTitle()}
                </h1>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              id="top-search-input"
              type="text"
              placeholder="Search tasks, projects…"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-14 py-2 h-9 rounded-[10px] bg-gray-50 border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 text-sm text-gray-700 placeholder:text-gray-400 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-[9px] font-semibold text-gray-400">
              ⌘K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            </button>

            <div className="h-5 w-px bg-gray-200" />

            {currentUser && (
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2 p-1.5 pl-1 pr-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer">
                    <img
                      src={currentUser.photoURL || currentUser.avatar || "https://i.pravatar.cc/80?img=12"}
                      alt=""
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs font-semibold text-gray-800 leading-none">
                        {(currentUser.fullName || currentUser.name || 'User').split(' ')[0]}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                }
              >
                <Dropdown.Item icon={User} onClick={() => setIsProfilePanelOpen(true)}>
                  View Profile
                </Dropdown.Item>

                <Dropdown.Separator />
                <Dropdown.Item danger icon={LogOut} onClick={handleLogout}>
                  Sign Out
                </Dropdown.Item>
              </Dropdown>
            )}
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto relative bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative w-[300px] max-w-[85vw] h-full flex z-10 shadow-2xl"
            >
              {/* Primary strip */}
              <div className="w-14 shrink-0 h-full flex flex-col items-center py-4 justify-between"
                style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)' }}>
                <div className="flex flex-col items-center gap-3">
                  <Link to="/" className="relative w-8 h-8 flex-shrink-0 group block">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path d="M5 9L9 12L5 15" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11 6L18 12L11 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Link>
                  {primaryNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { handlePrimaryClick(item); setIsMobileMenuOpen(false); }}
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                        activeTab === item.id ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'
                      }`}
                    >
                      <item.Icon className="w-4 h-4" />
                      <span className="text-[8px] font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
                {currentUser && (
                  <img
                    src={currentUser.photoURL || currentUser.avatar || "https://i.pravatar.cc/80?img=12"}
                    alt=""
                    className="w-8 h-8 rounded-xl object-cover border border-white/20 cursor-pointer"
                    onClick={() => { setIsProfilePanelOpen(true); setIsMobileMenuOpen(false); }}
                  />
                )}
              </div>

              {/* Secondary panel */}
              <div className="flex-1 flex flex-col bg-white h-full border-l border-gray-100 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">{activeTab}</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {workspaces.map(w => (
                    <button
                      key={w.id}
                      onClick={() => { handleSelect(w.id); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2.5 cursor-pointer"
                    >
                      <WorkspaceLogo workspace={w} size="xs" className="shrink-0" />
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          PROFILE SLIDE-OVER PANEL
      ═══════════════════════════════════════════════════════ */}

      {/* Hidden cover file input — outside ALL overflow containers */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleImageUpload(e, 'cover')}
      />

      {isProfilePanelOpen && (
        <div
          onClick={() => { setIsProfilePanelOpen(false); setIsEditingProfile(false); }}
          className="fixed inset-0 bg-black/10 z-[28]"
        />
      )}

      <aside className={`fixed right-0 top-0 h-screen w-full max-w-[380px] bg-white border-l border-gray-200 shadow-[var(--shadow-panel)] transition-transform duration-300 ease-out z-[29] flex flex-col overflow-hidden ${
        isProfilePanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}>
        {/* Cover banner */}
        <div
          className="relative h-28 shrink-0 overflow-hidden group"
          style={{
            background: coverUrl
              ? `url(${coverUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1e1b4b, #4c1d95, #7c3aed)',
          }}
        >
          {!coverUrl && (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 w-20 h-20 rounded-full bg-white blur-xl" />
              <div className="absolute bottom-1 right-6 w-16 h-16 rounded-full bg-white blur-lg" />
            </div>
          )}

          {/* Close */}
          <button
            onClick={() => { setIsProfilePanelOpen(false); setIsEditingProfile(false); }}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Change cover — always visible hover overlay + corner button in edit mode */}
          {isEditingProfile && (
            <>
              {/* Full-banner clickable overlay on hover */}
              <button
                type="button"
                onClick={openCoverFilePicker}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-1 bg-black/0 group-hover:bg-black/35 transition-all duration-200 cursor-pointer"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1 pointer-events-none">
                  <Camera className="w-5 h-5 text-white drop-shadow" />
                  <span className="text-white text-[10px] font-semibold drop-shadow">Change Cover</span>
                </span>
              </button>

              {/* Corner pill button — always visible in edit mode */}
              <button
                type="button"
                onClick={openCoverFilePicker}
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white text-[10px] font-semibold cursor-pointer backdrop-blur-sm transition-all border border-white/20"
                style={{ zIndex: 10 }}
              >
                <Camera className="w-3 h-3" /> Change Cover
              </button>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="relative shrink-0 px-5 -mt-9 mb-1">
          <div className="relative inline-block">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg bg-white relative group">
              <img src={avatarUrl || 'https://i.pravatar.cc/80?img=12'} alt={fullName} className="w-full h-full object-cover" />
              {isEditingProfile && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer transition-opacity">
                  <Camera className="w-4 h-4 mb-0.5" />
                  Change
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'avatar')} />
                </label>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Name + handle */}
          <div className="px-5 pb-4 flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{fullName || 'Your Name'}</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {nickname ? `@${nickname}` : '@handle'}
                {email && <span className="text-gray-400"> · {email}</span>}
              </p>
              {bio && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{bio}</p>}
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="ml-3 shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mx-5 mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Done', value: tasks.filter(t => t.assignee === currentUser?.id && t.status === 'COMPLETED').length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Workspaces', value: workspaces.length, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
              { label: 'Active', value: tasks.filter(t => t.assignee === currentUser?.id && t.status !== 'COMPLETED').length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border`}>
                <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-gray-500 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mx-5 mb-4 h-px bg-gray-100" />

          {/* Edit form */}
          {isEditingProfile ? (
            <div className="px-5 space-y-3 pb-5">
              <p className="eyebrow mb-3">Edit Profile</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-base text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                  <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="@handle" className="input-base text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) …" className="input-base text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself…"
                  className="input-base text-xs resize-none py-2.5"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={async () => {
                    await updateProfile({ name: fullName, bio, phone, avatar: avatarUrl, nickname, email, cover: coverUrl });
                    setIsEditingProfile(false);
                  }}
                  className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setFullName(currentUser.fullName || currentUser.name || ''); setBio(currentUser.bio || '');
                    setPhone(currentUser.phone || ''); setAvatarUrl(currentUser.photoURL || currentUser.avatar || '');
                    setNickname(currentUser.nickname || ''); setEmail(currentUser.email || '');
                    setCoverUrl(currentUser.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
                    setIsEditingProfile(false);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 space-y-4 pb-5">
              <div>
                <p className="eyebrow mb-3">Profile Details</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Full Name', value: fullName },
                    { label: 'Username', value: nickname ? `@${nickname}` : '—' },
                    { label: 'Email', value: email },
                    { label: 'Phone', value: phone || '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">{f.label}</p>
                      <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {bio && (
                  <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Bio</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{bio}</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div>
                <p className="eyebrow mb-3">Achievements</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { emoji: '🚀', label: 'Task Creator', color: 'bg-violet-50 text-violet-700 border-violet-100' },
                    { emoji: '⚡', label: 'Fast Finisher', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    { emoji: '🎯', label: 'On Target', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { emoji: '🌟', label: 'Team Player', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  ].map(b => (
                    <span key={b.label} className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${b.color}`}>
                      <span>{b.emoji}</span> {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workspaces */}
              <div>
                <p className="eyebrow mb-3">Workspaces</p>
                <div className="space-y-1">
                  {workspaces.slice(0, 3).map((w, i) => {
                    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <div
                        key={w.id}
                        onClick={() => { handleSelect(w.id); setIsProfilePanelOpen(false); }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className={`w-7 h-7 rounded-lg ${colors[i % colors.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {w.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{w.name}</p>
                          <p className="text-[10px] text-gray-400">{tasks.filter(t => t.workspaceId === w.id).length} tasks</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Online</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DashboardLayout;
