const { createInvitation, acceptInvitation } = require('../services/invitationService');
const Invitation = require('../models/Invitation');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');

const sendInvitation = asyncHandler(async (req, res) => {
  const { workspaceId, email, role } = req.body;
  const invite = await createInvitation(workspaceId, email, req.user, role);

  return res.json(new ApiResponse(200, invite, "Invitation email sent successfully!"));
});

const getInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({ email: req.user.email.toLowerCase() });
  return res.json(new ApiResponse(200, invitations));
});

const acceptInvitationPost = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const workspace = await acceptInvitation(token, req.user);

  return res.json(new ApiResponse(200, { workspaceId: workspace._id }, "Invitation accepted successfully!"));
});

const acceptInvitationGet = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!token) {
    return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #dc2626;">Invalid Link</h1>
          <p>No invitation token was provided.</p>
          <a href="${clientUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Go to ProjectGo</a>
        </div>
      `);
  }

  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #dc2626;">Invalid Invitation</h1>
          <p>The invitation link is invalid or has expired.</p>
          <a href="${clientUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Go to ProjectGo</a>
        </div>
      `);
  }

  if (invitation.status === 'accepted') {
    return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #dc2626;">Already Accepted</h1>
          <p>This invitation has already been accepted.</p>
          <a href="${clientUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Go to ProjectGo</a>
        </div>
      `);
  }

  if (invitation.status === 'cancelled') {
    return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #dc2626;">Cancelled</h1>
          <p>This invitation has been cancelled by the workspace owner.</p>
          <a href="${clientUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Go to ProjectGo</a>
        </div>
      `);
  }

  if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
    if (invitation.status !== 'expired') {
      invitation.status = 'expired';
      await invitation.save();
    }
    return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #dc2626;">Expired</h1>
          <p>Invitation link has expired.</p>
          <div style="margin-top: 20px;">
            <a href="${clientUrl}/login?requestInvite=true" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Request New Invitation</a>
          </div>
        </div>
      `);
  }

  // Check if user exists
  const user = await User.findOne({ email: invitation.email });
  if (user) {
    return res.redirect(`${clientUrl}/login?inviteToken=${token}&email=${encodeURIComponent(invitation.email)}`);
  } else {
    return res.redirect(`${clientUrl}/signup?inviteToken=${token}&email=${encodeURIComponent(invitation.email)}`);
  }
});

const getWorkspaceMembers = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
  const now = Date.now();

  // First check membership without populate (more reliable for large workspaces)
  const rawWorkspace = await Workspace.findById(workspaceId);
  if (!rawWorkspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const reqUserId = (req.user._id || req.user.id).toString();
  const rawOwnerId = rawWorkspace.owner ? rawWorkspace.owner.toString() : '';
  const isMember =
    rawOwnerId === reqUserId ||
    (rawWorkspace.members || []).some(m => m && m.toString() === reqUserId);

  if (!isMember) {
    throw new ApiError(403, 'Forbidden: You do not have access to this workspace member list');
  }

  // Now do the full populate
  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', 'fullName nickname phone bio email photoURL lastSeen')
    .populate('members', 'fullName nickname phone bio email photoURL lastSeen');

  const computeOnline = (user) => {
    return !!(user && user.lastSeen && (now - new Date(user.lastSeen).getTime()) < ONLINE_THRESHOLD_MS);
  };

  const membersList = [];

  if (workspace.owner) {
    const ownerOnline = computeOnline(workspace.owner);
    membersList.push({
      id: workspace.owner._id || workspace.owner.id,
      name: workspace.owner.fullName || workspace.owner.email || 'Owner',
      nickname: workspace.owner.nickname || '',
      email: workspace.owner.email || '',
      phone: workspace.owner.phone || '',
      bio: workspace.owner.bio || '',
      avatar: workspace.owner.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(workspace.owner.fullName || 'Owner')}`,
      role: 'Owner',
      isOnline: ownerOnline,
      status: ownerOnline ? 'Online' : 'Offline',
      lastSeen: workspace.owner.lastSeen || null,
      joinedAt: workspace.createdAt
    });
  }

  (workspace.members || []).forEach(member => {
    if (!member || (!member._id && !member.id)) return;
    const memberId = (member._id || member.id).toString();
    const ownerId = workspace.owner ? (workspace.owner._id || workspace.owner.id).toString() : '';
    if (ownerId && memberId === ownerId) return;

    const memberRoleObj = workspace.memberRoles?.find(mr => mr.user && mr.user.toString() === memberId);
    const role = memberRoleObj ? memberRoleObj.role : 'Member';
    const memberOnline = computeOnline(member);

    membersList.push({
      id: member._id || member.id,
      name: member.fullName || member.email || 'Member',
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      bio: member.bio || '',
      avatar: member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || 'Member')}`,
      role: role,
      isOnline: memberOnline,
      status: memberOnline ? 'Online' : 'Offline',
      lastSeen: member.lastSeen || null,
      joinedAt: workspace.createdAt
    });
  });

  return res.json(new ApiResponse(200, membersList));
});

const cancelInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invitation = await Invitation.findById(id);
  if (!invitation) {
    throw new ApiError(404, 'Invitation not found');
  }

  const workspace = await Workspace.findById(invitation.workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const reqUserId = (req.user._id || req.user.id).toString();
  const rawOwnerId = workspace.owner ? workspace.owner.toString() : '';

  // Only workspace owner can cancel
  if (rawOwnerId !== reqUserId) {
    throw new ApiError(403, 'Forbidden: Only the workspace owner can cancel invitations');
  }

  invitation.status = 'cancelled';
  await invitation.save();

  return res.json(new ApiResponse(200, invitation, "Invitation cancelled successfully"));
});

const getWorkspaceInvitations = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const reqUserId = (req.user._id || req.user.id).toString();
  const rawOwnerId = workspace.owner ? workspace.owner.toString() : '';
  const isMember =
    rawOwnerId === reqUserId ||
    (workspace.members || []).some(m => m && m.toString() === reqUserId);

  if (!isMember) {
    throw new ApiError(403, 'Forbidden: You do not have access to this workspace invitations');
  }

  // Find pending non-expired invitations for this workspace
  const invitations = await Invitation.find({
    workspaceId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).select('_id email role status createdAt expiresAt');

  return res.json(new ApiResponse(200, invitations));
});

const removeWorkspaceMember = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const reqUserId = (req.user._id || req.user.id).toString();
  const rawOwnerId = workspace.owner ? workspace.owner.toString() : '';

  // Only owner or admin can remove members
  const memberRoleObj = workspace.memberRoles?.find(mr => mr && mr.user && mr.user.toString() === reqUserId);
  const isOwner = rawOwnerId === reqUserId;
  const isAdmin = isOwner || (memberRoleObj && memberRoleObj.role === 'Admin');

  if (!isAdmin) {
    throw new ApiError(403, "Only workspace owner or admin can remove members");
  }

  // Don't allow removing the owner
  if (rawOwnerId === userId) {
    throw new ApiError(400, "Owner cannot be removed");
  }

  // Remove only the selected member
  workspace.members.pull(userId);

  // Remove the member role
  workspace.memberRoles = workspace.memberRoles.filter(
    mr => mr && mr.user && mr.user.toString() !== userId
  );

  await workspace.save();

  return res.json(
    new ApiResponse(200, null, "Member removed successfully")
  );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;

  if (!['Admin', 'Member', 'Viewer'].includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const reqUserId = (req.user._id || req.user.id).toString();
  const rawOwnerId = workspace.owner ? workspace.owner.toString() : '';

  const isOwner = rawOwnerId === reqUserId;
  const memberRoleObj = workspace.memberRoles?.find(mr => mr && mr.user && mr.user.toString() === reqUserId);
  const isAdmin = isOwner || (memberRoleObj && memberRoleObj.role === 'Admin');

  if (!isAdmin) {
    throw new ApiError(403, "Only workspace owner or admin can update member roles");
  }

  if (rawOwnerId === userId) {
    throw new ApiError(400, "Owner role cannot be changed");
  }

  if (!workspace.memberRoles) workspace.memberRoles = [];
  const targetRoleObj = workspace.memberRoles.find(mr => mr && mr.user && mr.user.toString() === userId);
  if (targetRoleObj) {
    targetRoleObj.role = role;
  } else {
    workspace.memberRoles.push({ user: userId, role });
  }

  await workspace.save();
  return res.json(new ApiResponse(200, { userId, role }, "Member role updated successfully"));
});

module.exports = {
  sendInvitation,
  getInvitations,
  acceptInvitationPost,
  acceptInvitationGet,
  getWorkspaceMembers,
  cancelInvitation,
  getWorkspaceInvitations,
  removeWorkspaceMember,
  updateMemberRole
};
