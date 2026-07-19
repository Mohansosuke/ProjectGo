const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendWorkspaceInvitationEmail } = require('./emailService');

const createInvitation = async (workspaceId, email, inviterUser, role = 'Member') => {
  const lowercaseEmail = email.toLowerCase();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  // Only workspace owner or admin can invite
  const isOwner = workspace.owner.toString() === inviterUser._id.toString();
  const memberRoleObj = workspace.memberRoles?.find(mr => mr.user.toString() === inviterUser._id.toString());
  const userRole = isOwner ? 'Admin' : (memberRoleObj ? memberRoleObj.role : 'Member');

  if (userRole !== 'Admin') {
    throw new ApiError(403, 'Forbidden: Only workspace owners and admins can invite members');
  }

  // Email cannot already be a member
  const invitedUser = await User.findOne({ email: lowercaseEmail });
  if (invitedUser) {
    const isAlreadyMember = workspace.members.some(m => m.toString() === invitedUser._id.toString()) ||
                            workspace.owner.toString() === invitedUser._id.toString();
    if (isAlreadyMember) {
      throw new ApiError(400, 'This user is already a member of this workspace.');
    }
  }

  // Do not allow duplicate pending invitations
  const existingInvite = await Invitation.findOne({
    workspaceId,
    email: lowercaseEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
  if (existingInvite) {
    throw new ApiError(400, 'Invitation already sent.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const invite = await Invitation.create({
    workspaceId,
    email: lowercaseEmail,
    invitedBy: inviterUser._id,
    token,
    expiresAt,
    status: 'pending',
    role
  });

  sendWorkspaceInvitationEmail(
  email,
  invite.token,
  workspace.name,
  inviterUser.fullName
).catch(err => {
  console.error("Invitation email failed:", err);
});

  return invite;
};

const acceptInvitation = async (token, user) => {
  const invitation = await Invitation.findOne({ token });
  if (!invitation || invitation.expiresAt < new Date()) {
    throw new ApiError(400, 'Invitation is invalid or has expired.');
  }

  const workspace = await Workspace.findById(invitation.workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(400, 'This invitation was sent to a different email address.');
  }

  if (invitation.status === 'accepted') {
    return workspace;
  }

  // Add user to members if not already there
  const isMember = workspace.members.some(m => m.toString() === user._id.toString());
  if (!isMember && workspace.owner.toString() !== user._id.toString()) {
    workspace.members.push(user._id);
  }

  const hasRole = workspace.memberRoles?.some(mr => mr.user.toString() === user._id.toString());
  if (!hasRole && workspace.owner.toString() !== user._id.toString()) {
    if (!workspace.memberRoles) workspace.memberRoles = [];
    workspace.memberRoles.push({ user: user._id, role: invitation.role || 'Member' });
  }

  await workspace.save();

  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();
  await invitation.save();

  return workspace;
};

const acceptPendingInvitationsForEmail = async (email, user) => {
  if (!email || !user) return;
  const lowercaseEmail = email.toLowerCase();

  const invitations = await Invitation.find({
    email: lowercaseEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  for (const invitation of invitations) {
    const workspace = await Workspace.findById(invitation.workspaceId);
    if (workspace) {
      const isMember = workspace.members.some(m => m.toString() === user._id.toString());
      if (!isMember && workspace.owner.toString() !== user._id.toString()) {
        workspace.members.push(user._id);
      }

      const hasRole = workspace.memberRoles?.some(mr => mr.user.toString() === user._id.toString());
      if (!hasRole && workspace.owner.toString() !== user._id.toString()) {
        if (!workspace.memberRoles) workspace.memberRoles = [];
        workspace.memberRoles.push({ user: user._id, role: invitation.role || 'Member' });
      }

      await workspace.save();
    }
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();
  }
};

module.exports = {
  createInvitation,
  acceptInvitation,
  acceptPendingInvitationsForEmail
};
