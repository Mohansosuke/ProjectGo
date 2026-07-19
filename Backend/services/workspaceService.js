const Workspace = require('../models/Workspace');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

const getUserWorkspaces = async (userId) => {
  return await Workspace.find({
    $or: [
      { owner: userId },
      { members: userId }
    ]
  }).populate('owner', 'fullName email photoURL');
};

const createWorkspace = async (name, subdomain, ownerId) => {
  return await Workspace.create({
    name,
    subdomain: subdomain || '',
    owner: ownerId,
    members: [ownerId],
    memberRoles: [{ user: ownerId, role: 'Admin' }]
  });
};

const updateWorkspace = async (workspaceId, updates, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const isOwner = workspace.owner.toString() === userId.toString();
  const memberRoleObj = workspace.memberRoles?.find(mr => mr.user.toString() === userId.toString());
  const role = isOwner ? 'Admin' : (memberRoleObj ? memberRoleObj.role : 'Member');

  if (role !== 'Admin') {
    throw new ApiError(403, 'Forbidden: Only workspace owners and admins can edit workspace settings');
  }

  if (updates.name) workspace.name = updates.name;
  if (updates.subdomain !== undefined) workspace.subdomain = updates.subdomain;

  return await workspace.save();
};

const deleteWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (workspace.owner.toString() !== userId.toString()) {
    throw new ApiError(403, 'Forbidden: Only the workspace owner can delete it');
  }

  await Workspace.findByIdAndDelete(workspaceId);
  await Task.deleteMany({ workspaceId });

  return true;
};

module.exports = {
  getUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
};
