const { body } = require('express-validator');

const inviteValidator = [
  body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail()
];

const acceptInviteValidator = [
  body('token').notEmpty().withMessage('Invitation token is required')
];

module.exports = {
  inviteValidator,
  acceptInviteValidator
};
