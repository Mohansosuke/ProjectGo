const { getWorkspaceTasks, createTask, updateTask, deleteTask } = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getTasks = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  const tasks = await getWorkspaceTasks(workspaceId, req.user._id);

  const formatted = tasks.map(t => ({
    id: t._id,
    workspaceId: t.workspaceId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ? t.assignee._id : null,
    assigneeUser: t.assignee, 
    reporter: t.reporter ? t.reporter._id : null,
    reporterUser: t.reporter,
    dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
    points: t.points,
    labels: t.labels,
    subtasks: t.subtasks,
    checklist: t.checklist,
    attachments: t.attachments
  }));

  return res.json(new ApiResponse(200, formatted));
});

const createTaskController = asyncHandler(async (req, res) => {
  const task = await createTask(req.body, req.user._id);

  return res.status(201).json(new ApiResponse(201, {
    id: task._id,
    workspaceId: task.workspaceId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee ? task.assignee._id : null,
    assigneeUser: task.assignee,
    reporter: task.reporter ? task.reporter._id : null,
    reporterUser: task.reporter,
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    points: task.points,
    labels: task.labels,
    subtasks: task.subtasks,
    checklist: task.checklist,
    attachments: task.attachments
  }, "Task created successfully"));
});

const updateTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await updateTask(id, req.body, req.user._id);

  return res.json(new ApiResponse(200, {
    id: task._id,
    workspaceId: task.workspaceId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee ? task.assignee._id : null,
    assigneeUser: task.assignee,
    reporter: task.reporter ? task.reporter._id : null,
    reporterUser: task.reporter,
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    points: task.points,
    labels: task.labels,
    subtasks: task.subtasks,
    checklist: task.checklist,
    attachments: task.attachments
  }, "Task updated successfully"));
});

const deleteTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteTask(id, req.user._id);

  return res.json(new ApiResponse(200, null, "Task deleted successfully"));
});

module.exports = {
  getTasks,
  createTask: createTaskController,
  updateTask: updateTaskController,
  deleteTask: deleteTaskController
};
