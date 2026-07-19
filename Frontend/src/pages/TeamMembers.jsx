import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Download, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Info,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Avatar, Badge, Breadcrumb, useToast } from '../components/ui';
import apiClient from '../services/apiClient';

const TeamMembers = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
      setMembers(res.data);
    } catch (err) {
      console.error("Error loading workspace members:", err);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/invitations`);
      setPendingInvitations(res.data);
    } catch (err) {
      console.error("Error loading pending invitations:", err);
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

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await apiClient.post('/invitations', { workspaceId, email: inviteEmail.trim() });
      toast.success('Invitation sent successfully.');
      setInviteEmail('');
      fetchPendingInvitations();
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

  const handleCancelInvitation = async (id) => {
    try {
      await apiClient.delete(`/invitations/${id}`);
      toast.success('Invitation cancelled successfully.');
      fetchPendingInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel invitation.');
    }
  };

  const filteredUsers = members.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All Roles' ? true : (user.role || '').toLowerCase() === roleFilter.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter !== 'All Status') {
      if (statusFilter === 'Active') {
        matchesStatus = (user.status || '').toLowerCase() === 'online' || (user.status || '').toLowerCase() === 'active';
      } else if (statusFilter === 'Inactive') {
        matchesStatus = (user.status || '').toLowerCase() === 'offline' || (user.status || '').toLowerCase() === 'inactive';
      }
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 h-full flex flex-col space-y-5">
      <Breadcrumb
        items={[
          { label: 'Workspace', href: `/workspace/${workspaceId}/kanban` },
          { label: 'People' }
        ]}
      />

      {/* Main Title & Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Team Members
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, roles, and invitations for this workspace.{' '}
            <span className="text-indigo-600 font-semibold">{members.length} members</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" icon={Download}>
            Export CSV
          </Button>
          
          <Button 
            onClick={() => navigate(`/workspace/${workspaceId}/invite`)}
            icon={UserPlus}
          >
            Invite Members
          </Button>
        </div>
      </div>

      {/* Invite Member form */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Invite Member</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-end gap-3 max-w-xl">
          <div className="flex-1 w-full">
            <label htmlFor="invite-email" className="block text-xs font-semibold text-gray-550 mb-1.5 uppercase tracking-wider">Email Address</label>
            <Input
              id="invite-email"
              type="email"
              placeholder="e.g. member@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" isLoading={inviting} className="h-10 px-5 text-sm shrink-0">
            Invite Member
          </Button>
        </form>
      </div>

      {/* Main Table Card container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Filter dropdown menus */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="flex items-center space-x-1 text-gray-400 text-xs font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 cursor-pointer"
            >
              <option>All Roles</option>
              <option>Admin</option>
              <option>Member</option>
              <option>Viewer</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active / Online</option>
              <option value="Inactive">Offline</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Last Active</th>
                <th className="py-3.5 px-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  {/* Name column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <Avatar name={user.name} src={user.avatar} size="sm" status={user.status} />
                      <span className="font-semibold text-gray-800 text-sm">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  {/* Email column */}
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {user.email}
                  </td>

                  {/* Status pill */}
                  <td className="py-4 px-6">
                    <Badge
                      variant={
                        user.status === 'Online' || user.status === 'Busy'
                          ? 'success'
                          : 'default'
                      }
                      size="sm"
                    >
                      {user.status || 'Offline'}
                    </Badge>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6">
                    <Badge
                      variant={user.role === 'Admin' ? 'indigo' : user.role === 'Owner' ? 'violet' : 'default'}
                      size="sm"
                    >
                      {user.role}
                    </Badge>
                  </td>

                  {/* Last active time */}
                  <td className="py-4 px-6 text-sm text-gray-400">
                    {user.status === 'Online' ? 'Active now' : '—'}
                  </td>

                  {/* Actions ellipsis */}
                  <td className="py-4 px-6 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <span className="text-xs text-gray-400">
          Showing 1 to {filteredUsers.length} of {members.length} members
        </span>

        <div className="flex items-center space-x-1">
          <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            1
          </button>
          <button className="w-8 h-8 rounded-lg border border-transparent hover:border-gray-200 text-gray-600 flex items-center justify-center hover:bg-white text-xs font-medium transition-all">
            2
          </button>
          <button className="w-8 h-8 rounded-lg border border-transparent hover:border-gray-200 text-gray-600 flex items-center justify-center hover:bg-white text-xs font-medium transition-all">
            3
          </button>
          
          <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Pending Invitations</h3>
          <p className="text-xs text-gray-500 mt-0.5">Invitations sent to people who haven't accepted yet.</p>
        </div>
        {pendingInvitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No pending invitations
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Expiry</th>
                  <th className="py-3 px-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingInvitations.map((inv) => {
                  const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5 text-sm font-medium text-gray-700">{inv.email}</td>
                      <td className="py-3.5 px-5 text-xs">
                        <Badge variant="warning">Pending</Badge>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-550 font-medium">
                        {daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-650 hover:text-red-750 hover:bg-red-50 text-xs font-semibold px-2 py-1 rounded"
                          onClick={() => handleCancelInvitation(inv._id)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Box Card */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start space-x-3.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            Workspace Permissions
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Admins can manage billing, invitations, and workspace settings. Members can create and manage their own projects. Viewers have read-only access to shared resources. Need more help?{' '}
            <a href="#" className="text-indigo-600 hover:underline font-semibold">
              Read the documentation.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
