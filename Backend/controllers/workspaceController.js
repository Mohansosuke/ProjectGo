const { getUserWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = require('../services/workspaceService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await getUserWorkspaces(req.user._id);
  const formatted = workspaces.map(w => {
    const isOwner = w.owner._id.toString() === req.user._id.toString();
    const memberRoleObj = w.memberRoles?.find(mr => mr.user.toString() === req.user._id.toString());
    const userRole = isOwner ? 'Admin' : (memberRoleObj ? memberRoleObj.role : 'Member');
    return {
      id: w._id,
      name: w.name,
      subdomain: w.subdomain,
      ownerId: w.owner._id,
      members: w.members,
      memberRoles: w.memberRoles || [],
      userRole: userRole
    };
  });

  return res.json(new ApiResponse(200, formatted));
});

const createWorkspaceController = asyncHandler(async (req, res) => {
  const { name, subdomain } = req.body;
  const workspace = await createWorkspace(name, subdomain, req.user._id);

  return res.status(201).json(new ApiResponse(201, {
    id: workspace._id,
    name: workspace.name,
    subdomain: workspace.subdomain,
    ownerId: req.user._id,
    members: workspace.members,
    memberRoles: workspace.memberRoles || [],
    userRole: 'Admin'
  }, "Workspace created successfully"));
});

const updateWorkspaceController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, subdomain } = req.body;
  const workspace = await updateWorkspace(id, { name, subdomain }, req.user._id);

  return res.json(new ApiResponse(200, {
    id: workspace._id,
    name: workspace.name,
    subdomain: workspace.subdomain,
    ownerId: workspace.owner,
    members: workspace.members
  }, "Workspace updated successfully"));
});

const deleteWorkspaceController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteWorkspace(id, req.user._id);

  return res.json(new ApiResponse(200, null, "Workspace deleted successfully"));
});

module.exports = {
  getWorkspaces,
  createWorkspace: createWorkspaceController,
  updateWorkspace: updateWorkspaceController,
  deleteWorkspace: deleteWorkspaceController
};
