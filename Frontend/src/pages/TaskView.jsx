import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Settings, Paperclip, Link2, MoreHorizontal, Check,
  ChevronsUp, ArrowUp, Minus, ArrowDown, ChevronDown, Plus,
  Trash2, Edit3, Smile, Bold, Italic, Link as LinkIcon,
  Zap, Clock, FileText, Download, X, Copy, ExternalLink,
  HelpCircle, Eye, CheckSquare
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
  { id: 'Critical', label: 'Critical', icon: ChevronsUp, color: 'text-rose-600', stroke: '#dc2626' },
  { id: 'High', label: 'High', icon: ChevronsUp, color: 'text-rose-500', stroke: '#ef4444' },
  { id: 'Medium', label: 'Medium', icon: Minus, color: 'text-amber-500', stroke: '#f59e0b' },
  { id: 'Low', label: 'Low', icon: ArrowDown, color: 'text-blue-500', stroke: '#3b82f6' }
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
    title: 'Implement OAuth2 authentication flow for external partners',
    description: `We need to integrate the new OAuth2 provider for our partner portal. This involves:\n\n• Configuring the authorization endpoint\n• Implementing the callback handler in the middleware\n• Storing encrypted refresh tokens in the Redis cache\n\nPlease ensure all secrets are managed via the vault and not hardcoded in the application config.`,
    status: 'IN_PROGRESS',
    priority: 'High',
    points: 8,
    labels: ['BACKEND', 'AUTH-SERVICE'],
    assignee: null,
    reporter: null,
    createdAt: new Date().toISOString()
  };

  // State
  const [title, setTitle] = useState(activeTask.title || 'Implement OAuth2 authentication flow for external partners');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const [description, setDescription] = useState(
    activeTask.description ||
    `We need to integrate the new OAuth2 provider for our partner portal. This involves:\n\n• Configuring the authorization endpoint\n• Implementing the callback handler in the middleware\n• Storing encrypted refresh tokens in the Redis cache\n\nPlease ensure all secrets are managed via the vault and not hardcoded in the application config.`
  );
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'history' | 'worklog'
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [reporterDropdownOpen, setReporterDropdownOpen] = useState(false);
  const [pointsEditing, setPointsEditing] = useState(false);
  const [pointsVal, setPointsVal] = useState(activeTask.points || 8);

  const [labels, setLabels] = useState(
    activeTask.labels && activeTask.labels.length > 0 ? activeTask.labels : ['BACKEND', 'AUTH-SERVICE']
  );
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');

  // Attachments matching screenshot
  const [attachments, setAttachments] = useState([
    {
      id: 'att-1',
      name: 'auth-flow-diagram.pdf',
      type: 'pdf',
      size: '2.4 MB'
    },
    {
      id: 'att-2',
      name: 'screen-capture.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      size: '840 KB'
    }
  ]);
  const fileInputRef = useRef(null);

  // Comments matching screenshot
  const [comments, setComments] = useState([
    {
      id: 'c-init',
      author: {
        name: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
      },
      createdAt: '2 hours ago',
      content: "I've reviewed the API documentation for the new provider. It looks like we'll need to handle a specific error code for expired tokens during the initial handshake."
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Keyboard shortcut M to focus comment box
  const commentInputRef = useRef(null);
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

  // Fetch comments from backend if available
  useEffect(() => {
    const fetchComments = async () => {
      if (!activeTask.id && !activeTask._id) return;
      try {
        const res = await apiClient.get(`/comments/${activeTask.id || activeTask._id}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(c => ({
            id: c._id || c.id,
            author: {
              name: c.user?.fullName || c.user?.name || c.authorName || 'Jane Smith',
              avatar: c.user?.photoURL || c.user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
            },
            createdAt: 'Just now',
            content: c.content || c.text
          }));
          setComments(mapped);
        }
      } catch (err) {
        // Fallback to initial matching comment
      }
    };
    fetchComments();
  }, [activeTask.id, activeTask._id]);

  // Sync title & description if activeTask updates
  useEffect(() => {
    if (activeTask.title) setTitle(activeTask.title);
    if (activeTask.description) setDescription(activeTask.description);
    if (activeTask.points) setPointsVal(activeTask.points);
    if (activeTask.labels && activeTask.labels.length > 0) setLabels(activeTask.labels);
  }, [activeTask.id, activeTask._id]);

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

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setSavingComment(true);
    const newEntry = {
      id: 'c-' + Date.now(),
      author: {
        name: currentUser?.fullName || currentUser?.name || 'Alex Morgan',
        avatar: currentUser?.photoURL || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      },
      createdAt: 'Just now',
      content: newCommentText.trim()
    };
    setComments(prev => [...prev, newEntry]);
    setNewCommentText('');

    try {
      if (activeTask.id || activeTask._id) {
        await apiClient.post(`/comments/${activeTask.id || activeTask._id}`, {
          content: newCommentText.trim()
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
    setAttachments(prev => [...prev, newAtt]);
  };

  // Current status object
  const currentStatus = STATUS_ITEMS.find(s => s.id === (activeTask.status || 'IN_PROGRESS')) || STATUS_ITEMS[1];
  const currentPriority = PRIORITY_ITEMS.find(p => p.id.toLowerCase() === (activeTask.priority || 'high').toLowerCase()) || PRIORITY_ITEMS[1];

  // Assignee & Reporter display matching image
  const defaultAssignee = {
    name: 'Alex Morgan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  };
  const defaultReporter = {
    name: 'Jane Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  };

  const assignedPerson = activeTask.assigneeUser?.fullName || activeTask.assigneeUser?.name
    ? { name: activeTask.assigneeUser.fullName || activeTask.assigneeUser.name, avatar: activeTask.assigneeUser.photoURL || defaultAssignee.avatar }
    : defaultAssignee;

  const reportingPerson = activeTask.reporterUser?.fullName || activeTask.reporterUser?.name
    ? { name: activeTask.reporterUser.fullName || activeTask.reporterUser.name, avatar: activeTask.reporterUser.photoURL || defaultReporter.avatar }
    : defaultReporter;

  // Task key (e.g. PROJ-123)
  const taskKey = activeTask.key || (typeof activeTask.id === 'string' && activeTask.id.startsWith('PROJ') ? activeTask.id : 'PROJ-123');
  const teamName = workspace?.name || 'Phoenix Team';

  return (
    <div className="min-h-screen bg-white font-sans text-[#172b4d] select-text">
      
      {/* ════════════════════════════════════════════════════════
          TOP HEADER BAR (Matching picture top navigation)
      ════════════════════════════════════════════════════════ */}
      <header className="h-14 border-b border-[#ebecf0] px-6 flex items-center justify-between bg-white sticky top-0 z-30">
        {/* Left: App Icon + Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Blue 4-box app icon */}
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
              src={currentUser?.photoURL || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT AREA: 2-COLUMN GRID (Exact picture layout)
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

          {/* Issue Title (Large Bold) */}
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
                  className="px-3 py-1 bg-[#0052cc] text-white text-xs font-bold rounded-md"
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
                {title}
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
                    rows={6}
                    className="w-full text-sm text-[#172b4d] leading-relaxed p-2 border border-[#0052cc] rounded-lg focus:outline-none resize-y"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1 text-xs font-bold text-[#6b778c] hover:text-[#172b4d]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDesc}
                      className="px-4 py-1.5 bg-[#0052cc] text-white text-xs font-bold rounded-md hover:bg-[#0065ff]"
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
                  {description}
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

            {/* Attachments Grid */}
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
                        setAttachments(prev => prev.filter(a => a.id !== att.id));
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#8993a4] hover:text-rose-600 transition-opacity p-0.5"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                Comments
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
                {/* Existing Comments */}
                <div className="space-y-5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <img
                        src={c.author?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-[#172b4d]">
                            {c.author?.name || 'Jane Smith'}
                          </span>
                          <span className="text-xs text-[#6b778c]">
                            {c.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-[#172b4d] leading-relaxed">
                          {c.content}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-xs text-[#6b778c]">
                          <button className="hover:text-[#172b4d] hover:underline cursor-pointer">
                            Edit
                          </button>
                          <span>·</span>
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

                {/* Add a Comment Composer */}
                <div className="flex items-start gap-3 pt-2">
                  <img
                    src={currentUser?.photoURL || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
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
                <p>• Status changed to <strong>IN PROGRESS</strong> 45 minutes ago</p>
                <p>• Assigned to <strong>Alex Morgan</strong> 2 hours ago</p>
                <p>• Issue created by <strong>Jane Smith</strong> today at 10:45 AM</p>
              </div>
            )}

            {activeTab === 'worklog' && (
              <div className="p-4 bg-[#f4f5f7] rounded-xl text-xs text-[#6b778c]">
                <p>No work logged yet. Estimated remaining time: 8 story points.</p>
              </div>
            )}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            RIGHT COLUMN: Status, Details Card, Metadata, Sprint (~32%)
        ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* ── STATUS DROPDOWN WIDGET (Matching picture full-width blue button) ── */}
          <div className="space-y-1.5 relative">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b778c]">
              STATUS
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold text-xs py-2.5 px-3.5 rounded-lg flex items-center justify-between shadow-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">▶</span>
                  <span className="tracking-wide uppercase">{currentStatus.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Status Dropdown Menu */}
              {statusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#dfe1e6] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                  {STATUS_ITEMS.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleStatusChange(st.id)}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-[#f4f5f7] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${st.bg}`} />
                        <span className={st.id === currentStatus.id ? 'text-[#0052cc]' : 'text-[#172b4d]'}>
                          {st.label}
                        </span>
                      </div>
                      {st.id === currentStatus.id && (
                        <Check className="w-3.5 h-3.5 text-[#0052cc]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── DETAILS CARD (Matching picture) ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172b4d]">
              Details
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  ASSIGNEE
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <img
                    src={assignedPerson.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="font-semibold text-[#172b4d]">
                    {assignedPerson.name}
                  </span>
                </div>
              </div>

              {/* Reporter */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  REPORTER
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <img
                    src={reportingPerson.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="font-semibold text-[#172b4d]">
                    {reportingPerson.name}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c] w-24 shrink-0">
                  PRIORITY
                </span>
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                    className="flex items-center gap-1.5 font-semibold text-[#172b4d] hover:bg-[#f4f5f7] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <currentPriority.icon className={`w-3.5 h-3.5 stroke-[2.5] ${currentPriority.color}`} />
                    <span>{currentPriority.label}</span>
                  </button>

                  {priorityDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#dfe1e6] rounded-lg shadow-xl z-50 py-1 w-36">
                      {PRIORITY_ITEMS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handlePriorityChange(p.id)}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#f4f5f7] cursor-pointer"
                        >
                          <p.icon className={`w-3.5 h-3.5 stroke-[2.5] ${p.color}`} />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                        className="text-[10px] font-bold text-[#0052cc] hover:underline"
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
                      {pointsVal}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── METADATA & AUDIT LOG CARD (Matching picture) ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-2 text-xs text-[#6b778c]">
            <p>Created Oct 12, 2023 10:45 AM</p>
            <p>Updated 45 mins ago</p>
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

          {/* ── SPRINT CARD (Matching picture) ── */}
          <div className="bg-white border border-[#dfe1e6] rounded-xl p-4 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b778c]">
              SPRINT
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#172b4d]">
              <Zap className="w-3.5 h-3.5 text-[#0052cc] fill-[#0052cc]" />
              <span>{teamName} Sprint 24 (Active)</span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
