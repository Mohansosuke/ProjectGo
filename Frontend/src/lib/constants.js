/**
 * Design system tokens and application constants.
 * Single source of truth — never hardcode these values in components.
 */

// ─── Task Statuses ───────────────────────────────────────────
export const TASK_STATUSES = [
  { id: 'TODO', label: 'To Do', color: '#94a3b8', bgClass: 'bg-slate-100 text-slate-600' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', bgClass: 'bg-blue-50 text-blue-600' },
  { id: 'IN_REVIEW', label: 'In Review', color: '#f59e0b', bgClass: 'bg-amber-50 text-amber-600' },
  { id: 'COMPLETED', label: 'Completed', color: '#10b981', bgClass: 'bg-emerald-50 text-emerald-600' },
];

export const TASK_STATUS_MAP = Object.fromEntries(
  TASK_STATUSES.map((s) => [s.id, s])
);

// ─── Task Priorities ─────────────────────────────────────────
export const TASK_PRIORITIES = [
  { id: 'Critical', label: 'Critical', color: '#ef4444', bgClass: 'bg-red-50 text-red-600 border-red-200' },
  { id: 'High', label: 'High', color: '#f97316', bgClass: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'Medium', label: 'Medium', color: '#3b82f6', bgClass: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'Low', label: 'Low', color: '#94a3b8', bgClass: 'bg-slate-50 text-slate-500 border-slate-200' },
];

export const TASK_PRIORITY_MAP = Object.fromEntries(
  TASK_PRIORITIES.map((p) => [p.id, p])
);

// ─── Task Labels ─────────────────────────────────────────────
export const TASK_LABELS = {
  DESIGN: { label: 'Design', bgClass: 'bg-pink-50 text-pink-600 border-pink-100' },
  FRONTEND: { label: 'Frontend', bgClass: 'bg-blue-50 text-blue-600 border-blue-100' },
  BACKEND: { label: 'Backend', bgClass: 'bg-purple-50 text-purple-600 border-purple-100' },
  MARKETING: { label: 'Marketing', bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  ACCESSIBILITY: { label: 'Accessibility', bgClass: 'bg-amber-50 text-amber-600 border-amber-100' },
  MOBILE: { label: 'Mobile', bgClass: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  'AUTH-SERVICE': { label: 'Auth Service', bgClass: 'bg-violet-50 text-violet-600 border-violet-100' },
  PAYMENTS: { label: 'Payments', bgClass: 'bg-teal-50 text-teal-600 border-teal-100' },
};

// ─── User Roles ──────────────────────────────────────────────
export const USER_ROLES = [
  { id: 'Admin', label: 'Admin', description: 'Full workspace control' },
  { id: 'Member', label: 'Member', description: 'Can edit tasks' },
  { id: 'Viewer', label: 'Viewer', description: 'Read-only access' },
];

// ─── User Statuses ───────────────────────────────────────────
export const USER_STATUS_COLORS = {
  Online: 'bg-emerald-500',
  Offline: 'bg-slate-400',
  Busy: 'bg-amber-500',
  Away: 'bg-yellow-400',
};

// ─── Navigation Items ────────────────────────────────────────
export const SIDEBAR_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'Home', path: '/workspaces' },
  { id: 'board', label: 'Board', icon: 'LayoutDashboard', path: 'kanban' },
  { id: 'list', label: 'List', icon: 'List', path: 'list' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: 'calendar' },
  { id: 'goals', label: 'Goals', icon: 'Target', path: 'goals' },
  { id: 'docs', label: 'Docs', icon: 'FileText', path: 'docs' },
];

export const SIDEBAR_MANAGE_ITEMS = [
  { id: 'members', label: 'Members', icon: 'Users', path: 'members' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: 'settings' },
];

// ─── View Tabs ───────────────────────────────────────────────
export const VIEW_TABS = [
  { id: 'board', label: 'Board', icon: 'LayoutDashboard' },
  { id: 'list', label: 'List', icon: 'List' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'timeline', label: 'Timeline', icon: 'GanttChart' },
];

// ─── Kanban Columns (Default) ────────────────────────────────
export const DEFAULT_COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#94a3b8', dotClass: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6', dotClass: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#f59e0b', dotClass: 'bg-amber-500' },
  { id: 'COMPLETED', title: 'Completed', color: '#10b981', dotClass: 'bg-emerald-500' },
];

// ─── App Metadata ────────────────────────────────────────────
export const APP_NAME = 'ProjectGo';
export const APP_TAGLINE = 'The new standard for modern product teams';
export const APP_DESCRIPTION =
  'ProjectGo brings all your tasks, teammates, and tools together. Keep everything in the same place—even if your team isn\'t.';

// ─── Workspace Visibility Options ────────────────────────────
export const VISIBILITY_OPTIONS = [
  { id: 'Private', label: 'Private', description: 'Only invited members can access' },
  { id: 'Public', label: 'Public', description: 'Anyone in the org can view' },
];

// ─── Settings Nav ────────────────────────────────────────────
export const SETTINGS_NAV = [
  {
    section: 'WORKSPACE',
    items: [
      { name: 'General', icon: 'Settings', path: 'general', active: true },
      { name: 'Permissions', icon: 'Shield', path: 'permissions' },
      { name: 'Notifications', icon: 'Bell', path: 'notifications' },
      { name: 'Appearance', icon: 'Palette', path: 'appearance' },
      { name: 'Integrations', icon: 'Puzzle', path: 'integrations' },
      { name: 'Billing', icon: 'CreditCard', path: 'billing' },
    ],
  },
  {
    section: 'USERS',
    items: [
      { name: 'Members', icon: 'Users', path: 'members' },
      { name: 'Teams', icon: 'Network', path: 'teams' },
    ],
  },
];
