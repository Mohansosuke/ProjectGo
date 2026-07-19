const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { verifyJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { taskCreateValidator } = require('../validators/taskValidator');

router.get('/', verifyJWT, getTasks);
router.post('/', verifyJWT, taskCreateValidator, validate, createTask);
router.put('/:id', verifyJWT, updateTask);
router.delete('/:id', verifyJWT, deleteTask);

module.exports = router;
