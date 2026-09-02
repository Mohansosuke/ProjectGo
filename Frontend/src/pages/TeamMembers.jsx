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
import { Button, Input, Avatar, Badge, Breadcrumb, useToast, WorkspaceLogo } from '../components/ui';
import apiClient from '../services/apiClient';

const TeamMembers = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const toast = useToast();

  const workspace = workspaces.find(w => w.id === workspaceId) || activeWorkspace;
  const isCurrentOwner = workspace && currentUser && (currentUser.id === workspace.ownerId || currentUser.id === workspace.owner);
  const isCurrentAdmin = workspace && (workspace.userRole === 'Admin' || isCurrentOwner);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ? res.data.data : []);
      setMembers(list);
    } catch (err) {
      console.error("Error loading workspace members:", err);
      setMembers([]);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/invitations`);
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
      if (workspaceId) {
        await Promise.all([fetchMembers(), fetchPendingInvitations()]);
      }
      setLoading(false);
    };
    init();
  }, [workspaceId]);

  // Quick invite member
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await apiClient.post('/invitations', {
        workspaceId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      await fetchPendingInvitations();
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
    setUpdatingRoleId(userId);
    try {
      await apiClient.put(`/invitations/workspace/${workspaceId}/member/${userId}/role`, {
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
    if (!window.confirm(`Remove ${memberName || 'this member'} from the workspace?`)) return;

    try {
      await apiClient.delete(`/invitations/workspace/${workspaceId}/member/${userId}`);
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
    try {
      await apiClient.post('/invitations', { workspaceId, email, role: role || 'Member' });
      toast.success(`Invitation re-sent to ${email}`);
      await fetchPendingInvitations();
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
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (user.name || '').toLowerCase().includes(q) || (user.email || '').toLowerCase().includes(q);
      
      const matchesRole = roleFilter === 'All Roles' || (user.role || '').toLowerCase() === roleFilter.toLowerCase();
      
      let matchesStatus = true;
      if (statusFilter !== 'All Status') {
        if (statusFilter === 'Active') {
          matchesStatus = user.isOnline || (user.status || '').toLowerCase() === 'online';
        } else if (statusFilter === 'Inactive') {
          matchesStatus = !user.isOnline && (user.status || '').toLowerCase() !== 'online';
        }
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

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
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {members.length === 0 ? 'No members in this workspace yet.' : 'No members match your search criteria.'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Invite teammates using the quick invite bar above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((user) => {
                  const uId = user.id || user._id;
                  const isOwner = user.role === 'Owner' || String(uId) === String(workspace?.ownerId || workspace?.owner);
                  const isSelf = String(uId) === String(currentUser?.id || currentUser?._id);

                  return (
                    <tr key={uId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Member Info */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar || `https://i.pravatar.cc/80?u=${uId}`}
                              alt={user.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            />
                            {user.isOnline && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">
                                {user.name || 'Teammate'}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            {user.bio && (
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-6 text-slate-600 font-medium">
                        {user.email}
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                            user.role === 'Admin'
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
                      <td className="py-3.5 px-6 text-slate-400 text-xs">
                        {user.joinedAt
                          ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        {isCurrentAdmin && !isOwner && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(uId, user.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pending Invitations Section ── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Invitations
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Invitations sent that are awaiting confirmation.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {pendingInvitations.length} Pending
          </span>
        </div>

        {pendingInvitations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            No active pending invitations for this workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-6">Invited Email</th>
                  <th className="py-3 px-6">Assigned Role</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Expiration</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingInvitations.map((inv) => {
                  const invId = inv._id || inv.id;
                  const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={invId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6 text-slate-800 font-bold">{inv.email}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                          {inv.role || 'Member'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                          Pending
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-400">
                        {daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired'}
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleResendInvitation(inv.email, inv.role)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invId)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default TeamMembers;
