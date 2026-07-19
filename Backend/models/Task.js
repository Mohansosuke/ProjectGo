const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'TODO'
  },
  priority: {
    type: String,
    default: 'Medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  points: {
    type: Number,
    default: 0
  },
  labels: {
    type: [String],
    default: []
  },
  subtasks: [{
    id: String,
    title: String,
    done: {
      type: Boolean,
      default: false
    }
  }],
  checklist: [{
    id: String,
    text: String,
    done: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    id: String,
    name: String,
    type: String,
    size: String,
    data: String,
    uploadedAt: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
