const Workspace = require('../models/Workspace');

const isWorkspaceMember = async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId || req.params.id;

  if (!workspaceId) {
    return res.status(400).json({ message: 'Workspace ID is required' });
  }

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    ) || workspace.owner.toString() === req.user._id.toString();

    if (!isMember) {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this workspace' });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('Workspace membership check error:', error);
    return res.status(500).json({ message: 'Server error checking workspace permissions' });
  }
};

module.exports = { isWorkspaceMember };
