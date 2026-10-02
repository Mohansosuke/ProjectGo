import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Paperclip, Link2, MoreHorizontal, Check,
  ChevronsUp, ArrowUp, Minus, ArrowDown, ChevronDown, Plus,
  Trash2, Edit3, Smile, Bold, Italic, Link as LinkIcon,
  Zap, Clock, FileText, X, Copy, Search, UserX,
  MessageSquare, History, Timer, Tag, BarChart2, CheckCircle2, AlertCircle, AlertTriangle,
  Maximize2, Minimize2, Calendar
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import apiClient from '../services/apiClient';

/* ─── Constants ─────────────────────────────────────────────── */
const STATUS_ITEMS = [
  {
    id: 'TODO', label: 'To Do',
    pill: 'bg-slate-100 text-slate-800 border-slate-400',
    btn: 'bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400',
    dot: 'bg-slate-500',
    stripe: 'from-slate-400 to-slate-500',
  },
  {
    id: 'IN_PROGRESS', label: 'In Progress',
    pill: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    btn: 'bg-indigo-50/80 text-indigo-900 border-indigo-300 hover:border-indigo-400',
    dot: 'bg-indigo-600',
    stripe: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'IN_REVIEW', label: 'In Review',
    pill: 'bg-amber-100 text-amber-900 border-amber-300',
    btn: 'bg-amber-50/80 text-amber-900 border-amber-300 hover:border-amber-400',
    dot: 'bg-amber-500',
    stripe: 'from-amber-400 to-orange-500',
  },
  {
    id: 'COMPLETED', label: 'Done',
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    btn: 'bg-emerald-50/80 text-emerald-900 border-emerald-300 hover:border-emerald-400',
    dot: 'bg-emerald-600',
    stripe: 'from-emerald-400 to-teal-500',
  },
];

const PRIORITY_ITEMS = [
  { id: 'Critical', label: 'Critical', icon: ChevronsUp, color: 'text-rose-600', dot: 'bg-rose-600' },
  { id: 'High', label: 'High', icon: ArrowUp, color: 'text-orange-600', dot: 'bg-orange-500' },
  { id: 'Medium', label: 'Medium', icon: Minus, color: 'text-amber-600', dot: 'bg-amber-500' },
  { id: 'Low', label: 'Low', icon: ArrowDown, color: 'text-sky-600', dot: 'bg-sky-500' },
];

const LABEL_COLORS = [
  'bg-violet-100 text-violet-800 border-violet-300',
  'bg-sky-100    text-sky-800    border-sky-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-rose-100   text-rose-800   border-rose-300',
  'bg-amber-100  text-amber-800  border-amber-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
];

const DEFAULT_LABEL_SUGGESTIONS = ['BUG', 'FEATURE', 'ENHANCEMENT', 'DESIGN', 'URGENT', 'DOCUMENTATION'];

const dropV = {
  hidden: { opacity: 0, y: 6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.08 } },
};

/**
 * @param {{ isModal?: boolean; workspaceId?: string; taskId?: any; onClose?: () => void }} [props]
 */
export default function TaskView({ workspaceId: propWorkspaceId, taskId: propTaskId, isModal = false, onClose } = {}) {
  const params = useParams();
  const workspaceId = propWorkspaceId || params.workspaceId;
  const taskId = propTaskId || params.taskId;
  const navigate = useNavigate();

  const { tasks, updateTask, moveTask, deleteTask } = useTask();
  const { users, currentUser } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();

  const workspace = workspaces.find(w => w.id === workspaceId || w._id === workspaceId) || activeWorkspace;

  const found = tasks.find(t => t.id === taskId || t._id === taskId);
  const activeTask = found || {
    id: taskId || 'PROJ-1', title: 'Task Details', description: '', status: 'IN_PROGRESS',
    priority: 'High', points: 8, labels: [], assignee: null, reporter: null,
    attachments: [], createdAt: new Date().toISOString(),
  };

  /* ── State ── */
  const [viewMode, setViewMode] = useState(isModal ? 'modal' : 'page');
  const [title, setTitle] = useState(activeTask.title || 'Untitled Task');
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState(
    activeTask.description && activeTask.description !== 'No description.' && activeTask.description !== 'No description provided.'
      ? activeTask.description
      : ''
  );
  const [editingDesc, setEditingDesc] = useState(false);
  const [dueDate, setDueDate] = useState(activeTask.dueDate || '');
  const [activeTab, setActiveTab] = useState('comments');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [pointsEditing, setPointsEditing] = useState(false);
  const [pointsVal, setPointsVal] = useState(activeTask.points || 0);
  const [labels, setLabels] = useState(activeTask.labels || []);
  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [attachments, setAttachments] = useState(activeTask.attachments || []);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  /* Delete confirmation modal state */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileRef = useRef(null);
  const commentRef = useRef(null);
  const statusRef = useRef(null);
  const priorityRef = useRef(null);
  const assigneeRef = useRef(null);

  /* ── Effects ── */
  useEffect(() => {
    const onKey = (e) => {
      if (isModal && e.key === 'Escape') { onClose?.(); return; }
      if ((e.key === 'm' || e.key === 'M') &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); commentRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModal, onClose]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target)) setPriorityOpen(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setAssigneeOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const wsId = workspaceId || activeWorkspace?.id;
    if (!wsId) return;
    apiClient.get(`/invitations/workspace/${wsId}`)
      .then(r => setTeamMembers(Array.isArray(r.data) ? r.data : (r.data?.data || [])))
      .catch(() => { });
  }, [workspaceId, activeWorkspace?.id]);

  useEffect(() => {
    if (!activeTask.id && !activeTask._id) return;
    apiClient.get(`/comments/${activeTask.id || activeTask._id}`)
      .then(r => {
        if (Array.isArray(r.data)) {
          setComments(r.data.map(c => ({
            id: c._id || c.id,
            author: { name: c.user?.fullName || c.user?.name || 'Teammate', avatar: c.user?.photoURL || c.user?.avatar || `https://i.pravatar.cc/100?u=${c.user?._id}` },
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
            content: c.content || c.text || '',
          })));
        }
      })
      .catch(() => setComments([]));
  }, [activeTask.id, activeTask._id]);

  useEffect(() => {
    if (!activeTask) return;
    setTitle(activeTask.title || 'Untitled Task');
    setDescription(
      activeTask.description && activeTask.description !== 'No description.' && activeTask.description !== 'No description provided.'
        ? activeTask.description
        : ''
    );
    setDueDate(activeTask.dueDate || '');
    setPointsVal(activeTask.points || 0);
    setLabels(activeTask.labels || []);
    setAttachments(activeTask.attachments || []);
  }, [activeTask.id, activeTask._id, activeTask.title, activeTask.description, activeTask.assignee, activeTask.dueDate]);

  const changeDueDate = async (val) => {
    setDueDate(val);
    try {
      if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, { dueDate: val });
      }
      activeTask.dueDate = val;
    } catch { }
  };

  /* ── Assignee helpers ── */
  const assignableMembers = useMemo(() => {
    const map = new Map();
    if (currentUser) {
      const id = String(currentUser.id || currentUser._id || '');
      map.set(id, { id, name: currentUser.fullName || currentUser.name || 'You', email: currentUser.email || '', avatar: currentUser.photoURL || currentUser.avatar || `https://i.pravatar.cc/150?u=me`, role: 'You' });
    }
    (users || []).forEach(u => {
      const id = String(u.id || u._id || '');
      if (id && !map.has(id)) map.set(id, { id, name: u.fullName || u.name || u.email, email: u.email || '', avatar: u.photoURL || u.avatar || `https://i.pravatar.cc/150?u=${id}`, role: u.role || 'Member' });
    });
    (teamMembers || []).forEach(m => {
      const id = String(m.userId || m.id || m._id || '');
      if (id && !map.has(id)) map.set(id, { id, name: m.name || m.fullName || m.email, email: m.email || '', avatar: m.avatarUrl || m.avatar || `https://i.pravatar.cc/150?u=${id}`, role: m.role || 'Member' });
    });
    return Array.from(map.values());
  }, [currentUser, users, teamMembers]);

  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch.trim()) return assignableMembers;
    const q = assigneeSearch.toLowerCase();
    return assignableMembers.filter(m => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
  }, [assignableMembers, assigneeSearch]);

  /* ── Handlers ── */
  const saveTitle = async () => {
    setEditingTitle(false);
    if (!title.trim()) return;
    try { if (updateTask && (activeTask.id || activeTask._id)) await updateTask(activeTask.id || activeTask._id, { title }); } catch { }
  };

  const saveDesc = async () => {
    setEditingDesc(false);
    try { if (updateTask && (activeTask.id || activeTask._id)) await updateTask(activeTask.id || activeTask._id, { description }); } catch { }
  };

  const changeStatus = async (val) => {
    setStatusOpen(false);
    try {
      if (moveTask && (activeTask.id || activeTask._id)) await moveTask(activeTask.id || activeTask._id, val);
      else if (updateTask && (activeTask.id || activeTask._id)) await updateTask(activeTask.id || activeTask._id, { status: val });
      activeTask.status = val;
    } catch { }
  };

  const changePriority = async (val) => {
    setPriorityOpen(false);
    try { if (updateTask && (activeTask.id || activeTask._id)) await updateTask(activeTask.id || activeTask._id, { priority: val }); activeTask.priority = val; } catch { }
  };

  const changeAssignee = async (member) => {
    setAssigneeOpen(false);
    const newId = member ? (member.id || member._id) : null;
    const newUser = member ? { _id: newId, id: newId, fullName: member.name, name: member.name, email: member.email, photoURL: member.avatar } : null;
    activeTask.assignee = newId;
    activeTask.assigneeUser = newUser;
    try { if (updateTask && (activeTask.id || activeTask._id)) await updateTask(activeTask.id || activeTask._id, { assignee: newId, assigneeUser: newUser }); } catch { }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSavingComment(true);
    const entry = { id: 'c-' + Date.now(), author: { name: currentUser?.fullName || currentUser?.name || 'You', avatar: currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/150?u=me' }, createdAt: 'Just now', content: newComment.trim() };
    setComments(prev => [...prev, entry]);
    const text = newComment.trim();
    setNewComment('');
    try { if (activeTask.id || activeTask._id) await apiClient.post(`/comments/${activeTask.id || activeTask._id}`, { content: text }); } catch { }
    finally { setSavingComment(false); }
  };

  const addLabel = (labelVal) => {
    const text = typeof labelVal === 'string' ? labelVal : newLabel;
    if (!text || !text.trim()) return;
    const tag = text.trim().toUpperCase();
    if (!labels.includes(tag)) {
      const updated = [...labels, tag];
      setLabels(updated);
      if (updateTask && (activeTask.id || activeTask._id)) updateTask(activeTask.id || activeTask._id, { labels: updated });
    }
    setNewLabel('');
    setAddingLabel(false);
  };

  const removeLabel = (tagToRemove) => {
    const updated = labels.filter(l => l !== tagToRemove);
    setLabels(updated);
    if (updateTask && (activeTask.id || activeTask._id)) updateTask(activeTask.id || activeTask._id, { labels: updated });
  };

  const uploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const att = { id: 'att-' + Date.now(), name: file.name, type: isImg ? 'image' : 'file', url: isImg ? URL.createObjectURL(file) : null, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` };
    const updated = [...attachments, att];
    setAttachments(updated);
    if (updateTask && (activeTask.id || activeTask._id)) updateTask(activeTask.id || activeTask._id, { attachments: updated });
  };

  const removeAttachment = (id) => {
    const updated = attachments.filter(a => a.id !== id);
    setAttachments(updated);
    if (updateTask && (activeTask.id || activeTask._id)) updateTask(activeTask.id || activeTask._id, { attachments: updated });
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const savePoints = () => {
    setPointsEditing(false);
    if (updateTask && (activeTask.id || activeTask._id)) updateTask(activeTask.id || activeTask._id, { points: pointsVal });
  };

  /* Delete Task Action */
  const handleDeleteTask = async () => {
    const targetId = activeTask.id || activeTask._id;
    if (!targetId) return;
    setIsDeleting(true);
    try {
      if (deleteTask) {
        await deleteTask(targetId);
      } else {
        await apiClient.delete(`/tasks/${targetId}`);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      if (isModal) {
        onClose?.();
      } else {
        navigate(-1);
      }
    }
  };

  /* ── Derived ── */
  const status = STATUS_ITEMS.find(s => s.id === (activeTask.status || 'IN_PROGRESS')) || STATUS_ITEMS[1];
  const priority = PRIORITY_ITEMS.find(p => p.id.toLowerCase() === (activeTask.priority || 'high').toLowerCase()) || PRIORITY_ITEMS[1];
  const teamName = workspace?.name || 'Workspace';

  const assignee = useMemo(() => {
    const aId = String(activeTask.assignee || activeTask.assigneeId || activeTask.assigneeUser?._id || activeTask.assigneeUser?.id || '');
    if (!aId) return null;
    const m = assignableMembers.find(x => String(x.id || x._id) === aId);
    if (m) return m;
    if (activeTask.assigneeUser?.fullName || activeTask.assigneeUser?.name)
      return { id: aId, name: activeTask.assigneeUser.fullName || activeTask.assigneeUser.name, avatar: activeTask.assigneeUser.photoURL || `https://i.pravatar.cc/150?u=${aId}`, email: activeTask.assigneeUser.email || '' };
    return { id: aId, name: typeof activeTask.assignee === 'string' ? activeTask.assignee : 'Assignee', avatar: `https://i.pravatar.cc/150?u=${aId}` };
  }, [activeTask.assignee, activeTask.assigneeUser, assignableMembers]);

  const reporter = useMemo(() => {
    if (activeTask.reporterUser?.fullName || activeTask.reporterUser?.name)
      return { name: activeTask.reporterUser.fullName || activeTask.reporterUser.name, avatar: activeTask.reporterUser.photoURL || 'https://i.pravatar.cc/150?u=reporter' };
    if (currentUser) return { name: currentUser.fullName || currentUser.name || 'Reporter', avatar: currentUser.photoURL || currentUser.avatar || 'https://i.pravatar.cc/150?u=me' };
    return { name: 'Reporter', avatar: 'https://i.pravatar.cc/150?u=reporter' };
  }, [activeTask.reporterUser, currentUser]);

  /* ═══════════════════════════════════════════════════════════════
     MAIN VIEW RENDER
  ═══════════════════════════════════════════════════════════════ */
  const page = (
    <div className="flex flex-col h-full bg-slate-100/90 font-sans text-slate-900 select-text"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border-2 border-rose-200 shadow-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Delete Task</h3>
                  <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                Are you sure you want to permanently delete <strong className="text-slate-900">"{title}"</strong>?
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Task'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-slate-300 shadow-sm sticky top-0 z-30">
        <div className={`h-1 w-full bg-gradient-to-r ${status.stripe}`} />

        <div className="px-5 py-3 flex items-center justify-between gap-4">
          {/* Left side: Workspace name / Task / Task Title on the same line */}
          <div className="flex items-center gap-2 text-slate-600 truncate flex-1 font-semibold min-w-0">
            <span className="text-slate-700 text-xs sm:text-sm font-bold shrink-0 truncate max-w-[140px] sm:max-w-[200px]" title={teamName}>
              {teamName}
            </span>
            <span className="text-slate-300 font-medium">/</span>

            {/* Task Name (inline editable) */}
            {editingTitle ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-lg">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => e.key === 'Enter' && saveTitle()}
                  autoFocus
                  className="w-full text-sm sm:text-base font-extrabold text-slate-900 bg-white border-2 border-indigo-600 rounded-lg px-3 py-1 focus:outline-none shadow-sm"
                />
                <button onClick={saveTitle} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg cursor-pointer shadow-xs shrink-0">
                  Save
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group hover:text-indigo-600 transition-colors"
                title="Click to edit title"
              >
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 truncate leading-snug group-hover:text-indigo-600">
                  {title || 'Untitled Task'}
                </h1>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
              </div>
            )}

            {/* Status pill badge on header */}
            <span className={`hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ml-2 shrink-0 ${status.pill}`}>
              {status.label}
            </span>

            {/* Hidden file input for attachments uploads anywhere in TaskView */}
            <input ref={fileRef} type="file" onChange={uploadFile} className="hidden" />
          </div>

          {/* Right side: Mode Switcher, Delete, Share, Close X buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setViewMode('page')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${viewMode === 'page' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                title="Normal Page View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Page</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('modal')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${viewMode === 'modal' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                title="Modal Overlay View"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modal</span>
              </button>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Share Button */}
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${copiedLink ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'}`}
              title="Share link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Close X Button at far right */}
            <button
              onClick={() => isModal ? onClose?.() : navigate(-1)}
              className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
              title={isModal ? 'Close (Esc)' : 'Go back'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Labels row if tags are active */}
        {labels.length > 0 && (
          <div className="px-5 pb-2 -mt-0.5 flex flex-wrap gap-1.5 items-center">
            {labels.map((lbl, i) => (
              <span key={lbl} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs ${LABEL_COLORS[i % LABEL_COLORS.length]}`}>
                <Tag className="w-2.5 h-2.5" />
                <span>{lbl}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeLabel(lbl); }}
                  className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-rose-600"
                  title={`Remove ${lbl}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ── BODY GRID ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ── LEFT COLUMN ─────────────────────────── */}
          <div className="lg:col-span-8 space-y-4">

            {/* Quick action toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Attach File', icon: Paperclip, onClick: () => fileRef.current?.click() },
                { label: 'Link Issue', icon: Link2, onClick: () => { } },
              ].map(btn => (
                <button key={btn.label} onClick={btn.onClick}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer">
                  <btn.icon className="w-3.5 h-3.5 text-indigo-600" />
                  {btn.label}
                </button>
              ))}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-300 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Task</span>
              </button>
            </div>

            {/* ── DESCRIPTION ── */}
            <Card title="Description" icon={FileText}
              action={!editingDesc && (
                <button onClick={() => setEditingDesc(true)} className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-800 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            >
              {editingDesc ? (
                <div className="space-y-3">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Add description..."
                    className="w-full bg-slate-50 border-2 border-indigo-500 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white resize-y leading-relaxed shadow-inner"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingDesc(false)} className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer">Cancel</button>
                    <button onClick={saveDesc} className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md">Save Description</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => setEditingDesc(true)}
                  className="text-sm text-slate-800 leading-relaxed whitespace-pre-line cursor-pointer min-h-[60px] p-3 -mx-1 border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl transition-all font-normal">
                  {description || <span className="text-slate-400 italic">Add description...</span>}
                </div>
              )}
            </Card>

            {/* ── ATTACHMENTS ── */}
            <Card
              title={`Attachments ${attachments.length ? `(${attachments.length})` : ''}`}
              icon={Paperclip}
              action={
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-indigo-700 font-extrabold hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Upload File
                </button>
              }
            >
              {attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {attachments.map(att => (
                    <div key={att.id} className="group bg-slate-50 border border-slate-300 rounded-xl overflow-hidden hover:border-indigo-400 hover:shadow-md transition-all flex flex-col">
                      {att.type === 'image' && att.url
                        ? <img src={att.url} alt={att.name} className="w-full h-28 object-cover" />
                        : (
                          <div className="h-28 flex items-center justify-center bg-indigo-50/50 border-b border-slate-200">
                            <div className="w-10 h-12 bg-white rounded-xl border border-indigo-200 flex items-center justify-center shadow-xs">
                              <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                          </div>
                        )
                      }
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 mt-auto">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                          {att.size && <p className="text-[10px] text-slate-500 font-medium">{att.size}</p>}
                        </div>
                        <button onClick={() => removeAttachment(att.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer shrink-0" title="Delete file">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all group">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Paperclip className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors">Click or drag files here to upload</p>
                  <p className="text-[11px] text-slate-500 font-medium">Supports images, documents, and archives</p>
                </button>
              )}
            </Card>

            {/* ── ACTIVITY & COMMENTS ── */}
            <Card noPad>
              <div className="flex items-center border-b border-slate-300 bg-slate-100/70 px-4 pt-2.5 gap-1">
                {[
                  { id: 'comments', label: 'Comments', badge: comments.length || null, icon: MessageSquare },
                  { id: 'history', label: 'Audit Log', icon: History },
                  { id: 'worklog', label: 'Work Log', icon: Timer },
                ].map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer border ${active ? 'text-indigo-800 bg-white border-slate-300 border-b-white -mb-px shadow-2xs' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
                      <tab.icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                      {typeof tab.badge === 'number' && tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${active ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>{tab.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {activeTab === 'comments' && (
                  <div className="space-y-5">
                    {comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map(c => (
                          <div key={c.id} className="flex items-start gap-3.5 group">
                            <img src={c.author?.avatar || 'https://i.pravatar.cc/100?u=u'} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200 shrink-0 mt-0.5" />
                            <div className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl rounded-tl-sm p-4 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-extrabold text-slate-900">{c.author?.name || 'Teammate'}</span>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                  <span>{c.createdAt}</span>
                                  <button onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))} className="opacity-0 group-hover:opacity-100 hover:text-rose-600 font-bold transition-all cursor-pointer">Delete</button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-800 leading-relaxed font-normal">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <MessageSquare className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-slate-800">No comments yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Be the first to share notes or feedback with your team</p>
                      </div>
                    )}

                    {/* Composer */}
                    <div className="flex items-start gap-3 pt-2">
                      <img src={currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-300 shrink-0 mt-1" />
                      <form onSubmit={postComment} className="flex-1">
                        <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all shadow-xs">
                          <textarea
                            ref={commentRef}
                            rows={3} value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-transparent p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed font-normal"
                          />
                          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-slate-500">
                              {[Bold, Italic, LinkIcon].map((Icon, i) => (
                                <button key={i} type="button" className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer">
                                  <Icon className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                            <button type="submit" disabled={savingComment || !newComment.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold px-4 py-1.5 rounded-xl transition-colors cursor-pointer shadow-sm">
                              {savingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                          Press <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 rounded text-[9px] font-mono font-bold text-slate-700">M</kbd> to focus comment box
                        </p>
                      </form>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-2.5">
                    {[
                      { icon: CheckCircle2, text: `Status set to ${status.label}`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                      { icon: AlertCircle, text: `Assignee set to ${assignee ? assignee.name : 'Unassigned'}`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
                      { icon: Clock, text: `Task created on ${new Date(activeTask.createdAt || Date.now()).toLocaleString()}`, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold ${item.bg}`}>
                        <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                        <span className="text-slate-800">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'worklog' && (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Timer className="w-8 h-8 text-indigo-500 mb-2" />
                    <p className="text-xs font-extrabold text-slate-800">Work Log Summary</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Estimated effort: <strong className="text-indigo-700 font-extrabold">{pointsVal || 0} story points</strong></p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN (SIDEBAR) ─────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">

            {/* STATUS CARD */}
            <div ref={statusRef} className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4">
              <SideLabel>Status</SideLabel>
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setStatusOpen(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-extrabold border-2 shadow-2xs transition-colors cursor-pointer ${status.btn}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                    <span className="uppercase tracking-wider">{status.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {statusOpen && (
                    <motion.div variants={dropV} initial="hidden" animate="visible" exit="exit"
                      className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                      {STATUS_ITEMS.map(st => {
                        const sel = st.id === status.id;
                        return (
                          <button key={st.id} onClick={() => changeStatus(st.id)}
                            className={`w-full px-4 py-2.5 text-left text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer ${sel ? `${st.btn}` : 'text-slate-800 hover:bg-slate-100'}`}>
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />{st.label}
                            </div>
                            {sel && <Check className="w-4 h-4 text-indigo-700" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* DETAILS CARD */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 space-y-4">
              <SideLabel>Details</SideLabel>

              {/* Assignee */}
              <DetailRow label="Assignee">
                <div ref={assigneeRef} className="relative flex-1">
                  <button type="button" onClick={() => setAssigneeOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-2 bg-slate-50 hover:bg-indigo-50/60 border border-slate-300 hover:border-indigo-400 rounded-xl px-3 py-2 transition-colors cursor-pointer shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {assignee ? (
                        <>
                          <img src={assignee.avatar || `https://i.pravatar.cc/150?u=${assignee.id}`} alt="" className="w-5 h-5 rounded-full object-cover ring-2 ring-indigo-200 shrink-0" />
                          <span className="text-xs font-extrabold text-slate-900 truncate">{assignee.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><UserX className="w-3.5 h-3.5 text-slate-500" /></div>
                          <span className="text-xs text-slate-500 font-semibold italic">Unassigned</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${assigneeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {assigneeOpen && (
                      <motion.div variants={dropV} initial="hidden" animate="visible" exit="exit"
                        className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-2">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input type="text" value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)}
                            placeholder="Search teammates..." autoFocus
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 font-semibold" />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          <button onClick={() => changeAssignee(null)}
                            className={`w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${!assignee ? 'bg-indigo-50 text-indigo-800 font-extrabold' : 'hover:bg-slate-100 text-slate-700'}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><UserX className="w-3 h-3 text-slate-600" /></div>
                              Unassigned
                            </div>
                            {!assignee && <Check className="w-3.5 h-3.5" />}
                          </button>
                          {filteredAssignees.map(m => {
                            const sel = assignee && String(assignee.id) === String(m.id || m._id);
                            return (
                              <button key={m.id || m._id} onClick={() => changeAssignee(m)}
                                className={`w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${sel ? 'bg-indigo-50 text-indigo-800 font-extrabold' : 'hover:bg-slate-100 text-slate-800'}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={m.avatar} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-extrabold truncate">{m.name}</p>
                                    {m.email && <p className="text-[10px] text-slate-500 font-medium truncate">{m.email}</p>}
                                  </div>
                                </div>
                                {sel && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-700" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </DetailRow>

              {/* Reporter */}
              <DetailRow label="Reporter">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 shadow-2xs">
                  <img src={reporter.avatar} alt="" className="w-5 h-5 rounded-full object-cover ring-2 ring-white shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900">{reporter.name}</span>
                </div>
              </DetailRow>

              {/* Priority */}
              <DetailRow label="Priority">
                <div ref={priorityRef} className="relative flex-1">
                  <button type="button" onClick={() => setPriorityOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer shadow-2xs">
                    <div className={`flex items-center gap-2 text-xs font-extrabold ${priority.color}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${priorityOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {priorityOpen && (
                      <motion.div variants={dropV} initial="hidden" animate="visible" exit="exit"
                        className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 py-1">
                        {PRIORITY_ITEMS.map(p => {
                          const sel = p.id.toLowerCase() === priority.id.toLowerCase();
                          return (
                            <button key={p.id} onClick={() => changePriority(p.id)}
                              className={`w-full px-4 py-2.5 text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer ${sel ? `bg-indigo-50 ${p.color}` : 'text-slate-800 hover:bg-slate-100'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />{p.label}
                              </div>
                              {sel && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </DetailRow>

              {/* Due Date */}
              <DetailRow label="Due Date">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 flex-1 shadow-2xs hover:border-indigo-400 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => changeDueDate(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => changeDueDate('')}
                      className="text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer"
                      title="Clear due date"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </DetailRow>

              {/* Labels */}
              <DetailRow label="Labels" align="start">
                <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                  {labels.map((lbl, i) => (
                    <span key={lbl} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${LABEL_COLORS[i % LABEL_COLORS.length]}`}>
                      <Tag className="w-2.5 h-2.5" />
                      <span>{lbl}</span>
                      <button
                        type="button"
                        onClick={() => removeLabel(lbl)}
                        className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-slate-500 hover:text-rose-600"
                        title={`Remove ${lbl}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {addingLabel ? (
                    <div className="flex flex-col gap-1.5 w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl mt-1 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={e => setNewLabel(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addLabel(newLabel)}
                          placeholder="TAG NAME"
                          autoFocus
                          className="flex-1 text-[10px] font-extrabold uppercase px-2 py-1 bg-white border border-indigo-400 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => addLabel(newLabel)}
                          className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 cursor-pointer shadow-xs"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingLabel(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                        <span className="text-[9px] font-extrabold text-slate-400 w-full uppercase tracking-wider">Quick Suggestions:</span>
                        {DEFAULT_LABEL_SUGGESTIONS.filter(s => !labels.includes(s)).map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => addLabel(sugg)}
                            className="px-2 py-0.5 text-[9px] font-extrabold bg-white border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-md transition-colors cursor-pointer"
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingLabel(true)}
                      className="px-2.5 py-1 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer text-[10px] font-extrabold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      <span>Add Label</span>
                    </button>
                  )}
                </div>
              </DetailRow>

              {/* Story Points */}
              <DetailRow label="Story Pts">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 flex-1 shadow-2xs">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {pointsEditing ? (
                    <input type="number" value={pointsVal} onChange={e => setPointsVal(Number(e.target.value))}
                      onBlur={savePoints} onKeyDown={e => e.key === 'Enter' && savePoints()}
                      autoFocus className="flex-1 bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none" />
                  ) : (
                    <span onClick={() => setPointsEditing(true)} className="text-xs font-extrabold text-slate-900 cursor-pointer flex-1">{pointsVal || 0} pts</span>
                  )}
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => setPointsEditing(true)} />
                </div>
              </DetailRow>
            </div>

            {/* SPRINT & METADATA CARD */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">{teamName} Sprint</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Active iteration</p>
                </div>
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Active</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>Created {new Date(activeTask.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs"
        onClick={e => { if (e.target === e.currentTarget) { if (isModal) onClose?.(); else setViewMode('page'); } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-5xl h-[90vh] max-h-[92vh] overflow-hidden rounded-2xl border-2 border-slate-300 shadow-2xl flex flex-col bg-white"
          onClick={e => e.stopPropagation()}
        >
          {page}
        </motion.div>
      </div>
    );
  }

  return page;
}

/* ─── Helper components ──────────────────────────────────────── */
function Card({ title = null, icon: Icon = null, action = null, children = null, noPad = false }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-indigo-600" />}
            {title && <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{title}</span>}
          </div>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-3.5 sm:p-4'}>{children}</div>
    </div>
  );
}

function SideLabel({ children }) {
  return <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">{children}</div>;
}

function DetailRow({ label, children, align = 'center' }) {
  return (
    <div className={`flex ${align === 'start' ? 'items-start' : 'items-center'} gap-3`}>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 w-20 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
