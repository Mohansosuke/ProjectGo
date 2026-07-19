const { registerUser, verifyEmail, loginUser, requestPasswordReset, resetPassword } = require('../services/authService');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = require('../utils/generateToken');

const getAbsoluteUrl = (pathStr) => {
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:')) {
    return pathStr;
  }
  return `${process.env.SERVER_URL}${pathStr}`;
};

const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  await registerUser(fullName, email, password);

  return res
    .status(201)
    .json(new ApiResponse(201, null, "Signup successful! Please check your email to verify your account."));
});

const verifyEmailController = asyncHandler(async (req, res) => {
  console.log("===== VERIFY EMAIL CONTROLLER =====");
  console.log("Token:", req.params.token);

  const user = await verifyEmail(req.params.token);

  console.log("User verified:", user.email);

  try {
    const { acceptPendingInvitationsForEmail } = require('../services/invitationService');
    await acceptPendingInvitationsForEmail(user.email, user);
  } catch (err) {
    console.error("Failed to auto-accept invitations during verification:", err);
  }

  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?verified=true`);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await loginUser(email, password);

  try {
    const { acceptPendingInvitationsForEmail } = require('../services/invitationService');
    await acceptPendingInvitationsForEmail(user.email, user);
  } catch (err) {
    console.error("Failed to auto-accept invitations during login:", err);
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json(new ApiResponse(200, {
    uid: user._id,
    id: user._id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    photoURL: getAbsoluteUrl(user.photoURL),
    bio: user.bio,
    phone: user.phone,
    nickname: user.nickname,
    cover: getAbsoluteUrl(user.cover),
    coverPhoto: getAbsoluteUrl(user.coverPhoto)
  }, "Logged in successfully"));
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  return res.json(new ApiResponse(200, null, "Logged out successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await requestPasswordReset(email);

  return res.json(new ApiResponse(200, null, "A password reset email has been sent. Please check your inbox."));
});

const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await resetPassword(token, newPassword);

  return res.json(new ApiResponse(200, null, "Password reset successful! You can now log in."));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json(new ApiResponse(200, {
    uid: user._id,
    id: user._id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    photoURL: getAbsoluteUrl(user.photoURL),
    bio: user.bio,
    phone: user.phone,
    nickname: user.nickname,
    cover: getAbsoluteUrl(user.cover),
    coverPhoto: getAbsoluteUrl(user.coverPhoto)
  }));
});

const googleCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Google authentication failed');
  }

  try {
    const { acceptPendingInvitationsForEmail } = require('../services/invitationService');
    await acceptPendingInvitationsForEmail(req.user.email, req.user);
  } catch (err) {
    console.error("Failed to auto-accept invitations during Google login:", err);
  }

  const token = generateToken(req.user._id);

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/workspaces`);
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email.toLowerCase();

  const Workspace = require('../models/Workspace');
  const Task = require('../models/Task');
  const Comment = require('../models/Comment');
  const Invitation = require('../models/Invitation');

  const ownedWorkspaces = await Workspace.find({ owner: userId });
  const ownedWorkspaceIds = ownedWorkspaces.map(w => w._id);

  if (ownedWorkspaceIds.length > 0) {
    const taskIds = (await Task.find({ workspaceId: { $in: ownedWorkspaceIds } }).select('_id')).map(t => t._id);
    if (taskIds.length > 0) {
      await Comment.deleteMany({ taskId: { $in: taskIds } });
      await Task.deleteMany({ _id: { $in: taskIds } });
    }
    await Invitation.deleteMany({ workspaceId: { $in: ownedWorkspaceIds } });
    await Workspace.deleteMany({ _id: { $in: ownedWorkspaceIds } });
  }

  // Remove user from workspace members
  await Workspace.updateMany(
    { members: userId },
    { $pull: { members: userId } }
  );

  // Unassign user from tasks in other workspaces
  await Task.updateMany({ assignee: userId }, { $set: { assignee: null } });
  await Task.updateMany({ reporter: userId }, { $set: { reporter: null } });

  // Delete comments authored by this user
  await Comment.deleteMany({ userId: userId });

  // Remove invitations assigned to the user
  await Invitation.deleteMany({ email: userEmail });

  // Delete the user record
  await User.findByIdAndDelete(userId);

  res.clearCookie('token');

  return res.json(new ApiResponse(200, null, "Account deleted successfully"));
});

module.exports = {
  signup,
  verifyEmail: verifyEmailController,
  login,
  logout,
  forgotPassword,
  resetPassword: resetPasswordController,
  getMe,
  googleCallback,
  deleteAccount
};
