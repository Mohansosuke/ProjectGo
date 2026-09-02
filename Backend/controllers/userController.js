const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Pass through base64 data URIs and external URLs as-is;
// only prepend SERVER_URL for relative /uploads paths (legacy data).
const getAbsoluteUrl = (pathStr) => {
  if (!pathStr) return '';
  if (
    pathStr.startsWith('data:') ||
    pathStr.startsWith('http://') ||
    pathStr.startsWith('https://')
  ) {
    return pathStr;
  }
  // Legacy: relative file path stored before this fix
  return `${process.env.SERVER_URL || 'http://localhost:5000'}${pathStr}`;
};

const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, avatar, nickname, cover } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name !== undefined) user.fullName = name;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (nickname !== undefined) user.nickname = nickname;

  // Store images directly as base64 (or external URL) — no disk writes
  if (avatar !== undefined) user.photoURL = avatar || '';
  if (cover !== undefined) {
    user.cover = cover || '';
    user.coverPhoto = cover || '';
  }

  await user.save();

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
  }, "Profile updated successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
  const users = await User.find({}).select('fullName email photoURL bio lastSeen');
  const now = Date.now();
  const formatted = users.map(u => {
    const isOnline = u.lastSeen && (now - new Date(u.lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
    return {
      id: u._id,
      name: u.fullName,
      email: u.email,
      avatar: getAbsoluteUrl(u.photoURL),
      isOnline: !!isOnline,
      status: isOnline ? 'Online' : 'Offline',
      lastSeen: u.lastSeen,
      bio: u.bio || ''
    };
  });

  return res.json(new ApiResponse(200, formatted));
});

module.exports = {
  updateProfile,
  getAllUsers
};
