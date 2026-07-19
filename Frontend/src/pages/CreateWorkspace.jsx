import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  UploadCloud, 
  X,
  Briefcase
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, Input } from '../components/ui';
import apiClient from '../services/apiClient';

const CreateWorkspace = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [emails, setEmails] = useState(['sarah@company.com', 'mike@studio.design']);
  const [emailInput, setEmailInput] = useState('');
  const [assignRole, setAssignRole] = useState('Member');
  const [loading, setLoading] = useState(false);

  const { createWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleAddEmail = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = emailInput.trim();
      if (val && !emails.includes(val)) {
        setEmails([...emails, val]);
      }
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    
    setLoading(true);
    try {
      const newWorkspace = await createWorkspace({ 
        name, 
        description, 
        url: url || name.toLowerCase().replace(/\s+/g, '-') 
      });

      const finalEmails = [...emails];
      const val = emailInput.trim();
      if (val && !finalEmails.includes(val)) {
        finalEmails.push(val);
      }

      if (newWorkspace && finalEmails.length > 0) {
        const workspaceId = newWorkspace.id || newWorkspace._id;
        const promises = finalEmails.map(async (email) => {
          try {
            await apiClient.post('/invitations', { workspaceId, email, role: assignRole });
          } catch (invErr) {
            console.error(`Failed to send invitation to ${email}:`, invErr);
          }
        });
        await Promise.all(promises);
      }

      navigate('/workspaces');
    } catch (err) {
      console.error("Error creating workspace or sending invites:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-5 transition-colors duration-300">
      
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-50 text-[#1a73e8] rounded-xl flex items-center justify-center shadow-md mx-auto mb-4 border border-blue-100">
          <Briefcase className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
          Create Workspace
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium max-w-md mx-auto">
          Set up a collaborative visual space for your teams, folders, and documents.
        </p>
      </div>

      {/* Step Progress Wizard */}
      <div className="flex items-center justify-center space-x-8 sm:space-x-12 mb-10 text-[11px] font-extrabold uppercase tracking-wider select-none">
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-md ring-4 ring-primary/20">
            1
          </div>
          <span className="text-[#1a73e8] mt-2">General</span>
        </div>

        <div className="w-12 sm:w-16 h-0.5 bg-slate-300 -mt-5" />

        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-white text-slate-400 border border-slate-300 flex items-center justify-center">
            2
          </div>
          <span className="text-slate-400 mt-2">Branding</span>
        </div>

        <div className="w-12 sm:w-16 h-0.5 bg-slate-300 -mt-5" />

        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-white text-slate-400 border border-slate-300 flex items-center justify-center">
            3
          </div>
          <span className="text-slate-400 mt-2">Team</span>
        </div>
      </div>

      {/* Form Card Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 shadow-md rounded-xl overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          <div className="p-8 space-y-6">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Input
                label="Workspace Name"
                required
                placeholder="e.g. Acme Design Studio"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setUrl(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                hint="You can change workspace names anytime in workspace settings."
              />
            </div>

             {/* Workspace URL */}
            <div className="space-y-2 pt-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Workspace Subdomain <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-md overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <span className="inline-flex items-center px-4 bg-slate-50 border-r border-slate-200 text-slate-450 text-sm font-semibold">
                  taskapp.com/
                </span>
                <input
                  type="text"
                  placeholder="acme-design"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-white text-sm focus:outline-none font-semibold text-slate-800"
                />
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>This subdomain is available</span>
              </div>
            </div>

            {/* Workspace Description */}
            <div className="space-y-2 pt-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of workspace goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-semibold text-slate-800"
              />
            </div>

            {/* Workspace Logo Upload */}
            <div className="space-y-2 pt-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Workspace Logo
              </label>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-550 cursor-pointer text-slate-400 hover:text-[#1a73e8] hover:border-primary transition-colors shrink-0 bg-white shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Upload workspace branding</h5>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    We support PNG, JPEG, and GIFs up to 5MB size.
                  </p>
                </div>
              </div>
            </div>

            {/* Invite Team Members */}
            <div className="space-y-2 pt-6">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Invite Initial Members
                </label>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional</span>
              </div>
              <div className="min-h-12 w-full p-2.5 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                {emails.map((email) => (
                  <div key={email} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                    <span>{email}</span>
                    <button type="button" onClick={() => handleRemoveEmail(email)} className="hover:text-red-500 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder={emails.length === 0 ? "Add email and press Enter..." : ""}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  className="flex-1 min-w-32 px-2 bg-transparent border-none focus:outline-none text-xs font-semibold placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Assign Role Dropdown */}
            <div className="space-y-2 pt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Role for Invited Members
              </label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none font-semibold"
              >
                <option value="Member">Member (Can edit tasks)</option>
                <option value="Admin">Admin (Full Workspace control)</option>
                <option value="Viewer">Viewer (Read-only access)</option>
              </select>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 bg-slate-50/50 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/workspaces')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              Create Space
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Feature Icons Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Secure by Design</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Enterprise-grade data encryption protocols built for secure team collaborations.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Instant Sync</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Sprint dashboards updates in real-time across your workspace.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Unlimited Teams</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Organize tasks with as many team members as required.
          </p>
        </div>
      </div>

    </div>
  );
};

export default CreateWorkspace;
