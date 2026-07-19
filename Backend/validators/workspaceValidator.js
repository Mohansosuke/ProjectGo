const { body } = require('express-validator');

const workspaceCreateValidator = [
  body('name').trim().notEmpty().withMessage('Workspace name is required')
];

module.exports = {
  workspaceCreateValidator
};
