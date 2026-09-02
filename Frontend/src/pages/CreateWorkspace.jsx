import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UploadCloud, X, Plus, ChevronDown,
  Briefcase, ArrowLeft, Check, User
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import apiClient from '../services/apiClient';

const ROLES = [
  { value: 'Member',  label: 'Member',  desc: 'Can view and edit tasks' },
  { value: 'Admin',   label: 'Admin',   desc: 'Full workspace control' },
  { value: 'Viewer',  label: 'Viewer',  desc: 'Read-only access' },
];

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const { createWorkspace } = useWorkspace();
  const logoInputRef = useRef(null);

  const [name, setName]               = useState('');
  const [subdomain, setSubdomain]     = useState('');
  const [description, setDescription] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64]   = useState('');
  const [emails, setEmails]           = useState([]);
  const [emailInput, setEmailInput]   = useState('');
  const [assignRole, setAssignRole]   = useState('Member');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleNameChange = (val) => {
    setName(val);
    setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleLogoPick = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target.result;
      if (typeof result === 'string') {
        setLogoPreview(result);
        setLogoBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoInputChange = (e) => handleLogoPick(e.target.files?.[0]);

  const handleLogoDrop = (e) => {
    e.preventDefault();
    handleLogoPick(e.dataTransfer.files?.[0]);
  };

  const addEmail = () => {
    const val = emailInput.trim();
    if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && !emails.includes(val)) {
      setEmails(p => [...p, val]);
    }
    setEmailInput('');
  };

  const handleEmailKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Workspace name is required'); return; }
    setLoading(true);
    try {
      const newWs = await createWorkspace({
        name: name.trim(),
        subdomain: subdomain || name.toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        logoUrl: logoBase64,
      });

      const wsId = newWs?.id || newWs?._id;
      if (wsId) {
        const all = [...emails];
        const v = emailInput.trim();
        if (v && !all.includes(v)) all.push(v);
        await Promise.allSettled(
          all.map(email => apiClient.post('/invitations', { workspaceId: wsId, email, role: assignRole }))
        );
      }
      navigate('/workspaces');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === assignRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Back */}
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-8 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to workspaces
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create a Workspace</h1>
              <p className="text-sm text-slate-500 mt-0.5">Set up your team's collaborative hub</p>
            </div>
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-7">

              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-semibold">
                  <X className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Logo + Name side by side */}
              <div className="flex items-start gap-5">

                {/* Logo upload */}
                <div className="shrink-0">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Logo</p>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleLogoDrop}
                    className="relative w-[84px] h-[84px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group overflow-hidden"
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <UploadCloud className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-[8px] font-bold uppercase tracking-wide text-center leading-tight">Upload<br/>Logo</span>
                      </div>
                    )}
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setLogoPreview(null); setLogoBase64(''); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium mt-1.5 text-center w-[84px]">PNG, JPG ≤ 5MB</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={handleLogoInputChange}
                  />
                </div>

                {/* Name + Subdomain stacked */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      Workspace Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Design Studio"
                      value={name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      Workspace Subdomain <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                      <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-400 text-xs font-bold whitespace-nowrap">
                        taskapp.com/
                      </span>
                      <input
                        type="text"
                        placeholder="acme-design"
                        value={subdomain}
                        onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        required
                        className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="What's this workspace for? Briefly describe your team's goals…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Invite Members */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Invite Initial Members</label>
                  <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest">Optional</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-2.5">Press Enter or comma after each email address</p>
                <div className="min-h-12 w-full p-2.5 flex flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  {emails.map(email => (
                    <span key={email} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-lg">
                      <User className="w-3 h-3" />
                      {email}
                      <button type="button" onClick={() => setEmails(p => p.filter(e => e !== email))} className="hover:text-rose-500 transition-colors cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={emails.length === 0 ? 'teammate@company.com' : ''}
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKey}
                    onBlur={addEmail}
                    autoComplete="off"
                    className="flex-1 min-w-40 px-1.5 bg-transparent focus:outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Assign Role */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Assign Role for Invited Members</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRoleMenu(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-400 transition-all focus:outline-none cursor-pointer"
                  >
                    <div>
                      <span className="text-sm font-bold text-slate-800">{selectedRole.label}</span>
                      <span className="ml-2 text-xs text-slate-400 font-medium">{selectedRole.desc}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5">
                      {ROLES.map(role => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => { setAssignRole(role.value); setShowRoleMenu(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="text-sm font-bold text-slate-800">{role.label}</span>
                            <span className="ml-2 text-xs text-slate-400">{role.desc}</span>
                          </div>
                          {assignRole === role.value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50/60 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/workspaces')}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Workspace
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <p className="text-center text-[11px] text-slate-400 font-medium mt-6">
          You can change all settings anytime from Workspace Settings.
        </p>
      </div>
    </div>
  );
};

export default CreateWorkspace;

