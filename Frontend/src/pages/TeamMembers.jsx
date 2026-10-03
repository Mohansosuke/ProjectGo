import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  UserPlus,
  Search,
  MoreVertical,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Shield,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  Mail,
  Phone,
  X,
  Briefcase,
  RefreshCw,
  ArrowLeft,
  Send,
  Sparkles,
  AlertCircle,
  Check,
  UserCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { Button, Input, Avatar, Badge, Breadcrumb, useToast, WorkspaceLogo } from '../components/ui';
import apiClient from '../services/apiClient';

const TeamMembers = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const { tasks = [] } = useTask() || {};
  const toast = useToast();

  const workspace = workspaces.find(w => w.id === workspaceId || w._id === workspaceId) || activeWorkspace || (workspaces.length > 0 ? workspaces[0] : null);
  const currentWorkspaceId = workspaceId || workspace?.id || workspace?._id;

  const isCurrentOwner = workspace && currentUser && (currentUser.id === workspace.ownerId || currentUser.id === workspace.owner || currentUser._id === workspace.ownerId || currentUser._id === workspace.owner);
  const isCurrentAdmin = workspace && (workspace.userRole === 'Admin' || isCurrentOwner);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState(null); // { type: 'workspace'|'member', id, label }
  const [filterSearchQuery, setFilterSearchQuery] = useState('');

  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const fetchMembers = async (wsId) => {
    const idToUse = wsId || currentWorkspaceId;
    if (!idToUse) return;
    try {
      const res = await apiClient.get(`/invitations/workspace/${idToUse}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ? res.data.data : []);
      setMembers(list);
    } catch (err) {
      console.error("Error loading workspace members:", err);
      setMembers([]);
    }
  };

  const fetchPendingInvitations = async (wsId) => {
    const idToUse = wsId || currentWorkspaceId;
    if (!idToUse) return;
    try {
      const res = await apiClient.get(`/workspaces/${idToUse}/invitations`);
      const invList = Array.isArray(res.data) ? res.data : (res.data?.data ? res.data.data : []);
      setPendingInvitations(invList);
    } catch (err) {
      console.error("Error loading pending invitations:", err);
      setPendingInvitations([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const targetWsId = workspaceId || workspace?.id || workspace?._id || activeWorkspace?.id || activeWorkspace?._id;
      if (targetWsId) {
        await Promise.all([fetchMembers(targetWsId), fetchPendingInvitations(targetWsId)]);
      }
      setLoading(false);
    };
    init();
  }, [workspaceId, currentWorkspaceId, workspace?.id, workspace?._id, activeWorkspace?.id, activeWorkspace?._id, workspaces.length]);

  // Quick invite member
  const handleInvite = async (e) => {
    e.preventDefault();
    const wsId = currentWorkspaceId;
    if (!inviteEmail.trim() || !wsId) return;
    setInviting(true);
    try {
      await apiClient.post('/invitations', {
        workspaceId: wsId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      await fetchPendingInvitations(wsId);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      if (errMsg.toLowerCase().includes('already a member') || errMsg.toLowerCase().includes('already belongs')) {
        toast.error('This user is already a member of this workspace.');
      } else if (errMsg.toLowerCase().includes('already sent') || errMsg.toLowerCase().includes('duplicate')) {
        toast.error('Invitation already sent.');
      } else {
        toast.error(errMsg || 'Failed to send invitation.');
      }
    } finally {
      setInviting(false);
    }
  };

  // Change member role
  const handleChangeRole = async (userId, newRole) => {
    const wsId = currentWorkspaceId;
    if (!wsId) return;
    setUpdatingRoleId(userId);
    try {
      await apiClient.put(`/invitations/workspace/${wsId}/member/${userId}/role`, {
        role: newRole
      });
      toast.success(`Member role updated to ${newRole}`);
      setMembers(prev => prev.map(m => (m.id === userId || m._id === userId) ? { ...m, role: newRole } : m));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId, memberName) => {
    const wsId = currentWorkspaceId;
    if (!wsId) return;
    if (!window.confirm(`Remove ${memberName || 'this member'} from the workspace?`)) return;

    try {
      await apiClient.delete(`/invitations/workspace/${wsId}/member/${userId}`);
      toast.success("Member removed successfully.");
      setMembers(prev => prev.filter(m => (m.id !== userId && m._id !== userId)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member.");
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (id) => {
    try {
      await apiClient.delete(`/invitations/${id}`);
      toast.success('Invitation cancelled successfully.');
      setPendingInvitations(prev => prev.filter(inv => inv._id !== id && inv.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel invitation.');
    }
  };

  // Resend invitation
  const handleResendInvitation = async (email, role) => {
    const wsId = currentWorkspaceId;
    if (!wsId) return;
    try {
      await apiClient.post('/invitations', { workspaceId: wsId, email, role: role || 'Member' });
      toast.success(`Invitation re-sent to ${email}`);
      await fetchPendingInvitations(wsId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (members.length === 0) {
      toast.error('No members to export.');
      return;
    }
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const rows = members.map(m => [
      `"${m.name || ''}"`,
      `"${m.email || ''}"`,
      `"${m.role || 'Member'}"`,
      `"${m.status || (m.isOnline ? 'Online' : 'Offline')}"`,
      `"${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${workspace?.name || 'workspace'}-members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Members list exported as CSV.');
  };

  // Computed filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(user => {
      if (appliedFilter?.type === 'member') {
        const id = user.id || user._id;
        if (id !== appliedFilter.id) return false;
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (user.name || '').toLowerCase().includes(q) || (user.email || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All Roles' || (user.role || '').toLowerCase() === roleFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter !== 'All Status') {
        if (statusFilter === 'Active') {
          matchesStatus = user.isOnline || (user.status || '').toLowerCase() === 'online';
        } else if (statusFilter === 'Inactive') {
          matchesStatus = !user.isOnline && (user.status || '').toLowerCase() !== 'online';
        } else if (statusFilter === 'Pending') {
          matchesStatus = false;
        }
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter, appliedFilter]);

  // Computed filtered pending invitations
  const filteredPendingInvitations = useMemo(() => {
    return pendingInvitations.filter(inv => {
      if (appliedFilter?.type === 'member') return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (inv.email || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All Roles' || (inv.role || '').toLowerCase() === roleFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter !== 'All Status') {
        matchesStatus = statusFilter === 'Pending';
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [pendingInvitations, searchQuery, roleFilter, statusFilter, appliedFilter]);

  const onlineCount = useMemo(() => members.filter(m => m.isOnline || m.status === 'Online').length, [members]);
  const adminCount = useMemo(() => members.filter(m => m.role === 'Admin' || m.role === 'Owner').length, [members]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col space-y-6 select-none">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <WorkspaceLogo workspace={workspace} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Team Members
              </h1>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {members.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage workspace access, teammate roles, and invitation status for <span className="font-semibold text-slate-700">{workspace?.name || 'this workspace'}</span>.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${appliedFilter
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              title="Filter members"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{appliedFilter ? appliedFilter.label : 'Filter'}</span>
              {appliedFilter && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppliedFilter(null);
                    setFilterSearchQuery('');
                  }}
                  className="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold cursor-pointer text-xs"
                  title="Remove filter"
                >
                  ×
                </span>
              )}
            </button>

            {/* Filter floating panel */}
            {showFilterPanel && (
              <div
                className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Filter Members</p>
                  <button onClick={() => setShowFilterPanel(false)} className="text-slate-400 hover:text-slate-600 text-xs p-1">×</button>
                </div>

                {appliedFilter && (
                  <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                        {appliedFilter.type}
                      </span>
                      <span className="text-xs font-bold text-indigo-900 truncate">{appliedFilter.label}</span>
                    </div>
                    <button
                      onClick={() => { setAppliedFilter(null); setFilterSearchQuery(''); }}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove ×
                    </button>
                  </div>
                )}

                <div className="relative mb-2.5">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search member name or email…"
                    value={filterSearchQuery}
                    onChange={e => setFilterSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {members
                    .filter(m => !filterSearchQuery.trim() || (m.name || m.email || '').toLowerCase().includes(filterSearchQuery.toLowerCase()))
                    .map(m => {
                      const id = m.id || m._id;
                      const isSelected = appliedFilter?.id === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setAppliedFilter({ type: 'member', id, label: m.name || m.email });
                            setShowFilterPanel(false);
                            setFilterSearchQuery('');
                          }}
                          className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                          <span className="truncate">{m.name || m.email}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                </div>

                <div className="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center text-xs">
                  <button
                    onClick={() => { setAppliedFilter(null); setFilterSearchQuery(''); }}
                    className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => navigate(`/workspace/${workspaceId}/invite`)}
            className="shadow-sm shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Invite Teammates
          </Button>
        </div>
      </div>

      {/* ── KPI Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Online Now', value: onlineCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Admins & Owner', value: adminCount, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Pending Invites', value: pendingInvitations.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map((s, idx) => (
          <div key={idx} className={`p-4 bg-white border ${s.border} rounded-2xl shadow-xs flex items-center justify-between`}>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{s.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Invite Bar ── */}
      {isCurrentAdmin && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Quick invite by email (e.g. colleague@company.com)..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="Member">Role: Member</option>
                <option value="Admin">Role: Admin</option>
                <option value="Viewer">Role: Viewer</option>
              </select>

              <Button type="submit" isLoading={inviting} className="shrink-0 text-xs py-2">
                <Send className="w-3.5 h-3.5 mr-1" />
                Send Invite
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Main Members Table ── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter dropdown menus */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option>All Roles</option>
              <option>Owner</option>
              <option>Admin</option>
              <option>Member</option>
              <option>Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Online Now</option>
              <option value="Inactive">Offline</option>
              <option value="Pending">Pending Invitations</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Member</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Workspace Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200" />
                        <div className="h-3.5 w-28 rounded bg-slate-200" />
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-3.5 w-36 rounded bg-slate-200" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-20 rounded-full bg-slate-200" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-16 rounded-full bg-slate-200" /></td>
                    <td className="py-4 px-6"><div className="h-3.5 w-20 rounded bg-slate-200" /></td>
                    <td className="py-4 px-6" />
                  </tr>
                ))
              ) : (filteredMembers.length === 0 && filteredPendingInvitations.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {members.length === 0 && pendingInvitations.length === 0
                          ? 'No members or pending invitations in this workspace yet.'
                          : 'No members or invitations match your search criteria.'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Invite teammates using the quick invite bar above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* 1. Present Active Team Members */}
                  {filteredMembers.map((user) => {
                    const uId = user.id || user._id;
                    const isOwner = user.role === 'Owner' || String(uId) === String(workspace?.ownerId || workspace?.owner);
                    const isSelf = String(uId) === String(currentUser?.id || currentUser?._id);

                    return (
                      <tr key={uId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Member Info */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedMember(user)}>
                            <div className="relative shrink-0">
                              <img
                                src={user.avatar || `https://i.pravatar.cc/80?u=${uId}`}
                                alt={user.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:border-indigo-400 transition-colors"
                              />
                              {user.isOnline ? (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                              ) : (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-slate-300 border-2 border-white rounded-full shadow-2xs" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                                  {user.name || 'Teammate'}
                                </span>
                                {user.nickname && (
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                    "{user.nickname}"
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
                                    You
                                  </span>
                                )}
                              </div>
                              {user.bio ? (
                                <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 font-medium">{user.bio}</p>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic max-w-xs mt-0.5">No bio provided</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Info (Email & Phone) */}
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <a href={`mailto:${user.email}`} className="text-slate-700 font-medium hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{user.email}</span>
                            </a>
                            {user.phone && (
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role Changer or Badge */}
                        <td className="py-3.5 px-6">
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold">
                              <Shield className="w-3 h-3 text-amber-500" />
                              Owner
                            </span>
                          ) : isCurrentAdmin && !isSelf ? (
                            <select
                              value={user.role || 'Member'}
                              disabled={updatingRoleId === uId}
                              onChange={(e) => handleChangeRole(uId, e.target.value)}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer outline-none"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Member">Member</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${user.role === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : user.role === 'Viewer'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                              {user.role === 'Admin' ? <ShieldCheck className="w-3 h-3 text-purple-500" /> : <UserCheck className="w-3 h-3 text-indigo-500" />}
                              {user.role || 'Member'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6">
                          {user.isOnline || user.status === 'Online' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Offline
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-6 text-slate-500 text-xs font-medium">
                          {user.joinedAt
                            ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recent'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedMember(user)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Full Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isCurrentAdmin && !isOwner && !isSelf && (
                              <button
                                onClick={() => handleRemoveMember(uId, user.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* 2. Pending Invitation Requests */}
                  {filteredPendingInvitations.map((inv) => {
                    const invId = inv._id || inv.id;
                    const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={`pending-${invId}`} className="bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                        {/* Member Column: blank --- */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0 select-none">
                              ---
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-400 text-xs">---</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200 uppercase tracking-wider">
                                  Pending Invite
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 italic max-w-xs mt-0.5 font-medium">Awaiting confirmation</p>
                            </div>
                          </div>
                        </td>

                        {/* Email Address */}
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <a href={`mailto:${inv.email}`} className="text-slate-800 font-semibold hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[160px]">{inv.email}</span>
                            </a>
                          </div>
                        </td>

                        {/* Workspace Role */}
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                            <UserCheck className="w-3 h-3 text-indigo-500" />
                            {inv.role || 'Member'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                            Pending
                          </span>
                        </td>

                        {/* Expiration */}
                        <td className="py-3.5 px-6 text-slate-400 text-xs font-medium">
                          {daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResendInvitation(inv.email, inv.role)}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              title="Resend Invitation Email"
                            >
                              Resend
                            </button>
                            {isCurrentAdmin && (
                              <button
                                onClick={() => handleCancelInvitation(invId)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Cancel Invitation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Member Details Modal ── */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedMember(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Profile Section */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
                <div className="relative">
                  <img
                    src={selectedMember.avatar || `https://i.pravatar.cc/120?u=${selectedMember.id || selectedMember._id}`}
                    alt={selectedMember.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-md"
                  />
                  {selectedMember.isOnline ? (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                  ) : (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-300 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{selectedMember.name}</h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${selectedMember.role === 'Owner'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : selectedMember.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                      {selectedMember.role}
                    </span>
                  </div>
                  {selectedMember.nickname && (
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">"{selectedMember.nickname}"</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {selectedMember.bio || 'No bio specified.'}
                  </p>
                </div>
              </div>

              {/* Contact & Status Grid */}
              <div className="py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</p>
                  <a href={`mailto:${selectedMember.email}`} className="text-xs font-bold text-slate-800 hover:text-indigo-600 truncate block">
                    {selectedMember.email}
                  </a>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedMember.phone || 'Not provided'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Current Status</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {selectedMember.isOnline ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online Now
                      </span>
                    ) : (
                      <span className="text-slate-400">Offline</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Joined Workspace</p>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedMember.joinedAt
                      ? new Date(selectedMember.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Recent'}
                  </p>
                </div>
              </div>

              {/* Assigned Tasks Summary */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    Assigned Tasks ({tasks.filter(t => (t.assignee === selectedMember.id || t.assignee === selectedMember._id) && (currentWorkspaceId ? t.workspaceId === currentWorkspaceId : true)).length})
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {tasks.filter(t => (t.assignee === selectedMember.id || t.assignee === selectedMember._id) && (currentWorkspaceId ? t.workspaceId === currentWorkspaceId : true)).length > 0 ? (
                    tasks
                      .filter(t => (t.assignee === selectedMember.id || t.assignee === selectedMember._id) && (currentWorkspaceId ? t.workspaceId === currentWorkspaceId : true))
                      .map(t => (
                        <div key={t.id || t._id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate mr-2">{t.title}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {t.status || 'Active'}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic py-2 text-center">
                      No active tasks assigned in this workspace.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeamMembers;
