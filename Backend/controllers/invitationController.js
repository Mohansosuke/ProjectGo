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

    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'fullName email photoURL bio')
      .populate('members', 'fullName email photoURL bio');

    if (!workspace) {
      throw new ApiError(404, 'Workspace not found');
    }

    const isMember = workspace.members.some(m => m._id.toString() === req.user._id.toString()) ||
                    workspace.owner._id.toString() === req.user._id.toString();

    if (!isMember) {
      throw new ApiError(403, 'Forbidden: You do not have access to this workspace member list');
    }

    const membersList = [];

    membersList.push({
      id: workspace.owner._id,
      name: workspace.owner.fullName,
      email: workspace.owner.email,
      avatar: workspace.owner.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(workspace.owner.fullName)}`,
      role: 'Owner',
      status: 'Active',
      joinedAt: workspace.createdAt
    });

    workspace.members.forEach(member => {
      if (member._id.toString() !== workspace.owner._id.toString()) {
        const memberRoleObj = workspace.memberRoles?.find(mr => mr.user.toString() === member._id.toString());
        const role = memberRoleObj ? memberRoleObj.role : 'Member';

        membersList.push({
          id: member._id,
          name: member.fullName,
          email: member.email,
          avatar: member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`,
          role: role,
          status: 'Active',
          joinedAt: workspace.createdAt
        });
      }
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

    // Only workspace owner can cancel
    if (workspace.owner.toString() !== req.user._id.toString()) {
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

    // Only workspace owner can view
    if (workspace.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Forbidden: Only the workspace owner can view invitations');
    }

    // Find pending non-expired invitations for this workspace
    const invitations = await Invitation.find({
      workspaceId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).select('email status createdAt expiresAt');

    return res.json(new ApiResponse(200, invitations));
  });

  module.exports = {
    sendInvitation,
    getInvitations,
    acceptInvitationPost,
    acceptInvitationGet,
    getWorkspaceMembers,
    cancelInvitation,
    getWorkspaceInvitations
  };
