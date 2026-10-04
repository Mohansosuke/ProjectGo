const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendWorkspaceInvitationEmail } = require('./emailService');

const normalizeEmail = (email) => {
  if (!email) return '';
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return email.toLowerCase().trim();
  let [local, domain] = parts;
  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '');
  }
  return `${local}@${domain}`;
};

const getGmailRegex = (email) => {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2 || parts[1] !== 'gmail.com') return null;
  const local = parts[0].replace(/\./g, '');
  const regexStr = '^' + local.split('').map(char => `${char}\\.?`).join('') + '@gmail\\.com$';
  return new RegExp(regexStr, 'i');
};

const getObjIdStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  if (val.id) return val.id.toString();
  return val.toString();
};

const createInvitation = async (workspaceId, email, inviterUser, role = 'Member') => {
  const lowercaseEmail = email.toLowerCase();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const inviterIdStr = getObjIdStr(inviterUser);
  const rawOwnerId = getObjIdStr(workspace.owner);

  // Only workspace owner or admin can invite
  const isOwner = rawOwnerId === inviterIdStr;
  const memberRoleObj = (workspace.memberRoles || []).find(mr => mr && mr.user && getObjIdStr(mr.user) === inviterIdStr);
  const userRole = isOwner ? 'Admin' : (memberRoleObj ? memberRoleObj.role : 'Member');

  if (userRole !== 'Admin') {
    throw new ApiError(403, 'Forbidden: Only workspace owners and admins can invite members');
  }

  // Email cannot already be a member
  const invitedUser = await User.findOne({ email: lowercaseEmail });
  if (invitedUser) {
    const invitedUserIdStr = getObjIdStr(invitedUser);
    const isAlreadyMember = (workspace.members || []).some(m => m && getObjIdStr(m) === invitedUserIdStr) ||
      rawOwnerId === invitedUserIdStr;
    if (isAlreadyMember) {
      throw new ApiError(400, 'This user is already a member of this workspace.');
    }
  }

  // Do not allow duplicate pending invitations
  const inviteQuery = {
    workspaceId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  };
  const gmailRegex = getGmailRegex(lowercaseEmail);
  if (gmailRegex) {
    inviteQuery.email = { $regex: gmailRegex };
  } else {
    inviteQuery.email = lowercaseEmail;
  }

  const existingInvite = await Invitation.findOne(inviteQuery);
  if (existingInvite) {
    throw new ApiError(400, 'Invitation already sent.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const invite = await Invitation.create({
    workspaceId,
    email: lowercaseEmail,
    invitedBy: inviterUser._id || inviterUser.id,
    token,
    expiresAt,
    status: 'pending',
    role
  });

  sendWorkspaceInvitationEmail(
    email,
    invite.token,
    workspace.name,
    inviterUser.fullName || inviterUser.name || 'Workspace Admin'
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

  if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
    throw new ApiError(400, 'This invitation was sent to a different email address.');
  }

  if (invitation.status === 'accepted') {
    return workspace;
  }

  const userIdStr = getObjIdStr(user);
  const rawOwnerId = getObjIdStr(workspace.owner);

  // Add user to members if not already there
  const isMember = (workspace.members || []).some(m => m && getObjIdStr(m) === userIdStr);
  if (!isMember && rawOwnerId !== userIdStr) {
    workspace.members.push(user._id || user.id);
  }

  const hasRole = (workspace.memberRoles || []).some(mr => mr && mr.user && getObjIdStr(mr.user) === userIdStr);
  if (!hasRole && rawOwnerId !== userIdStr) {
    if (!workspace.memberRoles) workspace.memberRoles = [];
    workspace.memberRoles.push({ user: user._id || user.id, role: invitation.role || 'Member' });
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

  const query = {
    status: 'pending',
    expiresAt: { $gt: new Date() }
  };

  const gmailRegex = getGmailRegex(lowercaseEmail);
  if (gmailRegex) {
    query.email = { $regex: gmailRegex };
  } else {
    query.email = lowercaseEmail;
  }

  const invitations = await Invitation.find(query);

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
