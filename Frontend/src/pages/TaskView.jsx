import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Play, Paperclip, Smile, Send,
  ChevronRight, ChevronDown, X, CheckCircle2, AlertCircle, Flag,
  Plus, Layout, Folder, Check, Trash2, Tag, Maximize2,
  Minimize2, MoreHorizontal, Zap, User, MessageSquare, Star, Sparkles, Image, CheckSquare, Eye
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button } from '../components/ui';
import { TASK_PRIORITY_MAP, TASK_STATUSES, TASK_LABELS } from '../lib/constants';
import apiClient from '../services/apiClient';

const memberAvatars = {
  u1: 'https://i.pravatar.cc/80?img=12',
  u2: 'https://i.pravatar.cc/80?img=47',
  u3: 'https://i.pravatar.cc/80?img=15',
};

const STATUS_COLOR = {
  TODO:        { bg: 'bg-slate-100',   text: 'text-slate-650',  dot: 'bg-slate-400',   label: 'TO DO' },
  IN_PROGRESS: { bg: 'bg-blue-500',   text: 'text-white',      dot: 'bg-white',       label: 'IN PROGRESS' },
  IN_REVIEW:   { bg: 'bg-amber-500',  text: 'text-white',      dot: 'bg-white',       label: 'IN REVIEW' },
  COMPLETED:   { bg: 'bg-emerald-500',text: 'text-white',      dot: 'bg-white',       label: 'COMPLETED' },
};

export default function TaskView() {
  const { workspaceId, taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask } = useTask();
  const { users, currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const userRole = activeWorkspace?.userRole || 'Member';
  const isViewer = userRole === 'Viewer';

  const taskFound = tasks.find(t => t.id === taskId);
  const activeTask = taskFound || {
    id: taskId || 't1',
    title: 'Task Management Application',
    description: 'This task is for to create task management application front end only',
    status: 'TODO',
    priority: 'High',
    points: 5,
    assignee: 'u2',
    reporter: 'u1',
    dueDate: '2026-07-06',
    labels: ['FRONTEND']
  };

  const [layoutMode, setLayoutMode] = useState('Modal');
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(activeTask.title);
  
  const [checklist, setChecklist] = useState([]);
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const [subtasks, setSubtasks] = useState([]);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [attachments, setAttachments] = useState([]);

  const [comments, setComments] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [mentionSearch, setMentionSearch] = useState(null);

  // Sync state values when active task changes and fetch comments from backend
  useEffect(() => {
    if (activeTask) {
      setChecklist(activeTask.checklist || []);
      setSubtasks(activeTask.subtasks || []);
      setAttachments(activeTask.attachments || []);
      setEditedTitle(activeTask.title || '');

      const fetchComments = async () => {
        try {
          const res = await apiClient.get(`/comments/${activeTask.id}`);
          setComments(res.data);
        } catch (error) {
          console.error("Error loading task comments:", error);
          setComments([]);
        }
      };

      if (activeTask.id) {
        fetchComments();
      }
    }
  }, [activeTask.id]);

  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!workspaceId) return;
      try {
        const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
        setWorkspaceMembers(res.data);
      } catch (err) {
        console.error("Error loading workspace members in TaskView:", err);
      }
    };
    fetchWorkspaceMembers();
  }, [workspaceId]);

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setNewComment(val);

    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const lastWordMatch = textBeforeCursor.match(/@(\w*)$/);
    if (lastWordMatch) {
      setMentionSearch(lastWordMatch[1]);
    } else {
      setMentionSearch(null);
    }
  };

  const handleSelectMention = (memberName) => {
    const val = newComment;
    const lastWordIndex = val.lastIndexOf('@');
    if (lastWordIndex !== -1) {
      const updated = val.slice(0, lastWordIndex) + `@${memberName} ` + val.slice(lastWordIndex + (mentionSearch || '').length + 1);
      setNewComment(updated);
    }
    setMentionSearch(null);
  };

  const getUser = (id) => {
    if (!users?.length) return { name: 'Unassigned', avatar: memberAvatars.u1, email: '' };
    return users.find(u => u.id === id) || { name: 'Unassigned', avatar: `https://i.pravatar.cc/80?u=${id}`, email: '' };
  };

  const assignee = getUser(activeTask.assignee);
  const reporter = getUser(activeTask.reporter);
  const sColor = STATUS_COLOR[activeTask.status] || STATUS_COLOR.TODO;

  const handleClose = () => navigate(`/workspace/${workspaceId}/kanban`);

  const addComment = async () => {
    if (isViewer) return;
    if (!newComment.trim()) return;
    try {
      const res = await apiClient.post(`/comments/${activeTask.id}`, { text: newComment.trim() });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Functional: Checklist
  const addChecklistItem = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    if (!newChecklistItem.trim()) return;
    const newItem = { id: `ck_${Date.now()}`, text: newChecklistItem.trim(), done: false };
    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    setNewChecklistItem('');
    try {
      await updateTask(activeTask.id, { checklist: updatedChecklist });
    } catch (err) {
      console.error("Error adding checklist item:", err);
    }
  };

  const toggleChecklistItem = async (id) => {
    if (isViewer) return;
    const updatedChecklist = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updatedChecklist);
    try {
      await updateTask(activeTask.id, { checklist: updatedChecklist });
    } catch (err) {
      console.error("Error toggling checklist item:", err);
    }
  };

  const deleteChecklistItem = async (id) => {
    if (isViewer) return;
    const updatedChecklist = checklist.filter(item => item.id !== id);
    setChecklist(updatedChecklist);
    try {
      await updateTask(activeTask.id, { checklist: updatedChecklist });
    } catch (err) {
      console.error("Error deleting checklist item:", err);
    }
  };

  // Functional: Subtasks
  const addSubtask = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    if (!newSubtaskTitle.trim()) return;
    const newItem = { id: `sb_${Date.now()}`, title: newSubtaskTitle.trim(), done: false };
    const updatedSubtasks = [...subtasks, newItem];
    setSubtasks(updatedSubtasks);
    setNewSubtaskTitle('');
    try {
      await updateTask(activeTask.id, { subtasks: updatedSubtasks });
    } catch (err) {
      console.error("Error adding subtask:", err);
    }
  };

  const toggleSubtask = async (id) => {
    if (isViewer) return;
    const updatedSubtasks = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updatedSubtasks);
    try {
      await updateTask(activeTask.id, { subtasks: updatedSubtasks });
    } catch (err) {
      console.error("Error toggling subtask:", err);
    }
  };

  const deleteSubtask = async (id) => {
    if (isViewer) return;
    const updatedSubtasks = subtasks.filter(s => s.id !== id);
    setSubtasks(updatedSubtasks);
    try {
      await updateTask(activeTask.id, { subtasks: updatedSubtasks });
    } catch (err) {
      console.error("Error deleting subtask:", err);
    }
  };

  // Functional: Attach File
  const handleFileChange = (e) => {
    if (isViewer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileData = {
        id: `att_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        data: reader.result,
        uploadedAt: new Date().toISOString()
      };

      const updatedAttachments = [...attachments, fileData];
      setAttachments(updatedAttachments);
      try {
        await updateTask(activeTask.id, { attachments: updatedAttachments });
        
        // Post attachment comment
        const commentText = `uploaded a file: ${file.name}`;
        const res = await apiClient.post(`/comments/${activeTask.id}`, { text: commentText });
        setComments(prev => [...prev, res.data]);
      } catch (err) {
        console.error("Error saving attachment file:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteAttachment = async (id) => {
    if (isViewer) return;
    const updatedAttachments = attachments.filter(a => a.id !== id);
    setAttachments(updatedAttachments);
    try {
      await updateTask(activeTask.id, { attachments: updatedAttachments });
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('task-file-input')?.click();
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER TASK CONTENT
  ───────────────────────────────────────────────────────────── */
  const renderTaskContent = () => (
    <div className="flex flex-col lg:flex-row h-full divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden min-h-0 bg-white">
      
      {/* LEFT COLUMN: Clean layout to match the image precisely */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 min-w-0">
        
        {/* Top Control strip in left pane: Left Arrow, Task Pill, Comment counter */}
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          
          <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
            <span>Task</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{comments.length}</span>
          </div>
        </div>

        {/* Task Title */}
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              className="text-2xl font-black text-slate-900 border-b border-[#5f35f5] focus:outline-none flex-1 py-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  updateTask(activeTask.id, { title: editedTitle });
                  setIsEditingTitle(false);
                }
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
            />
            <button onClick={() => { updateTask(activeTask.id, { title: editedTitle }); setIsEditingTitle(false); }} className="px-2.5 py-1 bg-[#5f35f5] text-white text-[10px] font-bold rounded-lg">Save</button>
          </div>
        ) : (
          <h2 
            onClick={() => !isViewer && setIsEditingTitle(true)}
            className={`text-2xl font-bold text-slate-800 leading-snug p-1 rounded transition-colors ${!isViewer ? 'cursor-text hover:bg-slate-50' : ''}`}
          >
            {activeTask.title}
          </h2>
        )}

        {/* Sparkles Ask Brain banner */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-600 font-semibold shadow-xs">
          <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
          <span>Ask Brain² for a presentation, document or prototype</span>
        </div>

        {/* Clean Metadata Fields (Matches Image) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs font-bold text-slate-600 pt-2">
          
          {/* Left Column Fields */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
              <div className="flex items-center gap-1.5">
                {isViewer ? (
                  <div className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-md ${sColor.bg} ${sColor.text} select-none`}>
                    <span>{sColor.label}</span>
                    <ChevronRight className="w-2.5 h-2.5 rotate-90" />
                  </div>
                ) : (
                  <select
                    value={activeTask.status}
                    onChange={(e) => updateTask(activeTask.id, { status: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {Object.keys(STATUS_COLOR).map(k => (
                      <option key={k} value={k}>{STATUS_COLOR[k].label}</option>
                    ))}
                  </select>
                )}
                {isViewer && (
                  <button className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-650 cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Dates</span>
              {isViewer ? (
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : '6/28 → 7/3'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString('en-CA') : ''}
                    onChange={(e) => updateTask(activeTask.id, { dueDate: e.target.value || null })}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer font-sans"
                  />
                </div>
              )}
            </div>

            {/* Time estimate */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Time estimate</span>
              {isViewer ? (
                <span className="text-slate-400 font-semibold">{activeTask.points ? `${activeTask.points} points` : 'Empty'}</span>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={activeTask.points || 0}
                  onChange={(e) => updateTask(activeTask.id, { points: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 text-center focus:outline-none"
                />
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tags</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {activeTask.labels?.map(l => (
                  <span key={l} className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-55 bg-indigo-50 border border-indigo-100 text-[#5f35f5]">
                    {l.toLowerCase()}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-55 bg-slate-100 text-slate-500 border border-slate-200">
                  webdev
                </span>
              </div>
            </div>
          </div>

          {/* Right Column Fields */}
          <div className="space-y-4">
            {/* Assignees */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Assignees</span>
              {isViewer ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[9px] overflow-hidden">
                    <img src={assignee.avatar || memberAvatars.u1} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-slate-800 font-bold">{assignee.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[9px] overflow-hidden shrink-0">
                    <img src={assignee.avatar || memberAvatars.u1} alt="" className="w-full h-full object-cover" />
                  </div>
                  <select
                    value={activeTask.assignee || ''}
                    onChange={(e) => updateTask(activeTask.id, { assignee: e.target.value || null })}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[120px]"
                  >
                    <option value="">Unassigned</option>
                    {workspaceMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Priority</span>
              {isViewer ? (
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <span>{activeTask.priority}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <select
                    value={activeTask.priority || 'Medium'}
                    onChange={(e) => updateTask(activeTask.id, { priority: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Track time */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Track time</span>
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Play className="w-3.5 h-3.5 text-slate-400 fill-current" />
                <span>0h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* Task Description */}
        <p className="text-sm text-slate-700 font-medium leading-relaxed">
          {activeTask.description}
        </p>

        {/* Attachments Section (renders actual uploads list) */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Attachments ({attachments.length})</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {attachments.map(att => (
                <div key={att.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50 flex flex-col group">
                  {att.type.startsWith('image/') ? (
                    <div className="h-24 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img src={att.data} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-100 flex items-center justify-center">
                      <Paperclip className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="p-2 flex items-center justify-between gap-1.5 shrink-0 bg-white">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate">{att.name}</p>
                      <p className="text-[8px] text-slate-400 font-semibold">{att.size}</p>
                    </div>
                    <button 
                      onClick={() => deleteAttachment(att.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Functional List */}
        {checklist.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Checklist</span>
            <div className="space-y-1.5">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        item.done ? 'bg-[#5f35f5] border-[#5f35f5] text-white' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {item.done && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className={`text-xs font-semibold ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks Functional List */}
        {subtasks.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Subtasks</span>
            <div className="space-y-1.5">
              {subtasks.map(s => (
                <div key={s.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleSubtask(s.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        s.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {s.done && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className={`text-xs font-semibold ${s.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {s.title}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteSubtask(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Inline Input */}
        {showChecklistInput && (
          <form onSubmit={addChecklistItem} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              autoFocus
              placeholder="Add item to checklist..."
              value={newChecklistItem}
              onChange={e => setNewChecklistItem(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#5f35f5]"
            />
            <button type="submit" className="px-3 py-1.5 bg-[#5f35f5] text-white text-xs font-bold rounded-lg cursor-pointer">Add</button>
            <button type="button" onClick={() => setShowChecklistInput(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
          </form>
        )}

        {/* Subtask Inline Input */}
        {showSubtaskInput && (
          <form onSubmit={addSubtask} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              autoFocus
              placeholder="Add subtask title..."
              value={newSubtaskTitle}
              onChange={e => setNewSubtaskTitle(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#5f35f5]"
            />
            <button type="submit" className="px-3 py-1.5 bg-[#5f35f5] text-white text-xs font-bold rounded-lg cursor-pointer">Add</button>
            <button type="button" onClick={() => setShowSubtaskInput(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
          </form>
        )}

        {/* Bottom Action Menu: EXACT ORDER, NO OTHER FIELDS */}
        <div className="pt-8 border-t border-slate-100 flex flex-col gap-3 font-semibold text-xs text-slate-500">
          
          {/* 1. Add subtask */}
          {!isViewer && (
            <button 
              onClick={() => { setShowSubtaskInput(true); setShowChecklistInput(false); }}
              className="flex items-center gap-2 hover:text-[#5f35f5] transition-colors cursor-pointer w-max"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Add subtask</span>
            </button>
          )}

          {/* 2. Create checklist */}
          {!isViewer && (
            <button 
              onClick={() => { setShowChecklistInput(true); setShowSubtaskInput(false); }}
              className="flex items-center gap-2 hover:text-[#5f35f5] transition-colors cursor-pointer w-max"
            >
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Create checklist</span>
            </button>
          )}

          {/* 3. Attach file */}
          {!isViewer && (
            <button 
              onClick={triggerFileInput}
              className="flex items-center gap-2 hover:text-[#5f35f5] transition-colors cursor-pointer w-max"
            >
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span>Attach file</span>
            </button>
          )}

          {/* Hidden File Picker Input */}
          <input
            id="task-file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 4. Delete task */}
          {!isViewer && (
            <button 
              onClick={() => { if (confirm('Delete this task?')) { deleteTask(activeTask.id); handleClose(); } }}
              className="flex items-center gap-2 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer w-max"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete task</span>
            </button>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Activity Feed */}
      <div className="w-full lg:w-[380px] border-l border-slate-100 flex flex-col shrink-0 bg-slate-50/20 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <span className="font-bold text-slate-800 text-sm">Activity</span>
          <div className="flex items-center gap-2 text-slate-400">
            <Smile className="w-4 h-4" />
            <span className="text-xs font-semibold">{comments.length}</span>
          </div>
        </div>

        {/* Activity Feed content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-[11px] text-slate-400 font-medium space-y-1.5 pl-3 border-l-2 border-slate-200">
            <p>Badrinath created this task · Jun 28 at 10:52 am</p>
          </div>

          {/* Interactive timeline & comments */}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <img src={c.avatar} alt="" className="w-7 h-7 rounded-full shrink-0 border border-slate-200 shadow-xs object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-extrabold text-slate-800">{c.author}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{c.time}</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-700 font-medium leading-relaxed shadow-xs space-y-2">
                  <p>{c.text}</p>
                  
                  {/* Upload file preview attachment rendering inside comment row */}
                  {c.filePreview && (
                    <div className="mt-2 border border-slate-100 rounded-lg overflow-hidden max-w-[200px] bg-slate-50">
                      <img src={c.filePreview} alt={c.fileName} className="w-full h-auto object-cover max-h-32" />
                      <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-600 truncate flex-1">{c.fileName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input footer */}
        <div className="shrink-0 p-3 border-t border-slate-100 bg-white relative">
          {/* Mention Suggestions Popup */}
          {mentionSearch !== null && (
            <div className="absolute bottom-full left-3 mb-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto p-1">
              <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Mention member
              </div>
              {workspaceMembers
                .filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMention(m.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                  >
                    <img src={m.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                    <span className="truncate">{m.name}</span>
                  </button>
                ))
              }
              {workspaceMembers.filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                <div className="px-2 py-3 text-xs text-slate-400 font-semibold text-center">
                  No members found
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <img src={currentUser?.avatar || memberAvatars.u1} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0" />
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-[#5f35f5]/50 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Write a comment…"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addComment())}
                className="flex-1 bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-1 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"><Paperclip className="w-3.5 h-3.5" /></button>
                <button className="p-1 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                <button onClick={addComment} className="p-1 text-[#5f35f5] hover:text-[#4c1d95] transition-colors cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 text-center mt-1.5">↵ Enter to post</p>
        </div>

      </div>
    </div>
  );

  return (
    <div className="h-full w-full relative">
      {layoutMode === 'Modal' ? (
        /* MODAL OVERLAY BACKGROUND BACKDROP */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/50"
          >
            {/* Header controls precisely matching picture details */}
            <div className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
              {/* Left breadcrumb details */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                <span className="hover:underline cursor-pointer">{activeWorkspace?.name || 'Liftabit'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400 font-semibold">Webpage</span>
              </div>

              {/* Right options */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="text-[10px] text-slate-400 font-semibold">Created Jun 28</span>
                <div className="flex items-center gap-1 text-slate-400 hover:text-violet-500 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Brain²</span>
                </div>
                <span className="cursor-pointer hover:text-slate-800">Share</span>
                <Star className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-yellow-500" />
                
                {/* Switch Layout dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsLayoutOpen(!isLayoutOpen)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 font-bold transition-all cursor-pointer"
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>Switch layout</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isLayoutOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsLayoutOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-250/80 rounded-xl shadow-xl p-1 z-50">
                        {['Modal', 'Fullscreen'].map(m => (
                          <button
                            key={m}
                            onClick={() => { setLayoutMode(m); setIsLayoutOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span>{m === 'Modal' ? 'Modal (Floating)' : 'Full Screen'}</span>
                            {layoutMode === m && <Check className="w-3.5 h-3.5 text-[#5f35f5]" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {renderTaskContent()}
            </div>
          </motion.div>
        </div>
      ) : (
        /* FULLSCREEN VERSION */
        <div className="h-full flex flex-col bg-white">
          <div className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:underline cursor-pointer" onClick={handleClose}>{activeWorkspace?.name || 'Liftabit'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400 font-semibold">Webpage</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="text-[10px] text-slate-400 font-semibold">Created Jun 28</span>
              <button onClick={() => setLayoutMode('Modal')} className="p-1 text-slate-400 hover:text-slate-750 flex items-center gap-1">
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Modal View</span>
              </button>
              <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderTaskContent()}
          </div>
        </div>
      )}
    </div>
  );
}
