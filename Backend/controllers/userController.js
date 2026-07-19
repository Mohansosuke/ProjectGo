const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64Str, subfolder = 'profiles') => {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str;
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }

    const type = matches[1];
    const extension = type.split('/')[2] || type.split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const uploadDir = path.join(__dirname, '../uploads', subfolder);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    return `/uploads/${subfolder}/${fileName}`;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    return base64Str;
  }
};

const getAbsoluteUrl = (pathStr) => {
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:')) {
    return pathStr;
  }
  return `http://localhost:5000${pathStr}`;
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
  if (avatar !== undefined) user.photoURL = saveBase64Image(avatar, 'profiles');
  if (nickname !== undefined) user.nickname = nickname;
  if (cover !== undefined) {
    const savedPath = saveBase64Image(cover, 'profiles');
    user.cover = savedPath;
    user.coverPhoto = savedPath;
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
  const users = await User.find({}).select('fullName email photoURL bio');
  const formatted = users.map(u => ({
    id: u._id,
    name: u.fullName,
    email: u.email,
    avatar: getAbsoluteUrl(u.photoURL),
    status: 'Online',
    bio: u.bio || ''
  }));

  return res.json(new ApiResponse(200, formatted));
});

module.exports = {
  updateProfile,
  getAllUsers
};
