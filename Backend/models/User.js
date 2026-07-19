const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local' || !this.provider;
    }
  },
  photoURL: {
    type: String,
    default: ''
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpiry: Date,
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  nickname: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  workspaceId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
