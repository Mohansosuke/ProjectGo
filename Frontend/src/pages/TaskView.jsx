import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Paperclip, Send, ChevronRight, ChevronDown,
  X, CheckCircle2, AlertCircle, Flag, Plus, Trash2, Tag,
  MoreHorizontal, User, MessageSquare, Sparkles, CheckSquare,
  Copy, ArrowLeft, Download, FileText, Share2, Layers, Check,
  Flame, AlertTriangle, HelpCircle
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, WorkspaceLogo } from '../components/ui';
import apiClient from '../services/apiClient';

const memberAvatars = {
  u1: 'https://i.pravatar.cc/80?img=12',
  u2: 'https://i.pravatar.cc/80?img=47',
  u3: 'https://i.pravatar.cc/80?img=15',
};

const STATUS_OPTIONS = [
  { id: 'TODO', label: 'To Do', dot: 'bg-blue-400', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'IN_REVIEW', label: 'In Review', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'COMPLETED', label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const PRIORITY_OPTIONS = [
  { id: 'Critical', label: 'Critical', color: 'text-rose-600', dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200' },
  { id: 'High', label: 'High', color: 'text-orange-600', dot: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { id: 'Medium', label: 'Medium', color: 'text-blue-600', dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { id: 'Low', label: 'Low', color: 'text-slate-500', dot: 'bg-slate-400', bg: 'bg-slate-50 border-slate-200' },
];

export default function TaskView() {
  const { workspaceId, taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask } = useTask();
  const { users, currentUser } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();
  const userRole = activeWorkspace?.userRole || 'Member';
  const isViewer = userRole === 'Viewer';

  const workspace = workspaces.find(w => w.id === workspaceId) || activeWorkspace;

  const taskFound = tasks.find(t => t.id === taskId || t._id === taskId);
  const activeTask = taskFound || {
    id: taskId || 't1',
    title: 'Task Details',
    description: '',
    status: 'TODO',
    priority: 'Medium',
    points: 3,
    assignee: null,
    reporter: null,
    dueDate: '',
    labels: ['FEATURE']
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(activeTask.title || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(activeTask.description || '');

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state values when active task changes and fetch comments from backend
  useEffect(() => {
    if (activeTask) {
      setSubtasks(activeTask.subtasks || []);
      setAttachments(activeTask.attachments || []);
      setEditedTitle(activeTask.title || '');
      setEditedDesc(activeTask.description || '');

      const fetchComments = async () => {
        try {
          const res = await apiClient.get(`/comments/${activeTask.id || activeTask._id}`);
          setComments(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          setComments([]);
        }
      };

      if (activeTask.id || activeTask._id) {
        fetchComments();
      }
    }
  }, [activeTask?.id, activeTask?._id]);

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!workspaceId) return;
      try {
        const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setWorkspaceMembers(list);
      } catch (err) {
        setWorkspaceMembers([]);
      }
    };
    fetchWorkspaceMembers();
  }, [workspaceId]);

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    setIsEditingTitle(false);
    await updateTask(activeTask.id || activeTask._id, { title: editedTitle.trim() });
  };

  const handleSaveDesc = async () => {
    setIsEditingDesc(false);
    await updateTask(activeTask.id || activeTask._id, { description: editedDesc });
  };

  const handleStatusSelect = async (newStatus) => {
    if (isViewer) return;
    await updateTask(activeTask.id || activeTask._id, { status: newStatus });
  };

  const handlePrioritySelect = async (newPriority) => {
    if (isViewer) return;
    await updateTask(activeTask.id || activeTask._id, { priority: newPriority });
  };

  const handleAssigneeChange = async (memberId) => {
    if (isViewer) return;
    await updateTask(activeTask.id || activeTask._id, { assignee: memberId || null });
  };

  const handleDueDateChange = async (date) => {
    if (isViewer) return;
    await updateTask(activeTask.id || activeTask._id, { dueDate: date || null });
  };

  const handlePointsChange = async (pts) => {
    if (isViewer) return;
    await updateTask(activeTask.id || activeTask._id, { points: parseInt(pts) || 0 });
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (isViewer || !newSubtaskTitle.trim()) return;
    const newItem = { id: `sb_${Date.now()}`, title: newSubtaskTitle.trim(), done: false };
    const updated = [...subtasks, newItem];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    await updateTask(activeTask.id || activeTask._id, { subtasks: updated });
  };

  const handleToggleSubtask = async (id) => {
    if (isViewer) return;
    const updated = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updated);
    await updateTask(activeTask.id || activeTask._id, { subtasks: updated });
  };

  const handleDeleteSubtask = async (id) => {
    if (isViewer) return;
    const updated = subtasks.filter(s => s.id !== id);
    setSubtasks(updated);
    await updateTask(activeTask.id || activeTask._id, { subtasks: updated });
  };

  const handleAddTag = async (e) => {
    e?.preventDefault?.();
    if (isViewer || !newTagInput.trim()) return;
    const currentTags = activeTask.labels || [];
    const cleanTag = newTagInput.trim().toUpperCase();
    if (!currentTags.includes(cleanTag)) {
      const updated = [...currentTags, cleanTag];
      await updateTask(activeTask.id || activeTask._id, { labels: updated });
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tagToRemove) => {
    if (isViewer) return;
    const currentTags = activeTask.labels || [];
    const updated = currentTags.filter(t => t !== tagToRemove);
    await updateTask(activeTask.id || activeTask._id, { labels: updated });
  };

  const handleFileUpload = (e) => {
    if (isViewer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileData = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        data: reader.result,
        uploadedAt: new Date().toISOString()
      };
      const updated = [...attachments, fileData];
      setAttachments(updated);
      await updateTask(activeTask.id || activeTask._id, { attachments: updated });
    };
    reader.readAsDataURL(file);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (isViewer || !newComment.trim()) return;
    try {
      const res = await apiClient.post(`/comments/${activeTask.id || activeTask._id}`, { text: newComment.trim() });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDeleteTask = async () => {
    if (isViewer) return;
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      await deleteTask(activeTask.id || activeTask._id);
      navigate(`/workspace/${workspaceId}/kanban`);
    }
  };

  // Find user details
  const getMember = (id) => {
    if (!id) return null;
    return workspaceMembers.find(m => m.id === id || m._id === id) ||
           users?.find(u => u.id === id || u._id === id) ||
           (activeTask.assigneeUser && (activeTask.assigneeUser._id === id || activeTask.assigneeUser.id === id) ? activeTask.assigneeUser : null);
  };

  const currentAssignee = getMember(activeTask.assignee);
  const currentStatusObj = STATUS_OPTIONS.find(s => s.id === activeTask.status) || STATUS_OPTIONS[0];
  const currentPriorityObj = PRIORITY_OPTIONS.find(p => p.id?.toLowerCase() === (activeTask.priority || '').toLowerCase()) || PRIORITY_OPTIONS[2];

  const completedSubtasks = subtasks.filter(s => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none pb-16">
      
      {/* ── Top App Bar / Actions Strip ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        {/* Breadcrumb Left */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 min-w-0">
          <Link
            to={`/workspace/${workspaceId}/kanban`}
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sprint Board</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-bold text-slate-800 uppercase tracking-wide truncate">
            {activeTask.id || activeTask._id || 'Task'}
          </span>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
            title="Copy link to task"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {!isViewer && (
            <button
              onClick={handleDeleteTask}
              className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-all cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            onClick={() => navigate(`/workspace/${workspaceId}/kanban`)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content Two-Column Grid ── */}
      <div className="max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ═══════════════════════════════════════════════════════
            LEFT COLUMN: Title, Description, Subtasks, Comments (7/12)
        ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Task Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Status & Priority Chip Badges Header */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Selector */}
              <div className="relative">
                <select
                  disabled={isViewer}
                  value={activeTask.status}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                  className={`h-8 pl-3 pr-8 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer appearance-none ${currentStatusObj.bg}`}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>
                      ● {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Priority Selector */}
              <div className="relative">
                <select
                  disabled={isViewer}
                  value={activeTask.priority}
                  onChange={(e) => handlePrioritySelect(e.target.value)}
                  className={`h-8 pl-3 pr-8 rounded-xl text-xs font-extrabold border transition-all cursor-pointer appearance-none ${currentPriorityObj.bg} ${currentPriorityObj.color}`}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.id} value={p.id}>
                      ⚑ {p.label} Priority
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Tags List */}
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {(activeTask.labels || []).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    #{tag}
                    {!isViewer && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {!isViewer && (
                  showTagInput ? (
                    <form onSubmit={handleAddTag} className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tag name…"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none uppercase"
                      />
                      <button type="submit" className="text-xs text-indigo-600 font-bold px-1">Add</button>
                      <button type="button" onClick={() => setShowTagInput(false)} className="text-xs text-slate-400 px-1">×</button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-[11px] font-semibold text-slate-400 transition-colors cursor-pointer"
                    >
                      + Tag
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Editable Title */}
            <div>
              {isEditingTitle ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={2}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveTitle();
                      }
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    className="w-full text-2xl font-black text-slate-900 border-2 border-indigo-500 rounded-xl p-2.5 focus:outline-none resize-none leading-snug"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTitle}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                    >
                      Save Title
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h1
                  onClick={() => !isViewer && setIsEditingTitle(true)}
                  className={`text-2xl font-black text-slate-900 leading-tight tracking-tight p-1.5 -ml-1.5 rounded-xl transition-all ${
                    !isViewer ? 'hover:bg-slate-100/80 cursor-pointer' : ''
                  }`}
                  title={!isViewer ? "Click to edit title" : undefined}
                >
                  {activeTask.title || 'Untitled Task'}
                </h1>
              )}
            </div>

            {/* Editable Description */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Description</span>
                {!isViewer && !isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={4}
                    value={editedDesc}
                    placeholder="Add detailed task specifications, requirements, or links…"
                    onChange={(e) => setEditedDesc(e.target.value)}
                    className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDesc}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                    >
                      Save Description
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isViewer && setIsEditingDesc(true)}
                  className={`min-h-[60px] p-3 rounded-xl text-sm leading-relaxed text-slate-600 ${
                    !isViewer ? 'hover:bg-slate-50/80 cursor-pointer' : ''
                  } ${!activeTask.description ? 'italic text-slate-400 bg-slate-50/50' : 'bg-slate-50/40'}`}
                >
                  {activeTask.description || (isViewer ? 'No description provided.' : 'Click to add a task description…')}
                </div>
              )}
            </div>
          </div>

          {/* ── Subtasks & Checklist Card ── */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Subtasks & Milestones</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {completedSubtasks} of {subtasks.length} ({subtaskProgress}%)
              </span>
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subtaskProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                />
              </div>
            )}

            {/* Subtask Items List */}
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                >
                  <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isViewer}
                      checked={!!s.done}
                      onChange={() => handleToggleSubtask(s.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold truncate ${s.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {s.title}
                    </span>
                  </label>
                  {!isViewer && (
                    <button
                      onClick={() => handleDeleteSubtask(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      title="Remove subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            {!isViewer && (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a new subtask or checklist item… (Press Enter)"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-400 font-medium"
                />
                <Button type="submit" size="sm" className="h-9 px-3 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </form>
            )}
          </div>

          {/* ── Discussion & Comments Card ── */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Activity & Discussion ({comments.length})
              </h3>
            </div>

            {/* Comments Stream */}
            <div className="space-y-3 pt-1">
              {comments.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400 font-medium">No comments yet. Start the conversation below!</p>
                </div>
              ) : (
                comments.map((c, i) => {
                  const author = c.author || {};
                  return (
                    <div key={c._id || c.id || i} className="flex gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <img
                        src={author.photoURL || author.avatar || memberAvatars.u1}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">
                            {author.fullName || author.name || 'Team Member'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* New Comment Input */}
            {!isViewer && (
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Write a comment or update… (@mention teammates)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-400 font-medium"
                />
                <Button type="submit" size="sm" className="h-9 px-3.5 text-xs">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT COLUMN: Inspector / Properties Sidebar (4/12)
        ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Metadata Inspector Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              Task Properties
            </h3>

            {/* Assignee Card */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assignee</label>
              <div className="relative">
                <select
                  disabled={isViewer}
                  value={activeTask.assignee || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="">👤 Unassigned</option>
                  {workspaceMembers.map(m => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {currentAssignee && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 mt-1">
                  <img
                    src={currentAssignee.photoURL || currentAssignee.avatar || memberAvatars.u1}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentAssignee.name || currentAssignee.email}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentAssignee.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Due Date Card */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  disabled={isViewer}
                  value={activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString('en-CA') : ''}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-sans"
                />
              </div>
            </div>

            {/* Story Points */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Story Points / Estimate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={isViewer}
                  value={activeTask.points || 0}
                  onChange={(e) => handlePointsChange(e.target.value)}
                  className="w-20 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 text-center focus:outline-none focus:border-indigo-400"
                />
                <span className="text-xs text-slate-500 font-semibold">points estimate</span>
              </div>
            </div>

            {/* Workspace Context */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Workspace</label>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <WorkspaceLogo workspace={workspace} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{workspace?.name || 'Workspace'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{workspace?.subdomain || 'project'}.projectgo.io</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Attachments</h3>
              </div>
              {!isViewer && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  + Upload
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />

            {attachments.length === 0 ? (
              <div
                onClick={() => !isViewer && fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center ${
                  !isViewer ? 'hover:border-indigo-400 hover:bg-slate-50/60 cursor-pointer' : ''
                }`}
              >
                <Paperclip className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-400 font-medium">No files attached yet</p>
                {!isViewer && <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Click to upload files</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{file.size}</p>
                      </div>
                    </div>
                    {file.data && (
                      <a
                        href={file.data}
                        download={file.name}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
