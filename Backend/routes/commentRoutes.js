const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { verifyJWT } = require('../middleware/authMiddleware');

router.get('/', verifyJWT, getComments);
router.post('/', verifyJWT, createComment);

router.get('/:taskId', verifyJWT, getComments);
router.post('/:taskId', verifyJWT, createComment);

router.put('/:id', verifyJWT, updateComment);
router.delete('/:id', verifyJWT, deleteComment);

module.exports = router;
