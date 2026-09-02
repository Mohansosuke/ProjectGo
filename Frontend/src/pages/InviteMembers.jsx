import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  UserPlus,
  Mail,
  Link as LinkIcon,
  AlertCircle,
  AlertTriangle,
  Check,
  Shield,
  ShieldCheck,
  User,
  Eye,
  Sparkles,
  Users,
  Search,
  Send,
  Trash2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button, Input, Avatar, Badge, WorkspaceLogo } from '../components/ui';
import apiClient from '../services/apiClient';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';

const ROLE_CONFIGS = [
  {
    id: 'Member',
    name: 'Member',
    icon: User,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Can create, edit, move tasks, and participate in sprint workflows.',
    permissions: ['Manage tasks & assignees', 'Add attachments & comments', 'View team board']
  },
  {
    id: 'Admin',
    name: 'Admin',
    icon: ShieldCheck,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Full workspace permissions, member management, and stage configuration.',
    permissions: ['Invite & manage teammates', 'Configure columns & settings', 'Full task control']
  },
  {
    id: 'Viewer',
    name: 'Viewer',
    icon: Eye,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Read-only access to view boards, tasks, and sprint progress without editing.',
    permissions: ['View Kanban & timelines', 'Track sprint metrics', 'Read descriptions & updates']
  }
];

const InviteMembers = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, workspacesLoading, activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || '');
  const [emailInput, setEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [role, setRole] = useState('Member');
  const [personalMessage, setPersonalMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Real database users & current workspace members
  const [allUsers, setAllUsers] = useState([]);
  const [existingMembers, setExistingMembers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Sync selectedWorkspaceId with route param
  useEffect(() => {
    if (workspaceId) {
      setSelectedWorkspaceId(workspaceId);
    } else if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaceId, workspaces]);

  // Fetch real users and existing workspace members
  useEffect(() => {
    const fetchData = async () => {
      setUsersLoading(true);
      try {
        // Fetch all registered users in the database
        const usersRes = await apiClient.get('/auth/users');
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
        setAllUsers(usersData);

        // Fetch current workspace members if a workspace is selected
        if (selectedWorkspaceId) {
          try {
            const membersRes = await apiClient.get(`/invitations/workspace/${selectedWorkspaceId}`);
            const membersData = Array.isArray(membersRes.data) ? membersRes.data : membersRes.data?.data || [];
            setExistingMembers(membersData);
          } catch (mErr) {
            console.error('Error fetching workspace members:', mErr);
          }
        }
      } catch (err) {
        console.error('Error fetching registered users for invitation:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchData();
  }, [selectedWorkspaceId]);

  // Compute available suggestions (real registered users not already in workspace or invited)
  const suggestedUsers = useMemo(() => {
    const existingMemberIds = new Set(existingMembers.map(m => m.id || m._id));
    const existingMemberEmails = new Set(existingMembers.map(m => (m.email || '').toLowerCase()));
    const currentEmail = (currentUser?.email || '').toLowerCase();
    const currentId = currentUser?.id || currentUser?._id;

    return allUsers.filter(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uId = u.id || u._id;

      // Exclude self, already joined members, and already added emails
      if (uEmail === currentEmail || uId === currentId) return false;
      if (existingMemberIds.has(uId) || existingMemberEmails.has(uEmail)) return false;

      // Search query filter
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = (u.name || u.fullName || '').toLowerCase().includes(q);
        const matchEmail = uEmail.includes(q);
        return matchName || matchEmail;
      }

      return true;
    });
  }, [allUsers, existingMembers, currentUser, userSearchQuery]);

  const handleAddEmail = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const val = emailInput.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!val) return;
      if (!emailRegex.test(val)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (invitedEmails.includes(val)) {
        setError('Email already added.');
        return;
      }
      
      setError('');
      setInvitedEmails([...invitedEmails, val]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setInvitedEmails(invitedEmails.filter(e => e !== emailToRemove));
  };

  const handleToggleUserSuggestion = (email) => {
    const normEmail = email.toLowerCase();
    if (invitedEmails.includes(normEmail)) {
      setInvitedEmails(invitedEmails.filter(e => e !== normEmail));
    } else {
      setError('');
      setInvitedEmails([...invitedEmails, normEmail]);
    }
  };

  const handleSendInvitations = async () => {
    if (invitedEmails.length === 0 && !emailInput.trim()) {
      setError('Please add at least one email address to send invitations.');
      return;
    }

    let finalEmails = [...invitedEmails];
    if (emailInput.trim()) {
      const val = emailInput.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(val) && !finalEmails.includes(val)) {
        finalEmails.push(val);
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const promises = finalEmails.map(email =>
        apiClient.post('/invitations', {
          workspaceId: selectedWorkspaceId,
          email,
          role,
          message: personalMessage.trim() || undefined
        })
      );

      await Promise.all(promises);
      setSuccess(`Successfully sent ${finalEmails.length} invitation${finalEmails.length > 1 ? 's' : ''}!`);
      setInvitedEmails([]);
      setEmailInput('');
      setPersonalMessage('');

      // Refresh workspace members
      try {
        const membersRes = await apiClient.get(`/invitations/workspace/${selectedWorkspaceId}`);
        setExistingMembers(Array.isArray(membersRes.data) ? membersRes.data : membersRes.data?.data || []);
      } catch (e) {}

      setTimeout(() => {
        navigate(`/workspace/${selectedWorkspaceId}/kanban`);
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send one or more invitations. Ensure users are registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/login?inviteWs=${selectedWorkspaceId}`;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  if (workspacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading workspace permissions...</p>
        </div>
      </div>
    );
  }

  const currentWs = workspaces.find(w => w.id === selectedWorkspaceId) || activeWorkspace;
  const isAdmin = currentWs?.userRole === 'Admin' || currentWs?.owner === currentUser?.id;

  if (!isAdmin && workspaces.length > 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 pt-20">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Only workspace owners and administrators have permissions to invite and manage team members for this workspace.
        </p>
        <div className="pt-3">
          <Button onClick={() => navigate(`/workspace/${workspaceId || selectedWorkspaceId}/kanban`)}>
            Back to Sprint Board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none">

      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/workspace/${selectedWorkspaceId}/kanban`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Sprint Board</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Target Workspace:</span>
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer outline-none"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden"
      >
        {/* Hero Header */}
        <div className="relative p-7 sm:p-9 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 border border-white/20">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">
                    Workspace Collaboration
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                    {currentWs?.name || 'Active Space'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Invite Teammates
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
                  Bring your engineers, designers, and managers together to plan sprints, assign tasks, and track real-time velocity.
                </p>
              </div>
            </div>

            {/* Quick Share Link Pill */}
            <div className="shrink-0 flex items-center">
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-7 sm:p-9 space-y-8">

          {/* Feedback Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-3 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-3 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 1. Minimal Role Selection ── */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Workspace Role
            </label>
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200/80 rounded-2xl gap-1 flex-wrap">
              {[
                { id: 'Member', label: 'Member', icon: User, note: 'Can create & edit tasks' },
                { id: 'Admin', label: 'Admin', icon: ShieldCheck, note: 'Full workspace control' },
                { id: 'Viewer', label: 'Viewer', icon: Eye, note: 'Read-only access' },
              ].map((r) => {
                const isSelected = role === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 ring-1 ring-indigo-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{r.label}</span>
                    <span className="hidden sm:inline text-[10px] font-medium text-slate-400">· {r.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Email Address Input ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                2. Enter Teammate Emails
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                {invitedEmails.length} recipient{invitedEmails.length === 1 ? '' : 's'} queued
              </span>
            </div>

            <div className="min-h-16 w-full p-2.5 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-xs">
              {invitedEmails.map((email) => (
                <div
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-bold text-indigo-700 shadow-2xs"
                >
                  <Mail className="w-3 h-3 text-indigo-500" />
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="p-0.5 hover:bg-indigo-200/60 rounded-md text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <input
                type="email"
                placeholder={invitedEmails.length === 0 ? "Type email addresses and press Enter or space..." : "Add another email..."}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
                className="flex-1 min-w-[240px] px-2 py-1 bg-transparent border-none focus:outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400"
                autoComplete="off"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
              Press Enter, comma, or space after typing each email address to add multiple users at once.
            </p>
          </div>

          {/* ── 3. Quick Suggested Teammates (Real Registered Users) ── */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  3. Quick Invite Registered Users
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Real users currently on ProjectGo ready to be added to this workspace.
                </p>
              </div>

              {/* Search user filter */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Discovering registered users...</p>
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
                <p className="text-xs font-semibold text-slate-500">
                  {userSearchQuery ? 'No registered users match your search query.' : 'All registered users are already members of this workspace!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {suggestedUsers.map((user) => {
                  const isAdded = invitedEmails.includes((user.email || '').toLowerCase());
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUserSuggestion(user.email)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isAdded
                          ? 'border-indigo-400 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={user.avatar || `https://i.pravatar.cc/80?u=${user.id}`}
                            alt={user.name || 'User'}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-2xs"
                          />
                          {user.isOnline && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-800 text-xs truncate">
                              {user.name || user.fullName || 'Teammate'}
                            </h4>
                            {user.isOnline && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                                online
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        {isAdded ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 4. Personal Note (Optional) ── */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              4. Personal Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Hey! Join our workspace sprint board on ProjectGo..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-xs"
            />
          </div>

        </div>

        {/* Card Footer Actions */}
        <div className="px-7 sm:px-9 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/workspace/${selectedWorkspaceId}/kanban`)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/workspace/${selectedWorkspaceId}/members`)}
            >
              View Existing Members
            </Button>
            <Button
              type="button"
              onClick={handleSendInvitations}
              isLoading={loading}
              className="shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send {invitedEmails.length > 0 ? `${invitedEmails.length} ` : ''}Invitation{invitedEmails.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default InviteMembers;
