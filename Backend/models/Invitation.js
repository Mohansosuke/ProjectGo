const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'cancelled', 'expired'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['Admin', 'Member', 'Viewer'],
    default: 'Member'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invitation', invitationSchema);
