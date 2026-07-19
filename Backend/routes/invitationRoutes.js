const express = require('express');
const router = express.Router();
const {
  sendInvitation,
  getInvitations,
  acceptInvitationPost,
  acceptInvitationGet,
  getWorkspaceMembers,
  cancelInvitation
} = require('../controllers/invitationController');
const { verifyJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { inviteValidator, acceptInviteValidator } = require('../validators/invitationValidator');

router.post('/', verifyJWT, inviteValidator, validate, sendInvitation);
router.get('/', verifyJWT, getInvitations);
router.get('/accept/:token', acceptInvitationGet);
router.post('/accept', verifyJWT, acceptInviteValidator, validate, acceptInvitationPost);
router.get('/workspace/:workspaceId', verifyJWT, getWorkspaceMembers);
router.delete('/:id', verifyJWT, cancelInvitation);

module.exports = router;
