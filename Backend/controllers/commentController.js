const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getComments = asyncHandler(async (req, res) => {
  const taskId = req.query.taskId || req.params.taskId;

  if (!taskId) {
    throw new ApiError(400, 'Task ID is required');
  }

  const comments = await Comment.find({ taskId }).sort({ createdAt: 1 });
  const formatted = comments.map(c => ({
    id: c._id,
    taskId: c.taskId,
    userId: c.userId,
    author: c.authorName,
    avatar: c.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}&background=5f35f5&color=fff&bold=true`,
    text: c.text,
    time: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + new Date(c.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  }));

  return res.json(new ApiResponse(200, formatted));
});

const createComment = asyncHandler(async (req, res) => {
  const taskId = req.body.taskId || req.query.taskId || req.params.taskId;
  const { text } = req.body;

  if (!taskId || !text) {
    throw new ApiError(400, 'Task ID and text are required');
  }

  const comment = await Comment.create({
    taskId,
    userId: req.user._id,
    authorName: req.user.fullName,
    authorAvatar: req.user.photoURL,
    text
  });

  return res.status(201).json(new ApiResponse(201, {
    id: comment._id,
    taskId: comment.taskId,
    userId: comment.userId,
    author: comment.authorName,
    avatar: comment.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=5f35f5&color=fff&bold=true`,
    text: comment.text,
    time: new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  }, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You can only edit your own comments');
  }

  comment.text = text;
  await comment.save();

  return res.json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You can only delete your own comments');
  }

  await Comment.findByIdAndDelete(id);

  return res.json(new ApiResponse(200, null, "Comment deleted successfully"));
});

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
