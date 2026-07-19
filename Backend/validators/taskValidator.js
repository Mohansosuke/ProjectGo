const { body } = require('express-validator');

const taskCreateValidator = [
  body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
  body('title').trim().notEmpty().withMessage('Task title is required')
];

module.exports = {
  taskCreateValidator
};
