/**
 * Mock API Service Layer
 * 
 * Abstracts all data access behind async functions that mimic real API calls.
 * When backend APIs are ready, swap these implementations without touching components.
 * 
 * All methods return Promises with simulated latency.
 */

import { delay } from '../lib/utils';

const STORAGE_KEYS = {
  USERS: 'projectgo_users_db',
  WORKSPACES: 'projectgo_workspaces_db',
  TASKS: 'projectgo_tasks_db',
  COLUMNS: 'projectgo_columns_db',
  CURRENT_USER: 'projectgo_user',
  ACTIVE_WORKSPACE: 'projectgo_active_workspace',
  SIDEBAR_COLLAPSED: 'projectgo_sidebar_collapsed',
};

// ─── Generic localStorage Helpers ────────────────────────────
function getStore(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Auth Service ────────────────────────────────────────────
export const authService = {
  async login(email, password) {
    await delay(600);
    const users = getStore(STORAGE_KEYS.USERS) || [];
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('Invalid email or password');
    setStore(STORAGE_KEYS.CURRENT_USER, user);
    return user;
  },

  async signup(name, email, password) {
    await delay(600);
    const users = getStore(STORAGE_KEYS.USERS) || [];
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const newUser = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name.toLowerCase())}`,
      role: 'Member',
      status: 'Online',
      bio: '',
      phone: '',
    };
    const updated = [...users, newUser];
    setStore(STORAGE_KEYS.USERS, updated);
    setStore(STORAGE_KEYS.CURRENT_USER, newUser);
    return newUser;
  },

  async resetPassword(email, newPassword) {
    await delay(600);
    const users = getStore(STORAGE_KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) throw new Error('Email not found');
    users[idx].password = newPassword;
    setStore(STORAGE_KEYS.USERS, users);
  },

  async verifyEmail(email) {
    await delay(400);
    const users = getStore(STORAGE_KEYS.USERS) || [];
    return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    return getStore(STORAGE_KEYS.CURRENT_USER);
  },

  getUsers() {
    return getStore(STORAGE_KEYS.USERS) || [];
  },
};

// ─── Workspace Service ───────────────────────────────────────
export const workspaceService = {
  async getAll() {
    await delay(200);
    return getStore(STORAGE_KEYS.WORKSPACES) || [];
  },

  async create(data) {
    await delay(400);
    const workspaces = getStore(STORAGE_KEYS.WORKSPACES) || [];
    const newWorkspace = {
      id: `w${Date.now()}`,
      name: data.name,
      description: data.description || '',
      url: data.url || data.name.toLowerCase().replace(/\s+/g, '-'),
      logo: null,
      members: ['u1'],
      visibility: data.visibility || 'Private',
      recent: true,
      favorite: false,
    };
    const updated = [...workspaces, newWorkspace];
    setStore(STORAGE_KEYS.WORKSPACES, updated);
    setStore(STORAGE_KEYS.ACTIVE_WORKSPACE, newWorkspace.id);
    return newWorkspace;
  },

  async update(id, updates) {
    await delay(300);
    const workspaces = getStore(STORAGE_KEYS.WORKSPACES) || [];
    const updated = workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setStore(STORAGE_KEYS.WORKSPACES, updated);
    return updated.find((w) => w.id === id);
  },

  async remove(id) {
    await delay(300);
    const workspaces = getStore(STORAGE_KEYS.WORKSPACES) || [];
    const updated = workspaces.filter((w) => w.id !== id);
    setStore(STORAGE_KEYS.WORKSPACES, updated);
  },

  getActiveId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE);
  },

  setActiveId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE, id);
  },
};

// ─── Task Service ────────────────────────────────────────────
export const taskService = {
  async getAll() {
    await delay(200);
    return getStore(STORAGE_KEYS.TASKS) || [];
  },

  async getByWorkspace(workspaceId) {
    await delay(200);
    const tasks = getStore(STORAGE_KEYS.TASKS) || [];
    return tasks.filter((t) => t.workspaceId === workspaceId);
  },

  async getById(taskId) {
    await delay(100);
    const tasks = getStore(STORAGE_KEYS.TASKS) || [];
    return tasks.find((t) => t.id === taskId) || null;
  },

  async create(taskData) {
    await delay(300);
    const tasks = getStore(STORAGE_KEYS.TASKS) || [];
    const newTask = {
      id: `t${Date.now()}`,
      createdAt: new Date().toISOString(),
      points: taskData.points || 1,
      labels: taskData.labels || [],
      ...taskData,
    };
    const updated = [...tasks, newTask];
    setStore(STORAGE_KEYS.TASKS, updated);
    return newTask;
  },

  async update(taskId, updates) {
    await delay(200);
    const tasks = getStore(STORAGE_KEYS.TASKS) || [];
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    setStore(STORAGE_KEYS.TASKS, updated);
    return updated.find((t) => t.id === taskId);
  },

  async moveTask(taskId, newStatus) {
    return this.update(taskId, { status: newStatus });
  },
};

// ─── Column Service ──────────────────────────────────────────
export const columnService = {
  getAll() {
    return getStore(STORAGE_KEYS.COLUMNS) || [];
  },

  save(columns) {
    setStore(STORAGE_KEYS.COLUMNS, columns);
  },
};

// ─── Preferences Service ─────────────────────────────────────
export const prefsService = {
  getSidebarCollapsed() {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
  },

  setSidebarCollapsed(collapsed) {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  },
};
