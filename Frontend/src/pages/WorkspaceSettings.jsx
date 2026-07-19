import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Lock, 
  Puzzle, 
  CreditCard, 
  Users, 
  Network,
  ChevronDown,
  Bell,
  Palette,
  UploadCloud,
  AlertTriangle
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, Input, Switch, Modal, Breadcrumb } from '../components/ui';

const WorkspaceSettings = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, updateWorkspace, deleteWorkspace } = useWorkspace();
  
  // Find specific workspace based on URL parameter
  const workspace = workspaces.find(w => w.id === workspaceId);

  const [timeTracking, setTimeTracking] = useState(true);
  const [publicAttachments, setPublicAttachments] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [subdomain, setSubdomain] = useState('');
  const [logoBgColor, setLogoBgColor] = useState('bg-blue-500');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sync state values when workspace loaded or URL parameters change
  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || '');
      setDescription(workspace.description || '');
      setVisibility(workspace.visibility || 'Public');
      setSubdomain(workspace.subdomain || workspace.url || (workspace.name || '').toLowerCase().replace(/\s+/g, '-'));
    }
  }, [workspaceId, workspace]);

  if (!workspace) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 font-semibold">Loading workspace settings...</p>
      </div>
    );
  }

  const isAdmin = workspace.userRole === 'Admin';
  if (!isAdmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 pt-20">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Only workspace owners and admins have permission to access and modify general settings for this workspace.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate(`/workspace/${workspaceId}/kanban`)}>
            Go back to board
          </Button>
        </div>
      </div>
    );
  }

  const logoColors = [
    'bg-blue-500', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-500', 'bg-pink-600', 'bg-red-500'
  ];

  const handleSaveChanges = () => {
    updateWorkspace(workspace.id, {
      name: workspaceName,
      description,
      visibility,
      url: subdomain
    });
    setSuccessMessage('Workspace settings updated successfully!');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false);
    deleteWorkspace(workspace.id);
    alert(`Workspace "${workspaceName}" has been successfully deleted.`);
    navigate('/workspaces');
  };

  const settingsNav = [
    { section: 'WORKSPACE', items: [
      { name: 'General Settings', icon: Settings, path: 'general', active: true },
      { name: 'Permissions', icon: Lock, path: 'permissions' },
      { name: 'Notifications', icon: Bell, path: 'notifications' },
      { name: 'Appearance', icon: Palette, path: 'appearance' },
      { name: 'Integrations', icon: Puzzle, path: 'integrations' },
      { name: 'Billing', icon: CreditCard, path: 'billing' }
    ]},
    { section: 'USERS', items: [
      { name: 'Members', icon: Users, path: 'members' },
      { name: 'Teams', icon: Network, path: 'teams' }
    ]}
  ];

  return (
    <div className="p-6 h-full flex flex-col md:flex-row gap-0">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2"
          >
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Internal Settings Navigation Sidebar */}
      <div className="w-full md:w-56 flex-shrink-0 md:pr-6 mb-8 md:mb-0 border-r border-transparent md:border-gray-200">
        {settingsNav.map(({ section, items }) => (
          <div key={section} className="mb-5">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section}
            </h4>
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.path === 'members') {
                      navigate(`/workspace/${workspaceId}/members`);
                    }
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    item.active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 max-w-3xl md:pl-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Breadcrumb
              items={[
                { label: 'Settings' },
                { label: 'General' }
              ]}
              className="mb-1"
            />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Workspace Settings
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <Button 
              variant="ghost"
              onClick={() => navigate(`/workspace/${workspaceId}/kanban`)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Setting Cards Block */}
        <div className="space-y-5">
          {/* Card 1: Workspace Basics & Logo */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base">
                Workspace Basics
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your workspace identity, customize logo branding, and localized configurations.
              </p>
            </div>

            <div className="p-5 space-y-5">
              {/* Workspace Logo Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-gray-100">
                <div className={`w-14 h-14 rounded-2xl ${logoBgColor} text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0`}>
                  {workspaceName ? workspaceName.charAt(0) : 'W'}
                </div>
                <div className="space-y-2 w-full">
                  <span className="block text-xs font-semibold text-gray-700">
                    Workspace Logo
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {logoColors.map((col) => (
                      <button
                        key={col}
                        onClick={() => setLogoBgColor(col)}
                        className={`w-6 h-6 rounded-full ${col} ring-offset-2 hover:scale-110 transition-all ${
                          logoBgColor === col ? 'ring-2 ring-indigo-600' : ''
                        }`}
                      />
                    ))}
                    <Button variant="secondary" size="xs" icon={UploadCloud}>
                      Upload Custom
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Workspace Name */}
                <Input
                  label="Workspace Name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  hint="Displayed on your dashboard and invites."
                />

                {/* Default Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Default Timezone
                  </label>
                  <div className="relative">
                    <select className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                      <option>(GMT-08:00) Pacific Time (US &amp; Canada)</option>
                      <option>(GMT-05:00) Eastern Time (US &amp; Canada)</option>
                      <option>(GMT+05:30) India Standard Time</option>
                      <option>(GMT+00:00) Greenwich Mean Time</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Custom Subdomain */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Custom Subdomain
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2 bg-white text-sm focus:outline-none text-gray-800"
                  />
                  <span className="inline-flex items-center px-4 bg-gray-50 border-l border-gray-200 text-gray-400 text-sm">
                    .projectgo.app
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Changes to the subdomain may break existing deep links.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Global Issue Defaults */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base">
                Global Issue Defaults
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure default behavior for all projects within this workspace.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Toggle Time Tracking */}
              <div className="p-5">
                <Switch
                  checked={timeTracking}
                  onChange={setTimeTracking}
                  label="Enable Time Tracking"
                  description="Allow users to log hours directly on issues."
                />
              </div>

              {/* Toggle Public Attachments */}
              <div className="p-5">
                <Switch
                  checked={publicAttachments}
                  onChange={setPublicAttachments}
                  label="Allow Public Attachments"
                  description="Enable sharing files with external guest users via links."
                />
              </div>
            </div>
          </div>

          {/* Card 3: Advanced Settings (Danger Zone) */}
          <div className="bg-red-50/60 border border-red-200 rounded-2xl overflow-hidden">
            <div className="p-5">
              <h3 className="font-semibold text-red-600 text-base">
                Danger Zone
              </h3>
              <p className="text-sm text-red-500/80 mt-0.5">
                Careful: changes here can be destructive and irreversible.
              </p>

              <div className="mt-5 pt-4 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-md">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    Delete this workspace
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Once you delete a workspace, there is no going back. Please be certain. All projects, issues, and data will be permanently removed.
                  </p>
                </div>

                <Button 
                  type="button"
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete Workspace
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Page Footer */}
        <footer className="py-8 text-center text-xs text-gray-400">
          © 2026 ProjectGo Management Inc. All rights reserved.
        </footer>
      </div>

      {/* Delete Workspace Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Delete "${workspaceName}"?`}
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you absolutely sure you want to delete this workspace? This will permanently erase all columns, sprint tasks, members list, and workspace settings. This action is irreversible.
            </p>
          </div>

          <div className="flex space-x-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              onClick={handleDeleteConfirm}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default WorkspaceSettings;
