import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  MessageSquare,
  PlusCircle,
  MapPin,
  Mail,
  Clock,
  Briefcase,
  Edit2,
  Activity,
  Phone,
  Camera,
  X,
  ArrowLeft,
  Trash2,
  Save,
  ChevronRight,
  User,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { Badge } from '../components/ui';
import apiClient from '../services/apiClient';

const PRIORITY_COLORS = {
  Critical: 'bg-red-50 text-red-600 border border-red-200',
  High: 'bg-orange-50 text-orange-600 border border-orange-200',
  Medium: 'bg-blue-50 text-blue-600 border border-blue-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const STATUS_COLORS = {
  COMPLETED: 'bg-emerald-50 text-emerald-600',
  'IN PROGRESS': 'bg-violet-50 text-violet-600',
  'TO DO': 'bg-slate-100 text-slate-500',
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">{label}</label>
    {children}
  </div>
);

const ReadValue = ({ icon: Icon, value, placeholder }) => (
  <div className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 min-h-[42px]">
    {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
    <span className={value ? 'text-slate-800' : 'text-slate-400 italic'}>{value || placeholder}</span>
  </div>
);

const EditInput = ({ value, onChange, placeholder, type = 'text', disabled = false }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
  />
);

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const { tasks } = useTask();

  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [preferredName, setPreferredName] = useState(currentUser?.nickname || currentUser?.fullName || currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || currentUser?.avatar || '');
  const [coverUrl, setCoverUrl] = useState(currentUser?.cover || '');
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.name || '');
      setPreferredName(currentUser.nickname || currentUser.fullName || currentUser.name || '');
      setBio(currentUser.bio || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.photoURL || currentUser.avatar || '');
      setCoverUrl(currentUser.cover || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setAvatarUrl(base64);
      try { await updateProfile({ avatar: base64 }); } catch { }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setCoverUrl(base64);
      try { await updateProfile({ cover: base64 }); } catch { }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBack = () => {
    if (activeWorkspace) navigate(`/workspace/${activeWorkspace.id}/kanban`);
    else navigate('/workspaces');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name: fullName, nickname: preferredName, bio, phone, avatar: avatarUrl, cover: coverUrl });
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFullName(currentUser.fullName || currentUser.name || '');
    setPreferredName(currentUser.nickname || currentUser.fullName || currentUser.name || '');
    setBio(currentUser.bio || '');
    setPhone(currentUser.phone || '');
    setAvatarUrl(currentUser.photoURL || currentUser.avatar || '');
    setCoverUrl(currentUser.cover || '');
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError('');
      setDeletingAccount(true);
      await apiClient.delete('/auth/delete-account');
      logout();
      navigate('/login');
    } catch (err) {
      setDeletingAccount(false);
      setDeleteError(err?.response?.data?.message || err?.message || 'Failed to delete account.');
    }
  };

  const assignedTasks = tasks.filter(t => t.assignee === currentUser.id);

  const activityLog = [
    {
      id: 1,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-100',
      text: 'Completed task',
      link: 'CORE-1204',
      sub: '"Update design system tokens for Dar…"',
      time: '2 hours ago',
    },
    {
      id: 2,
      icon: MessageSquare,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      ring: 'ring-amber-100',
      text: 'Commented on',
      link: 'MOB-88',
      sub: '"Padding on mobile view looks slightly off in latest mockup…"',
      time: '5 hours ago',
    },
    {
      id: 3,
      icon: PlusCircle,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      ring: 'ring-indigo-100',
      text: 'Moved',
      link: 'UI-902',
      sub: 'TO DO → IN PROGRESS',
      time: 'Yesterday',
    }
  ];

  const PRESET_AVATARS = [12, 47, 15, 33, 52, 60, 65, 41];

  return (
    <div className="min-h-screen bg-[#f7f8fc] pb-16">
      {/* Hidden file inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Back bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-indigo-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Card ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80">
          {/* Cover */}
          <div className="relative h-40 group overflow-hidden">
            {coverUrl
              ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-500" />
            }
            {/* shimmer gloss */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/20 pointer-events-none" />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/20 transition-all cursor-pointer"
            >
              <Camera className="w-3 h-3" /> Edit Cover
            </button>
          </div>

          {/* Identity strip */}
          <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 relative">
            {/* Avatar */}
            <div className="relative w-20 h-20 shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-slate-100">
                <img
                  src={avatarUrl || `https://i.pravatar.cc/80?img=12`}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors cursor-pointer border-2 border-white"
                  title="Change avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 sm:pb-1.5">
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">
                {fullName || 'Your Name'}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1 leading-snug line-clamp-1">
                {bio || 'Add a short bio in Edit Profile'}
              </p>
              <div className="flex items-center flex-wrap gap-3 mt-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  Online
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Mail className="w-3 h-3" />
                  {currentUser.email}
                </span>
                {phone && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Phone className="w-3 h-3" />
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Personal Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Personal Information</h2>
                {isEditing && (
                  <span className="ml-auto text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Editing
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Preset avatars when editing */}
                {isEditing && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Avatar Presets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map(imgId => {
                        const url = `https://i.pravatar.cc/150?img=${imgId}`;
                        return (
                          <button
                            key={imgId}
                            onClick={() => setAvatarUrl(url)}
                            className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${avatarUrl === url
                                ? 'border-indigo-500 scale-110 shadow-sm shadow-indigo-200'
                                : 'border-slate-200 hover:border-indigo-300 hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    {isEditing
                      ? <EditInput value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                      : <ReadValue value={fullName} placeholder="Not set" />
                    }
                  </Field>
                  <Field label="Preferred Name">
                    {isEditing
                      ? <EditInput value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="Nickname or display name" />
                      : <ReadValue value={preferredName} placeholder="Not set" />
                    }
                  </Field>
                </div>

                <Field label="Bio">
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="A short intro about you…"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                    />
                  ) : (
                    <ReadValue value={bio} placeholder="No bio added yet" />
                  )}
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <Field label="Email Address">
                    <ReadValue icon={Mail} value={currentUser.email} />
                  </Field>
                  <Field label="Phone Number">
                    {isEditing
                      ? <EditInput value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
                      : <ReadValue icon={Phone} value={phone} placeholder="Not added" />
                    }
                  </Field>
                </div>
              </div>
            </div>

            {/* Assigned Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Assigned Tasks</h2>
                <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {assignedTasks.length}
                </span>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto space-y-2">
                {assignedTasks.length > 0 ? assignedTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/workspace/${t.workspaceId}/task/${t.id}`)}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900">
                      {t.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority] || 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {t.priority}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No tasks currently assigned.
                  </div>
                )}
              </div>
            </div>

            {/* Workspace Memberships */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Workspace Memberships</h2>
                <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {workspaces.length}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {workspaces.map(w => (
                  <div
                    key={w.id}
                    onClick={() => navigate(`/workspace/${w.id}/kanban`)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0 shadow-sm">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-slate-900">{w.name}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{w.visibility || 'Private'}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-red-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-red-100">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-red-500" />
                </div>
                <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
              </div>
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Delete Account</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-sm">
                    Permanently delete your account, workspaces, and all associated data. This is irreversible.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Overview</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tasks', value: assignedTasks.length, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { label: 'Done', value: assignedTasks.filter(t => t.status === 'COMPLETED').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Spaces', value: workspaces.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-0">
                {activityLog.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.id} className="flex gap-3.5 py-3.5 relative">
                      {/* vertical line */}
                      {idx < activityLog.length - 1 && (
                        <div className="absolute left-[17px] top-[40px] bottom-0 w-px bg-slate-100" />
                      )}
                      <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0 relative z-10`}>
                        <IconComponent className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                          {item.text} <span className="font-bold text-indigo-600">{item.link}</span>
                        </p>
                        {item.sub && (
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">{item.sub}</p>
                        )}
                        <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-4">
                <button className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Account?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This will <strong className="text-slate-700">permanently delete</strong> your account, all workspaces, tasks, and data. This action cannot be undone.
                  </p>
                </div>
              </div>
              {deleteError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                  disabled={deletingAccount}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-colors disabled:opacity-60 shadow-sm"
                >
                  {deletingAccount ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
