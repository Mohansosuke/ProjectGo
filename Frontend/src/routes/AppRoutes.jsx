import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import CreateWorkspace from '../pages/CreateWorkspace';
import WorkspaceView from '../pages/WorkspaceView';
import Kanban from '../pages/Kanban';
import TaskView from '../pages/TaskView';
import TeamMembers from '../pages/TeamMembers';
import InviteMembers from '../pages/InviteMembers';
import WorkspaceSettings from '../pages/WorkspaceSettings';
import Profile from '../pages/Profile';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyEmail from '../pages/VerifyEmail';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/create-workspace" element={<CreateWorkspace />} />
        <Route path="/workspaces" element={<WorkspaceView />} />
        <Route path="/workspace/:workspaceId/kanban" element={<Kanban />} />
        <Route path="/workspace/:workspaceId/task/:taskId" element={<TaskView />} />
        <Route path="/workspace/:workspaceId/members" element={<TeamMembers />} />
        <Route path="/workspace/:workspaceId/invite" element={<InviteMembers />} />
        <Route path="/workspace/:workspaceId/settings" element={<WorkspaceSettings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
