import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  List,
  Calendar,
  Target,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  FolderKanban,
  Plus,
  Search,
  Star,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import Avatar from '../ui/Avatar';

const iconMap = {
  Home, LayoutDashboard, List, Calendar, Target, FileText, Users, Settings,
  FolderKanban, Inbox, Star,
};

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { currentUser, logout } = useAuth();
  const { workspaces, activeWorkspace, selectWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectWorkspace = (id) => {
    selectWorkspace(id);
    setShowWorkspaceDropdown(false);
    navigate(`/workspace/${id}/kanban`);
  };

  const path = location.pathname;

  const primaryNav = [
    { id: 'home', label: 'Home', icon: Home, path: '/workspaces' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/notifications', badge: 3 },
  ];

  const workspaceNav = [
    { id: 'board', label: 'Board', icon: LayoutDashboard, suffix: 'kanban' },
    { id: 'list', label: 'List', icon: List, suffix: 'list' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, suffix: 'calendar' },
    { id: 'goals', label: 'Goals', icon: Target, suffix: 'goals' },
    { id: 'docs', label: 'Docs', icon: FileText, suffix: 'docs' },
  ];

  const manageNav = [
    { id: 'members', label: 'Members', icon: Users, suffix: 'members' },
    { id: 'settings', label: 'Settings', icon: Settings, suffix: 'settings' },
  ];

  const isActive = (itemPath) => {
    if (itemPath.startsWith('/')) return path === itemPath || path.startsWith(itemPath + '/');
    return path.includes(`/${itemPath}`);
  };

  const wsId = activeWorkspace?.id;

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 260 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200/80 flex flex-col z-30 shrink-0 select-none overflow-hidden"
    >
      {/* ─── Header / Logo ────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight truncate">TaskFlow</span>
          </motion.div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm mx-auto">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Workspace Selector ───────────────────────── */}
      {!isCollapsed && activeWorkspace && (
        <div className="px-3 pt-3 pb-1 relative">
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                {activeWorkspace.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-slate-700 truncate">{activeWorkspace.name}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showWorkspaceDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-3 right-3 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden"
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSelectWorkspace(w.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {w.name.charAt(0)}
                      </div>
                      <span className="truncate">{w.name}</span>
                    </div>
                    {w.id === activeWorkspace.id && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => { setShowWorkspaceDropdown(false); navigate('/create-workspace'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-5 scrollbar-thin">
        {/* Primary */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
          )}
          {primaryNav.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all relative group ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                } ${isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-[10px] font-semibold bg-blue-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs font-medium py-1 px-2.5 rounded-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Workspace Views */}
        {activeWorkspace && (
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Views
              </div>
            )}
            {workspaceNav.map((item) => {
              const itemPath = `/workspace/${wsId}/${item.suffix}`;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(itemPath)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-all relative group ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                    } ${isActive(item.suffix)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs font-medium py-1 px-2.5 rounded-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Spaces */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Spaces</span>
              <button
                onClick={() => navigate('/create-workspace')}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelectWorkspace(w.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${activeWorkspace?.id === w.id
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <FolderKanban className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{w.name}</span>
                {w.favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* Manage */}
        {activeWorkspace && (
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Manage
              </div>
            )}
            {manageNav.map((item) => {
              const itemPath = `/workspace/${wsId}/${item.suffix}`;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(itemPath)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 rounded-lg transition-all relative group ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'
                    } ${isActive(item.suffix)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs font-medium py-1 px-2.5 rounded-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* ─── Footer / User ────────────────────────────── */}
      <div className="border-t border-slate-100 p-2 shrink-0">
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors mb-1"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* User section */}
        {currentUser && (
          <div className={`flex items-center gap-2.5 rounded-lg transition-colors ${isCollapsed ? 'justify-center p-2' : 'p-2'}`}>
            <button
              onClick={() => navigate('/profile')}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" status="Online" />
            </button>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
