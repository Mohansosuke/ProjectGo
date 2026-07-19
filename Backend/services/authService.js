const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendResetPasswordEmail } = require('./emailService');

const registerUser = async (fullName, email, password) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

  const parts = fullName.trim().split(/\s+/);
  const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'U')}&background=5f35f5&color=fff&bold=true`;

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    photoURL,
    isVerified: false,
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry
  });

  await sendVerificationEmail(email, verificationToken, fullName);

  return user;
};

const verifyEmail = async (token) => {

  console.log("Searching token:", token);

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: Date.now() }
  });

  console.log("User Found:", user);

  if (!user) {
    throw new ApiError(400, "Verification link is invalid or expired.");
  }

  user.isVerified = true;
  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;

  await user.save();

  console.log("User saved successfully!");

  return user;
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, 'Account not found.');
  }

  if (user.provider === 'google') {
    throw new ApiError(400, 'This account was created using Google. Please continue with Google Sign-In.');
  }

  if (!user.emailVerified && !user.isVerified) {
    throw new ApiError(401, 'Please verify your email before signing in.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  return { user, token };
};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'This email address is not registered.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  await sendResetPasswordEmail(email, resetToken);

  return true;
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or has expired.');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save();

  return true;
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  requestPasswordReset,
  resetPassword
};
