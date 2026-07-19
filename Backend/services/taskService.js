const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

const checkWorkspacePermission = async (workspaceId, userId, action = 'view') => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }
  const isOwner = workspace.owner.toString() === userId.toString();
  const isMember = workspace.members.some(m => m.toString() === userId.toString());
  if (!isOwner && !isMember) {
    throw new ApiError(403, 'Forbidden: You do not have access to this workspace');
  }

  if (action === 'edit') {
    const memberRoleObj = workspace.memberRoles?.find(mr => mr.user.toString() === userId.toString());
    const role = isOwner ? 'Admin' : (memberRoleObj ? memberRoleObj.role : 'Member');
    if (role === 'Viewer') {
      throw new ApiError(403, 'Forbidden: Viewers have read-only access and cannot modify tasks');
    }
  }
};

const getWorkspaceTasks = async (workspaceId, userId) => {
  await checkWorkspacePermission(workspaceId, userId, 'view');
  return await Task.find({ workspaceId })
    .populate('assignee', 'fullName email photoURL')
    .populate('reporter', 'fullName email photoURL');
};

const createTask = async (taskData, userId) => {
  await checkWorkspacePermission(taskData.workspaceId, userId, 'edit');
  
  const task = await Task.create({
    ...taskData,
    reporter: userId,
    subtasks: [],
    checklist: [],
    attachments: []
  });

  return await Task.findById(task._id)
    .populate('assignee', 'fullName email photoURL')
    .populate('reporter', 'fullName email photoURL');
};

const updateTask = async (taskId, updates, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await checkWorkspacePermission(task.workspaceId, userId, 'edit');

  const allowedUpdates = [
    'title', 'description', 'status', 'priority', 'dueDate',
    'points', 'labels', 'assignee', 'subtasks', 'checklist', 'attachments'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      if (field === 'dueDate') {
        task[field] = updates[field] ? new Date(updates[field]) : null;
      } else {
        task[field] = updates[field];
      }
    }
  });

  await task.save();

  return await Task.findById(taskId)
    .populate('assignee', 'fullName email photoURL')
    .populate('reporter', 'fullName email photoURL');
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await checkWorkspacePermission(task.workspaceId, userId, 'edit');

  await Task.findByIdAndDelete(taskId);
  await Comment.deleteMany({ taskId });

  return true;
};

module.exports = {
  getWorkspaceTasks,
  createTask,
  updateTask,
  deleteTask
};
