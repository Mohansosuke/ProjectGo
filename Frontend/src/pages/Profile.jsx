import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTask } from '../contexts/TaskContext';
import { Button, Input, Avatar, Badge } from '../components/ui';
import apiClient from '../services/apiClient';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const { tasks } = useTask();

  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || 'Mohan');
  const [preferredName, setPreferredName] = useState(currentUser?.nickname || currentUser?.fullName || currentUser?.name || 'Mohan');
  const [bio, setBio] = useState(currentUser?.bio || 'Lead Developer & Project Manager. Focused on scaling architectures and intuitive task flows.');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 000-1234');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || currentUser?.avatar || 'https://i.pravatar.cc/80?img=12');
  const [coverUrl, setCoverUrl] = useState(currentUser?.cover || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    if (activeWorkspace) {
      navigate(`/workspace/${activeWorkspace.id}/kanban`);
    } else {
      navigate('/workspaces');
    }
  };

  const handleSave = async () => {
    await updateProfile({
      name: fullName,
      nickname: preferredName,
      bio,
      phone,
      avatar: avatarUrl,
      cover: coverUrl
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      setDeleteError('');
      await apiClient.delete('/auth/delete-account');
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err?.message || 'Failed to delete account.');
    }
  };

  const assignedTasks = tasks.filter(t => t.assignee === currentUser.id);

  const activityLog = [
    {
      id: 1,
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'Completed task',
      link: 'CORE-1204',
      sub: '"Update design system tokens for Dar..."',
      time: '2 hours ago',
    },
    {
      id: 2,
      icon: <MessageSquare className="w-4 h-4 text-amber-500" />,
      bg: 'bg-amber-50 border-amber-100',
      text: 'Commented on',
      link: 'MOB-88',
      sub: '"The padding on the mobile view looks slightly off in the latest mockup..."',
      time: '5 hours ago',
    },
    {
      id: 3,
      icon: <PlusCircle className="w-4 h-4 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-100',
      text: 'Updated status of',
      link: 'UI-902',
      statusFrom: 'TO DO',
      statusTo: 'IN PROGRESS',
      time: 'Yesterday',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8 pb-12 transition-colors duration-300">
      
      {/* Center Settings Column */}
      <div className="flex-1 space-y-6">
        {/* Profile Card Header with Cover Banner */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-colors relative">
          {/* Cover Banner */}
          <div className="h-32 w-full relative overflow-hidden bg-slate-100">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />
            )}
            {isEditing && (
              <label className="absolute inset-0 bg-black/40 hover:bg-black/55 flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all">
                Change Cover Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </label>
            )}
          </div>
          
          <div className="p-6 pt-0 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative">
            {/* Avatar positioned overlapping the banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-10 sm:-mt-12">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-white relative group">
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 hover:bg-black/55 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all text-center p-1 leading-tight">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                )}
              </div>
              <div className="sm:pt-14 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">
                  {fullName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                  {bio || 'Product Lead • Engineering Division'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2.5">
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Online
                  </span>
                  <span className="inline-flex items-center text-xs text-slate-500 font-semibold">
                    <MapPin className="mr-1 w-3.5 h-3.5 text-slate-400" />
                    San Francisco, CA
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto sm:pt-6">
              {isEditing ? (
                <>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    className="bg-[#5f35f5] text-white hover:bg-[#4c1d95]"
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFullName(currentUser.fullName || currentUser.name || '');
                      setPreferredName(currentUser.nickname || currentUser.fullName || currentUser.name || '');
                      setBio(currentUser.bio || '');
                      setPhone(currentUser.phone || '');
                      setAvatarUrl(currentUser.photoURL || currentUser.avatar || '');
                      setCoverUrl(currentUser.cover || '');
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    icon={Edit2}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleBack}
                  >
                    Done
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Personal Information Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
              Personal Information
            </h3>
            {isEditing && (
              <Badge variant="primary" size="sm">
                Editing mode active
              </Badge>
            )}
          </div>

          <div className="space-y-5">
            {isEditing && (
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-3.5">
                <Input
                  label="Profile Picture URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Paste image URL..."
                />
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                    Or select a pre-made avatar
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[12, 47, 15, 33, 52, 60, 65, 41].map(imgId => {
                      const presetUrl = `https://i.pravatar.cc/150?img=${imgId}`;
                      return (
                        <button
                          key={imgId}
                          type="button"
                          onClick={() => setAvatarUrl(presetUrl)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                            avatarUrl === presetUrl ? 'border-[#5f35f5] scale-110 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <img src={presetUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
              />
              <Input
                label="Preferred Name"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:bg-slate-50/50 disabled:text-slate-500 font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
              <Input
                label="Email Address"
                type="email"
                value={currentUser.email}
                disabled
              />

              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">
              Danger Zone
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Account</h4>
              <p className="text-xs text-slate-500 mt-1">
                Permanently delete your account, workspaces, and all associated task records. This action is irreversible.
              </p>
            </div>
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-650 text-white hover:bg-red-700 font-bold text-xs px-4 py-2 rounded-lg"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Assigned Tasks & Workspace Memberships Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Assigned Tasks */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-colors">
            <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mb-4">
              Assigned Tasks ({assignedTasks.length})
            </h3>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {assignedTasks.length > 0 ? (
                assignedTasks.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => navigate(`/workspace/${t.workspaceId}/task/${t.id}`)}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-350 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate mr-2">
                      {t.title}
                    </span>
                    <Badge variant={t.priority === 'Critical' ? 'danger' : 'primary'} size="sm">
                      {t.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                  No tasks currently assigned.
                </div>
              )}
            </div>
          </div>

          {/* Workspace Memberships */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-colors">
            <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mb-4">
              Workspace Memberships ({workspaces.length})
            </h3>
            <div className="space-y-3">
              {workspaces.map((w) => (
                <div 
                  key={w.id}
                  onClick={() => {
                    navigate(`/workspace/${w.id}/kanban`);
                  }}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center space-x-3"
                >
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                    {w.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {w.name}
                    </p>
                    <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wide">
                      {w.visibility}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Activity Timeline */}
      <div className="w-full lg:w-[350px] shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 transition-colors">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Activity className="w-4.5 h-4.5 text-blue-600" />
            <span>Recent Activity</span>
          </h3>

          <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-6 pb-2">
            {activityLog.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[38px] top-0 w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100">
                  {item.icon}
                </div>

                <div className="text-xs">
                  <p className="text-slate-700 leading-relaxed font-semibold">
                    {item.text} <span className="text-blue-600 font-bold">{item.link}</span>
                  </p>
                  
                  {item.sub && (
                    <p className="text-[11px] text-slate-400 font-medium italic mt-0.5">
                      {item.sub}
                    </p>
                  )}

                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full text-xs font-bold text-slate-650">
            View All Activity
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Account Permanently?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This action cannot be undone. Please type <span className="font-extrabold text-red-600">DELETE</span> in the box below to confirm that you wish to delete your account, all your workspaces, tasks, and data permanently.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full"
            />
            {deleteError && (
              <p className="text-xs font-semibold text-red-650 mt-1">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
