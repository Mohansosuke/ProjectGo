import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20">
      {/* ─── Left spacer ─────────────────────────────── */}
      <div className="flex-1" />

      {/* ─── Right Actions ──────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-blue-500/20"
          title="Create new task"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <Avatar name={currentUser?.name} src={currentUser?.avatar} size="sm" status="Online" />
            </div>
          }
          width="w-52"
        >
          <div className="px-3 py-2.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
          </div>
          <Dropdown.Item
            icon={() => <span className="text-sm">👤</span>}
            onClick={() => navigate('/profile')}
          >
            Profile
          </Dropdown.Item>

          <Dropdown.Separator />
          <Dropdown.Item
            danger
            onClick={() => {
              localStorage.removeItem('taskflow_user');
              navigate('/login');
            }}
          >
            Sign out
          </Dropdown.Item>
        </Dropdown>
      </div>
    </header>
  );
};

export default Navbar;
