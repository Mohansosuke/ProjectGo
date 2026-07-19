const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
} = require('../controllers/workspaceController');
const { getWorkspaceInvitations } = require('../controllers/invitationController');
const { verifyJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { workspaceCreateValidator } = require('../validators/workspaceValidator');

router.get('/', verifyJWT, getWorkspaces);
router.post('/', verifyJWT, workspaceCreateValidator, validate, createWorkspace);
router.put('/:id', verifyJWT, updateWorkspace);
router.delete('/:id', verifyJWT, deleteWorkspace);
router.get('/:workspaceId/invitations', verifyJWT, getWorkspaceInvitations);

module.exports = router;
