import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Settings, Paperclip, Link2, MoreHorizontal, Check,
  ChevronsUp, ArrowUp, Minus, ArrowDown, ChevronDown, Plus,
  Trash2, Edit3, Smile, Bold, Italic, Link as LinkIcon,
  Zap, Clock, FileText, Download, X, Copy, ExternalLink,
  HelpCircle, Eye, CheckSquare, Search, UserX
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import apiClient from '../services/apiClient';

const STATUS_ITEMS = [
  { id: 'TODO', label: 'TO DO', color: '#6b778c', bg: 'bg-slate-500' },
  { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#0052cc', bg: 'bg-[#0052cc]' },
  { id: 'IN_REVIEW', label: 'IN REVIEW', color: '#ff8b00', bg: 'bg-amber-500' },
  { id: 'COMPLETED', label: 'DONE', color: '#36b37e', bg: 'bg-emerald-600' }
];

const PRIORITY_ITEMS = [
  { id: 'Critical', label: 'Critical', icon: ChevronsUp, color: 'text-rose-600' },
  { id: 'High', label: 'High', icon: ChevronsUp, color: 'text-rose-500' },
  { id: 'Medium', label: 'Medium', icon: Minus, color: 'text-amber-500' },
  { id: 'Low', label: 'Low', icon: ArrowDown, color: 'text-blue-500' }
];

export default function TaskView() {
  const { workspaceId, taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, moveTask, deleteTask } = useTask();
  const { users, currentUser } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();

  const workspace = workspaces.find(w => w.id === workspaceId) || activeWorkspace;

  // Find task or fallback
  const found = tasks.find(t => t.id === taskId || t._id === taskId);
  const activeTask = found || {
    id: taskId || 'PROJ-123',
    title: 'Task Details',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'High',
    points: 8,
    labels: [],
    assignee: null,
    reporter: null,
    attachments: [],
    createdAt: new Date().toISOString()
  };

  // State
  const [title, setTitle] = useState(activeTask.title || 'Untitled Task');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const [description, setDescription] = useState(activeTask.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'history' | 'worklog'
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [pointsEditing, setPointsEditing] = useState(false);
  const [pointsVal, setPointsVal] = useState(activeTask.points || 0);

  const [labels, setLabels] = useState(activeTask.labels || []);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');

  // Attachments strictly from task data (no default dummy files)
  const [attachments, setAttachments] = useState(activeTask.attachments || []);
  const fileInputRef = useRef(null);

  // Comments strictly from backend (no default dummy comments)
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Team members for assignee picker
  const [teamMembers, setTeamMembers] = useState([]);

  // Refs for click outside
  const assigneeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const commentInputRef = useRef(null);

  // Keyboard shortcut M to focus comment box
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          commentInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setAssigneeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target)) {
        setPriorityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Fetch real team members of workspace
  useEffect(() => {
    const wsId = workspaceId || activeWorkspace?.id;
    if (!wsId) return;
    apiClient.get(`/invitations/workspace/${wsId}`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setTeamMembers(list);
      })
      .catch(() => {});
  }, [workspaceId, activeWorkspace?.id]);

  // Fetch real comments from backend
  useEffect(() => {
    const fetchComments = async () => {
      if (!activeTask.id && !activeTask._id) return;
      try {
        const res = await apiClient.get(`/comments/${activeTask.id || activeTask._id}`);
        if (Array.isArray(res.data)) {
          const mapped = res.data.map(c => ({
            id: c._id || c.id,
            author: {
              name: c.user?.fullName || c.user?.name || c.authorName || 'Teammate',
              avatar: c.user?.photoURL || c.user?.avatar || `https://i.pravatar.cc/100?u=${c.user?._id || 'user'}`
            },
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
            content: c.content || c.text || ''
          }));
          setComments(mapped);
        }
      } catch (err) {
        setComments([]);
      }
    };
    fetchComments();
  }, [activeTask.id, activeTask._id]);

  // Sync state values when activeTask changes
  useEffect(() => {
    if (activeTask) {
      setTitle(activeTask.title || 'Untitled Task');
      setDescription(activeTask.description || '');
      setPointsVal(activeTask.points || 0);
      setLabels(activeTask.labels || []);
      setAttachments(activeTask.attachments || []);
    }
  }, [activeTask.id, activeTask._id, activeTask.title, activeTask.description, activeTask.assignee]);

  // Assemble full list of assignable members
  const assignableMembers = useMemo(() => {
    const map = new Map();

    // 1. Current logged-in user
    if (currentUser) {
      const id = String(currentUser.id || currentUser._id || '');
      map.set(id, {
        id,
        _id: id,
        name: currentUser.fullName || currentUser.name || 'Current User',
        email: currentUser.email || '',
        avatar: currentUser.photoURL || currentUser.avatar || 'https://i.pravatar.cc/150?u=mohan',
        role: 'You'
      });
    }

    // 2. Users from AuthContext / database
    (users || []).forEach(u => {
      const id = String(u.id || u._id || '');
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          _id: id,
          name: u.fullName || u.name || u.email,
          email: u.email || '',
          avatar: u.photoURL || u.avatar || `https://i.pravatar.cc/150?u=${id}`,
          role: u.role || 'Member'
        });
      }
    });

    // 3. Workspace members
    (teamMembers || []).forEach(m => {
      const id = String(m.userId || m.id || m._id || '');
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          _id: id,
          name: m.name || m.fullName || m.email,
          email: m.email || '',
          avatar: m.avatarUrl || m.avatar || `https://i.pravatar.cc/150?u=${id}`,
          role: m.role || 'Member'
        });
      }
    });

    return Array.from(map.values());
  }, [currentUser, users, teamMembers]);

  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch.trim()) return assignableMembers;
    const q = assigneeSearch.toLowerCase();
    return assignableMembers.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  }, [assignableMembers, assigneeSearch]);

  // Save title
  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!title.trim()) return;
    try {
      if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, { title });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save description
  const handleSaveDesc = async () => {
    setIsEditingDesc(false);
    try {
      if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, { description });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Change status
  const handleStatusChange = async (newStatus) => {
    setStatusDropdownOpen(false);
    try {
      if (moveTask && (activeTask.id || activeTask._id)) {
        await moveTask(activeTask.id || activeTask._id, newStatus);
      } else if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, { status: newStatus });
      }
      activeTask.status = newStatus;
    } catch (e) {
      console.error(e);
    }
  };

  // Change priority
  const handlePriorityChange = async (newPriority) => {
    setPriorityDropdownOpen(false);
    try {
      if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, { priority: newPriority });
      }
      activeTask.priority = newPriority;
    } catch (e) {
      console.error(e);
    }
  };

  // Change assignee (syncs immediately to TaskContext and backend, updating dashboard)
  const handleAssigneeChange = async (member) => {
    setAssigneeDropdownOpen(false);
    const newAssigneeId = member ? (member.id || member._id) : null;
    const newAssigneeUser = member ? {
      _id: newAssigneeId,
      id: newAssigneeId,
      fullName: member.name || member.fullName,
      name: member.name || member.fullName,
      email: member.email,
      photoURL: member.avatar
    } : null;

    activeTask.assignee = newAssigneeId;
    activeTask.assigneeUser = newAssigneeUser;

    try {
      if (updateTask && (activeTask.id || activeTask._id)) {
        await updateTask(activeTask.id || activeTask._id, {
          assignee: newAssigneeId,
          assigneeUser: newAssigneeUser
        });
      }
    } catch (err) {
      console.error('Failed to change assignee:', err);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setSavingComment(true);
    const newEntry = {
      id: 'c-' + Date.now(),
      author: {
        name: currentUser?.fullName || currentUser?.name || 'You',
        avatar: currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/150?u=mohan'
      },
      createdAt: 'Just now',
      content: newCommentText.trim()
    };
    setComments(prev => [...prev, newEntry]);
    const textToSend = newCommentText.trim();
    setNewCommentText('');

    try {
      if (activeTask.id || activeTask._id) {
        await apiClient.post(`/comments/${activeTask.id || activeTask._id}`, {
          content: textToSend
        });
      }
    } catch (err) {
      console.warn('Comment saved locally:', err);
    } finally {
      setSavingComment(false);
    }
  };

  // Add Label
  const handleAddLabel = () => {
    if (!newLabelText.trim()) return;
    const tag = newLabelText.trim().toUpperCase();
    if (!labels.includes(tag)) {
      const updated = [...labels, tag];
      setLabels(updated);
      if (updateTask && (activeTask.id || activeTask._id)) {
        updateTask(activeTask.id || activeTask._id, { labels: updated });
      }
    }
    setNewLabelText('');
    setShowAddLabel(false);
  };

  // Add Attachment from file input
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const newAtt = {
      id: 'att-' + Date.now(),
      name: file.name,
      type: isImg ? 'image' : 'pdf',
      url: isImg ? URL.createObjectURL(file) : null,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };
    const updated = [...attachments, newAtt];
    setAttachments(updated);
    if (updateTask && (activeTask.id || activeTask._id)) {
      updateTask(activeTask.id || activeTask._id, { attachments: updated });
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (attId) => {
    const updated = attachments.filter(a => a.id !== attId);
    setAttachments(updated);
    if (updateTask && (activeTask.id || activeTask._id)) {
      updateTask(activeTask.id || activeTask._id, { attachments: updated });
    }
  };

  // Current status object
  const currentStatus = STATUS_ITEMS.find(s => s.id === (activeTask.status || 'IN_PROGRESS')) || STATUS_ITEMS[1];
  const currentPriority = PRIORITY_ITEMS.find(p => p.id.toLowerCase() === (activeTask.priority || 'high').toLowerCase()) || PRIORITY_ITEMS[1];

  // Resolve current assigned person object
  const currentAssignee = useMemo(() => {
    const aId = String(activeTask.assignee || activeTask.assigneeId || activeTask.assigneeUser?._id || activeTask.assigneeUser?.id || '');
    if (!aId) return null;

    const foundMember = assignableMembers.find(m => String(m.id || m._id) === aId);
    if (foundMember) return foundMember;

    if (activeTask.assigneeUser?.fullName || activeTask.assigneeUser?.name) {
      return {
        id: aId,
        name: activeTask.assigneeUser.fullName || activeTask.assigneeUser.name,
        avatar: activeTask.assigneeUser.photoURL || `https://i.pravatar.cc/150?u=${aId}`,
        email: activeTask.assigneeUser.email || ''
      };
    }
    return {
      id: aId,
      name: typeof activeTask.assignee === 'string' ? activeTask.assignee : 'Assignee',
      avatar: `https://i.pravatar.cc/150?u=${aId}`
    };
  }, [activeTask.assignee, activeTask.assigneeUser, assignableMembers]);

  // Resolve current reporter object
  const currentReporter = useMemo(() => {
    if (activeTask.reporterUser?.fullName || activeTask.reporterUser?.name) {
      return {
        name: activeTask.reporterUser.fullName || activeTask.reporterUser.name,
        avatar: activeTask.reporterUser.photoURL || 'https://i.pravatar.cc/150?u=reporter'
      };
    }
    if (currentUser) {
      return {
        name: currentUser.fullName || currentUser.name || 'Reporter',
        avatar: currentUser.photoURL || currentUser.avatar || 'https://i.pravatar.cc/150?u=currentUser'
      };
    }
    return {
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=reporter'
    };
  }, [activeTask.reporterUser, currentUser]);

  const taskKey = activeTask.key || (typeof activeTask.id === 'string' && activeTask.id.startsWith('PROJ') ? activeTask.id : 'PROJ-123');
  const teamName = workspace?.name || 'Phoenix Team';

  return (
    <div className="min-h-screen bg-white font-sans text-[#172b4d] select-text">
      
      {/* ════════════════════════════════════════════════════════
          TOP HEADER BAR
      ════════════════════════════════════════════════════════ */}
      <header className="h-14 border-b border-[#ebecf0] px-6 flex items-center justify-between bg-white sticky top-0 z-30">
        {/* Left: App Icon + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link to="/workspaces" className="p-1 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-[#0052cc] p-1.5 flex items-center justify-center shadow-xs">
              <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                <div className="bg-white rounded-[1.5px]" />
                <div className="bg-white rounded-[1.5px]" />
                <div className="bg-white rounded-[1.5px]" />
                <div className="bg-white rounded-[1.5px]" />
              </div>
            </div>
          </Link>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-sm text-[#6b778c]">
            <Link to="/workspaces" className="hover:text-[#172b4d] transition-colors">
              Projects
            </Link>
            <span className="text-[#8993a4]">/</span>
            <Link
              to={workspaceId ? `/workspace/${workspaceId}/kanban` : '/workspaces'}
              className="hover:text-[#172b4d] transition-colors"
            >
              {teamName}
            </Link>
            <span className="text-[#8993a4]">/</span>
            <span className="font-bold text-[#172b4d]">
              {taskKey}
            </span>
          </nav>
        </div>

        {/* Right: Notifications, Settings, User Avatar */}
        <div className="flex items-center gap-4">
          <button className="text-[#6b778c] hover:text-[#172b4d] p-1.5 rounded-md hover:bg-[#f4f5f7] transition-colors cursor-pointer" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="text-[#6b778c] hover:text-[#172b4d] p-1.5 rounded-md hover:bg-[#f4f5f7] transition-colors cursor-pointer" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200">
            <img
              src={currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/150?u=mohan'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT AREA: 2-COLUMN GRID
      ════════════════════════════════════════════════════════ */}
      <main className="max-w-[1400px] mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ────────────────────────────────────────────────────────
            LEFT COLUMN: Task Title, Actions, Description, Attachments, Comments (~68%)
        ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Issue Key with Blue Checkbox Icon */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-[3px] bg-[#0052cc] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-[#0052cc] tracking-wide">
              {taskKey}
            </span>
          </div>

          {/* Issue Title (Editable on click) */}
          <div className="group relative">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="w-full text-2xl md:text-[26px] font-bold text-[#172b4d] tracking-tight leading-snug border-b-2 border-[#0052cc] focus:outline-none bg-transparent"
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-1 bg-[#0052cc] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl md:text-[26px] font-bold text-[#172b4d] tracking-tight leading-snug cursor-pointer hover:bg-[#f4f5f7] -ml-1 p-1 rounded-md transition-colors"
                title="Click to edit title"
              >
                {title || 'Untitled Task'}
              </h1>
            )}
          </div>

          {/* Actions Toolbar (Attach, Link issue, More) */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f4f5f7] hover:bg-[#ebecf0] text-[#42526e] text-xs font-bold transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#6b778c]" />
              <span>Attach</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => alert('Link issue dialog')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f4f5f7] hover:bg-[#ebecf0] text-[#42526e] text-xs font-bold transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-[#6b778c]" />
              <span>Link issue</span>
            </button>

            <button
              className="p-1.5 rounded-md bg-[#f4f5f7] hover:bg-[#ebecf0] text-[#42526e] transition-colors cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4 text-[#6b778c]" />
            </button>
          </div>

          {/* Description Section */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-[#172b4d] tracking-tight">
              Description
            </h3>
            
            <div className="bg-white border border-[#dfe1e6] rounded-xl p-5 shadow-xs transition-shadow hover:border-[#c1c7d0]">
              {isEditingDesc ? (
                <div className="space-y-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Add a description..."
                    className="w-full text-sm text-[#172b4d] leading-relaxed p-2 border border-[#0052cc] rounded-lg focus:outline-none resize-y"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1 text-xs font-bold text-[#6b778c] hover:text-[#172b4d] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDesc}
                      className="px-4 py-1.5 bg-[#0052cc] text-white text-xs font-bold rounded-md hover:bg-[#0065ff] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="text-sm text-[#172b4d] leading-relaxed cursor-pointer whitespace-pre-line"
                  title="Click to edit description"
                >
                  {description ? description : (
                    <span className="text-slate-400 italic">No description provided. Click here to add details.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172b4d] tracking-tight">
                Attachments ({attachments.length})
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#0052cc] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="border border-[#dfe1e6] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col group cursor-pointer"
                  >
                    {/* Preview Area */}
                    {att.type === 'image' && att.url ? (
                      <div className="h-28 bg-slate-900 overflow-hidden relative">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-28 bg-[#f4f5f7] flex items-center justify-center">
                        <div className="w-10 h-12 bg-white rounded border border-[#dfe1e6] flex items-center justify-center text-[#8993a4] shadow-xs">
                          <FileText className="w-6 h-6 stroke-[1.5]" />
                        </div>
                      </div>
                    )}

                    {/* Attachment Card Footer */}
                    <div className="p-2.5 bg-white border-t border-[#dfe1e6] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#172b4d] truncate max-w-[160px]">
                        {att.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(att.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#8993a4] hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 border border-dashed border-[#dfe1e6] rounded-xl bg-[#fafbfc] text-center flex flex-col items-center justify-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#8993a4]" />
                <span className="text-xs text-[#6b778c]">No attachments attached to this task.</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#0052cc] hover:underline cursor-pointer"
                >
                  + Upload files
                </button>
              </div>
            )}
          </div>

          {/* Activity Section (Comments, History, Work Log) */}
          <div className="pt-6 space-y-5">
            {/* Activity Tabs */}
            <div className="flex items-center gap-6 border-b border-[#dfe1e6] text-sm">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2.5 font-bold transition-all cursor-pointer ${
                  activeTab === 'comments'
                    ? 'text-[#0052cc] border-b-2 border-[#0052cc]'
                    : 'text-[#6b778c] hover:text-[#172b4d]'
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2.5 font-semibold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'text-[#0052cc] border-b-2 border-[#0052cc]'
                    : 'text-[#6b778c] hover:text-[#172b4d]'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('worklog')}
                className={`pb-2.5 font-semibold transition-all cursor-pointer ${
                  activeTab === 'worklog'
                    ? 'text-[#0052cc] border-b-2 border-[#0052cc]'
                    : 'text-[#6b778c] hover:text-[#172b4d]'
                }`}
              >
                Work Log
              </button>
            </div>

            {/* Comments Stream */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Real Comments list or clean empty state */}
                {comments.length > 0 ? (
                  <div className="space-y-5">
                    {comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-3">
                        <img
                          src={c.author?.avatar || 'https://i.pravatar.cc/100?u=user'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-[#172b4d]">
                              {c.author?.name || 'Teammate'}
                            </span>
                            <span className="text-xs text-[#6b778c]">
                              {c.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-[#172b4d] leading-relaxed">
                            {c.content}
                          </p>
                          <div className="flex items-center gap-3 pt-1 text-xs text-[#6b778c]">
                            <button
                              onClick={() => setComments(prev => prev.filter(item => item.id !== c.id))}
                              className="hover:text-rose-600 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                            <span>·</span>
                            <button className="hover:text-[#172b4d] flex items-center gap-1 cursor-pointer">
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-5 text-center text-xs text-[#6b778c]">
                    No comments yet. Start the conversation below.
                  </div>
                )}

                {/* Add a Comment Composer */}
                <div className="flex items-start gap-3 pt-2">
                  <img
                    src={currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/150?u=mohan'}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <form onSubmit={handleAddComment}>
                      <div className="border border-[#dfe1e6] rounded-xl bg-white overflow-hidden focus-within:border-[#4c9aff] focus-within:ring-2 focus-within:ring-[#4c9aff]/20 transition-all shadow-xs">
                        <textarea
                          ref={commentInputRef}
                          rows={3}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-3 text-xs text-[#172b4d] focus:outline-none resize-none"
                        />
                        <div className="bg-white px-3 py-2 border-t border-[#ebecf0] flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#6b778c]">
                            <button type="button" className="p-1 hover:text-[#172b4d] rounded cursor-pointer" title="Bold">
                              <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" className="p-1 hover:text-[#172b4d] rounded cursor-pointer" title="Italic">
                              <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" className="p-1 hover:text-[#172b4d] rounded cursor-pointer" title="Insert Link">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="submit"
                            disabled={savingComment || !newCommentText.trim()}
                            className="bg-[#0052cc] hover:bg-[#0065ff] disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors shadow-xs cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                    <p className="text-[11px] text-[#6b778c] mt-1.5">
                      Pro tip: press <kbd className="px-1 py-0.5 bg-[#f4f5f7] border border-[#dfe1e6] rounded text-[10px] font-mono">M</kbd> to comment
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-4 bg-[#f4f5f7] rounded-xl text-xs text-[#6b778c] space-y-2">
                <p>• Status: <strong>{currentStatus.label}</strong></p>
                <p>• Assignee: <strong>{currentAssignee ? currentAssignee.name : 'Unassigned'}</strong></p>
                <p>• Created at: <strong>{new Date(activeTask.createdAt || Date.now()).toLocaleString()}</strong></p>
              </div>
            )}

            {activeTab === 'worklog' && (
              <div className="p-4 bg-[#f4f5f7] rounded-xl text-xs text-[#6b778c]">
                <p>No work logged yet. Story points: {pointsVal || 0}.</p>
              </div>
            )}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            RIGHT COLUMN: Status, Details Card (with Interactive Assignee Dropdown), Metadata, Sprint (~32%)
        ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* ── STATUS DROPDOWN WIDGET (Modern floating menu) ── */}
          <div className="space-y-1.5 relative" ref={statusDropdownRef}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b778c]">
              STATUS
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold text-xs py-2.5 px-3.5 rounded-lg flex items-center justify-between shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">▶</span>
                  <span className="tracking-wide uppercase">{currentStatus.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Status Dropdown Menu */}
              <AnimatePresence>
                {statusDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    {STATUS_ITEMS.map((st) => {
                      const isSel = st.id === currentStatus.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => handleStatusChange(st.id)}
                          className={`w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            isSel ? 'bg-indigo-50/60 text-[#0052cc]' : 'hover:bg-slate-50 text-[#172b4d]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${st.bg}`} />
                            <span>{st.label}</span>
                          </div>
                          {isSel && (
                            <Check className="w-4 h-4 text-[#0052cc]" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── DETAILS CARD ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172b4d]">
              Details
            </h3>

            <div className="space-y-3.5 text-xs">
              
              {/* ── ASSIGNEE FIELD (Interactive Dropdown Option) ── */}
              <div className="flex items-center justify-between relative" ref={assigneeDropdownRef}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  ASSIGNEE
                </span>
                
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                    className="w-full flex items-center justify-between p-1.5 -ml-1 rounded-lg hover:bg-[#f4f5f7] transition-colors cursor-pointer group"
                    title="Click to change assignee"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {currentAssignee ? (
                        <>
                          <img
                            src={currentAssignee.avatar || `https://i.pravatar.cc/150?u=${currentAssignee.id}`}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <span className="font-semibold text-[#172b4d] truncate">
                            {currentAssignee.name}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#6b778c]">
                          <UserX className="w-4 h-4 text-slate-400" />
                          <span className="italic text-slate-500">Unassigned</span>
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${assigneeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Modern Floating Assignee Dropdown UI */}
                  <AnimatePresence>
                    {assigneeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 sm:left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                      >
                        {/* Search in Dropdown */}
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            placeholder="Search teammates..."
                            autoFocus
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0052cc] focus:bg-white"
                          />
                        </div>

                        {/* Members list */}
                        <div className="max-h-52 overflow-y-auto space-y-0.5">
                          {/* Option to Unassign */}
                          <button
                            onClick={() => handleAssigneeChange(null)}
                            className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              !currentAssignee ? 'bg-indigo-50/70 text-[#0052cc] font-bold' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <UserX className="w-3.5 h-3.5" />
                              </div>
                              <span>Unassigned</span>
                            </div>
                            {!currentAssignee && <Check className="w-3.5 h-3.5 text-[#0052cc]" />}
                          </button>

                          {filteredAssignees.map((member) => {
                            const isSelected = currentAssignee && String(currentAssignee.id || currentAssignee._id) === String(member.id || member._id);
                            return (
                              <button
                                key={member.id || member._id}
                                onClick={() => handleAssigneeChange(member)}
                                className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected ? 'bg-indigo-50/70 text-[#0052cc] font-bold' : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={member.avatar}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold truncate leading-tight">{member.name}</p>
                                    {member.email && (
                                      <p className="text-[10px] text-slate-400 truncate leading-tight">{member.email}</p>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0052cc] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Reporter */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  REPORTER
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <img
                    src={currentReporter.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="font-semibold text-[#172b4d]">
                    {currentReporter.name}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between relative" ref={priorityDropdownRef}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  PRIORITY
                </span>
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                    className="flex items-center gap-1.5 font-semibold text-[#172b4d] hover:bg-[#f4f5f7] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    <currentPriority.icon className={`w-3.5 h-3.5 stroke-[2.5] ${currentPriority.color}`} />
                    <span>{currentPriority.label}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                  </button>

                  <AnimatePresence>
                    {priorityDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 w-40"
                      >
                        {PRIORITY_ITEMS.map(p => {
                          const isSel = p.id.toLowerCase() === currentPriority.id.toLowerCase();
                          return (
                            <button
                              key={p.id}
                              onClick={() => handlePriorityChange(p.id)}
                              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                isSel ? 'bg-indigo-50/70 text-[#0052cc] font-bold' : 'hover:bg-slate-50 text-[#172b4d]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <p.icon className={`w-3.5 h-3.5 stroke-[2.5] ${p.color}`} />
                                <span>{p.label}</span>
                              </div>
                              {isSel && <Check className="w-3.5 h-3.5 text-[#0052cc]" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Labels */}
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0 pt-1">
                  LABELS
                </span>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {labels.map((lbl, idx) => {
                    const isPurple = idx % 2 === 1;
                    return (
                      <span
                        key={lbl}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                          isPurple
                            ? 'bg-[#eae6ff] text-[#403294]'
                            : 'bg-[#deebff] text-[#0747a6]'
                        }`}
                      >
                        {lbl}
                      </span>
                    );
                  })}
                  
                  {showAddLabel ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newLabelText}
                        onChange={(e) => setNewLabelText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                        placeholder="TAG"
                        autoFocus
                        className="w-16 text-[10px] font-bold uppercase px-1.5 py-0.5 border border-[#0052cc] rounded focus:outline-none"
                      />
                      <button
                        onClick={handleAddLabel}
                        className="text-[10px] font-bold text-[#0052cc] hover:underline cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddLabel(true)}
                      className="w-5 h-5 rounded hover:bg-[#f4f5f7] text-[#6b778c] hover:text-[#172b4d] flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                      title="Add label"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Story Points */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  STORY POINTS
                </span>
                <div className="flex-1">
                  {pointsEditing ? (
                    <input
                      type="number"
                      value={pointsVal}
                      onChange={(e) => setPointsVal(Number(e.target.value))}
                      onBlur={() => {
                        setPointsEditing(false);
                        if (updateTask && (activeTask.id || activeTask._id)) {
                          updateTask(activeTask.id || activeTask._id, { points: pointsVal });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setPointsEditing(false);
                          if (updateTask && (activeTask.id || activeTask._id)) {
                            updateTask(activeTask.id || activeTask._id, { points: pointsVal });
                          }
                        }
                      }}
                      autoFocus
                      className="w-12 text-xs font-bold text-[#172b4d] bg-[#f4f5f7] px-2 py-0.5 rounded border border-[#0052cc] focus:outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => setPointsEditing(true)}
                      className="bg-[#f4f5f7] hover:bg-[#ebecf0] px-2.5 py-0.5 rounded text-xs font-bold text-[#172b4d] inline-block cursor-pointer transition-colors"
                      title="Click to change story points"
                    >
                      {pointsVal || 0}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── METADATA & AUDIT LOG CARD ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-2 text-xs text-[#6b778c]">
            <p>Created: {new Date(activeTask.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p>Updated recently</p>
            <div className="border-t border-[#dfe1e6] pt-2">
              <button
                onClick={() => setActiveTab('history')}
                className="text-[#0052cc] font-medium hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>View full audit log</span>
              </button>
            </div>
          </div>

          {/* ── SPRINT CARD ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c]">
              SPRINT
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#172b4d]">
              <Zap className="w-3.5 h-3.5 text-[#0052cc] fill-[#0052cc]" />
              <span>{teamName} Sprint Active</span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
