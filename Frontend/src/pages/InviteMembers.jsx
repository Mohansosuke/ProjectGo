import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  Copy,
  UserPlus,
  Mail,
  Link as LinkIcon,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Button, Input, Avatar } from '../components/ui';
import apiClient from '../services/apiClient';
import { useWorkspace } from '../contexts/WorkspaceContext';

const InviteMembers = () => {
  const { workspaceId } = useParams();
  console.log("Workspace ID:", workspaceId);
  const navigate = useNavigate();
  const { workspaces, workspacesLoading } = useWorkspace();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || '');
  const [emailInput, setEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [role, setRole] = useState('Member');
  const [personalMessage, setPersonalMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const suggestions = [
    {
      id: 1,
      name: 'Elena Rodriguez',
      role: 'Product Designer',
      handle: 'elena@company.com',
      avatar: 'https://i.pravatar.cc/150?img=47'
    },
    {
      id: 2,
      name: 'Marcus Thorne',
      role: 'Frontend Engineer',
      handle: 'marcus@company.com',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    {
      id: 3,
      name: 'Liam Sterling',
      role: 'QA Specialist',
      handle: 'liam@company.com',
      avatar: 'https://i.pravatar.cc/150?img=33'
    },
  ];

  const handleAddEmail = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const val = emailInput.trim();
      if (val && !invitedEmails.includes(val)) {
        setInvitedEmails([...invitedEmails, val]);
      }
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setInvitedEmails(invitedEmails.filter(e => e !== emailToRemove));
  };

  const handleAddSuggestion = (email) => {
    if (!invitedEmails.includes(email)) {
      setInvitedEmails([...invitedEmails, email]);
    }
  };

  const handleSendInvitations = async () => {
    if (invitedEmails.length === 0) {
      setError('Please add at least one email address to invite.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const promises = invitedEmails.map(email =>
        apiClient.post('/invitations', { workspaceId: selectedWorkspaceId, email, role })
      );

      await Promise.all(promises);
      setSuccess('All invitations sent successfully!');
      setInvitedEmails([]);
      setTimeout(() => {
        navigate(`/workspace/${selectedWorkspaceId}/kanban`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send one or more invitations. Ensure users are registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/login`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (workspacesLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 font-semibold">Loading...</p>
      </div>
    );
  }

  const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const isAdmin = workspace?.userRole === 'Admin';

  if (!isAdmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 pt-20">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Only workspace owners and admins have permission to invite members to this workspace.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate(`/workspace/${workspaceId}/kanban`)}>
            Go back to board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-5 transition-colors duration-300">

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white border border-slate-200 shadow-md rounded-xl overflow-hidden"
      >
        {/* Card Header */}
        <div className="p-8 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">
            <UserPlus className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>Workspace members</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Invite Team Members
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed font-semibold">
            Collaboration is the key to faster delivery. Invite your developers, stakeholders, and editors.
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}
          {/* Email addresses input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Addresses
            </label>
            <div className="min-h-16 w-full p-2.5 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              {invitedEmails.map((email) => (
                <div key={email} className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-extrabold text-[#1a73e8]">
                  <span>{email}</span>
                  <button type="button" onClick={() => handleRemoveEmail(email)} className="hover:text-red-500 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder={invitedEmails.length === 0 ? "e.g. alex@company.com, sarah@company.com" : "Add email..."}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
                className="flex-1 min-w-[200px] px-2 bg-transparent border-none focus:outline-none text-sm placeholder:text-slate-400 font-semibold"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold">
              Separate multiple emails with commas, spaces, or press Enter.
            </p>
          </div>

          {/* Role and Invitation Link Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Assign Role */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
              >
                <option value="Member">Member (Can edit tasks)</option>
                <option value="Admin">Admin (Full Workspace control)</option>
                <option value="Viewer">Viewer (Read-only access)</option>
              </select>
            </div>

            {/* Invitation Link */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Invitation Link
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={linkCopied ? "Link Copied!" : "http://localhost:5174/invite/link"}
                  readOnly
                  className="w-full p-3 pl-4 pr-10 bg-slate-50/50 border border-slate-200 border-dashed rounded-md text-xs font-bold text-slate-400 cursor-pointer focus:outline-none"
                  onClick={handleCopyLink}
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-455 hover:text-[#1a73e8] transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Workspace
            </label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 font-bold">
              The invited teammate will only see and be able to access the selected workspace.
            </p>
          </div>

          {/* Personal message */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Personal Message (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Hey! Come join our project sprint on ProjectGo..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-semibold text-slate-800"
            />
          </div>

          {/* Suggestions list */}
          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mb-4">
              Suggested for your organization
            </h3>
            <div className="space-y-4">
              {suggestions.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <Avatar name={user.name} src={user.avatar} size="md" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-none">
                        {user.name}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase">
                        {user.role} • {user.handle}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddSuggestion(user.handle)}
                    variant="secondary"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-200/50 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/kanban`)}
            className="text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer"
          >
            Skip for now
          </button>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate(`/workspace/${workspaceId}/members`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitations}
              isLoading={loading}
            >
              Send Invitations
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteMembers;
