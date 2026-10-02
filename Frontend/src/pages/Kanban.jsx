import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MoreHorizontal, Calendar, Grid,
  List as ListIcon, ChevronDown, Compass, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, Zap, AlertTriangle, Users, BarChart2, X, Check
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, Modal, Dropdown, Tabs, Input } from '../components/ui';
import { TASK_PRIORITY_MAP, TASK_LABELS } from '../lib/constants';
import apiClient from '../services/apiClient';
import TaskView from './TaskView';

/* ── Colour palette per column position ───────────────────── */
const COLUMN_THEMES = [
  { dot: 'bg-slate-400', header: 'bg-slate-50 border-slate-200', pill: 'bg-slate-100 text-slate-600', accent: '#94a3b8' },
  { dot: 'bg-blue-500', header: 'bg-blue-50 border-blue-200', pill: 'bg-blue-100 text-blue-700', accent: '#3b82f6' },
  { dot: 'bg-violet-500', header: 'bg-violet-50 border-violet-200', pill: 'bg-violet-100 text-violet-700', accent: '#8b5cf6' },
  { dot: 'bg-amber-500', header: 'bg-amber-50 border-amber-200', pill: 'bg-amber-100 text-amber-700', accent: '#f59e0b' },
  { dot: 'bg-emerald-500', header: 'bg-emerald-50 border-emerald-200', pill: 'bg-emerald-100 text-emerald-700', accent: '#10b981' },
  { dot: 'bg-rose-500', header: 'bg-rose-50 border-rose-200', pill: 'bg-rose-100 text-rose-700', accent: '#f43f5e' },
];

const PRIORITY_STYLE = {
  Critical: 'bg-red-50 text-red-600 border border-red-100',
  CRITICAL: 'bg-red-50 text-red-600 border border-red-100',
  Urgent: 'bg-red-50 text-red-600 border border-red-100',
  High: 'bg-orange-50 text-orange-600 border border-orange-100',
  HIGH: 'bg-orange-50 text-orange-600 border border-orange-100',
  Medium: 'bg-blue-50 text-blue-600 border border-blue-100',
  MEDIUM: 'bg-blue-50 text-blue-600 border border-blue-100',
  Low: 'bg-gray-100 text-gray-500 border border-gray-200',
  LOW: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const PRIORITY_DOT = {
  Critical: 'bg-red-500',
  CRITICAL: 'bg-red-500',
  Urgent: 'bg-red-500',
  High: 'bg-orange-500',
  HIGH: 'bg-orange-500',
  Medium: 'bg-blue-500',
  MEDIUM: 'bg-blue-500',
  Low: 'bg-gray-400',
  LOW: 'bg-gray-400',
};

const PRIORITY_PIPE = {
  Critical: 'bg-red-500',
  CRITICAL: 'bg-red-500',
  Urgent: 'bg-red-500',
  High: 'bg-orange-500',
  HIGH: 'bg-orange-500',
  Medium: 'bg-blue-500',
  MEDIUM: 'bg-blue-500',
  Low: 'bg-gray-400',
  LOW: 'bg-gray-400',
};

const PRIORITY_LIGHT = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  Urgent: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  Low: 'bg-gray-100 text-gray-600 border-gray-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
};

const memberAvatars = {
  u1: 'https://i.pravatar.cc/80?img=12',
  u2: 'https://i.pravatar.cc/80?img=47',
  u3: 'https://i.pravatar.cc/80?img=15',
};

export default function Kanban() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { tasks, moveTask, addTask, columns, addColumn, updateColumn, deleteColumn } = useTask();
  const { users, currentUser } = useAuth();
  const { activeWorkspace, globalSearchQuery } = useWorkspace();

  const [members, setMembers] = useState([]);
  const [filterOnlyMine, setFilterOnlyMine] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState('board');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalColumnId, setTaskModalColumnId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  // Teammate Invitation Modal state
  const [isInvitePopupOpen, setIsInvitePopupOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const userRole = activeWorkspace?.userRole || 'Member';
  const isViewer = userRole === 'Viewer';

  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId) return;
      try {
        const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
        setMembers(res.data);
      } catch (err) {
        console.error("Error loading workspace members in Kanban:", err);
      }
    };
    fetchMembers();
  }, [workspaceId]);

  const getUser = (id) => users.find(u => u.id === id) || { name: 'Unassigned', avatar: `https://i.pravatar.cc/80?u=${id}` };

  const filteredTasks = tasks.filter(t => {
    const taskWsId = String(t.workspaceId?._id || t.workspaceId || t.workspace?._id || t.workspace || '');
    const currentWsId = String(workspaceId || '');
    const inWs = taskWsId === currentWsId;
    const query = globalSearchQuery || filterQuery;
    const inSearch = (t.title || '').toLowerCase().includes(query.toLowerCase());
    const inMine = filterOnlyMine ? t.assignee === currentUser?.id : true;
    const inPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return inWs && inSearch && inMine && inPriority;
  });

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (isViewer) return;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moveTask(draggableId, destination.droppableId);
  };

  const openAddTask = (colId) => {
    if (isViewer) return;
    setTaskModalColumnId(colId);
    setTaskName(''); setTaskDesc(''); setTaskPriority('Medium'); setTaskDue('');
    setTaskAssignee(currentUser?.id || 'u1');
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (isViewer) return;
    if (!taskName.trim()) return;
    addTask({
      title: taskName,
      description: taskDesc ? taskDesc.trim() : '',
      status: taskModalColumnId,
      priority: taskPriority,
      assignee: taskAssignee,
      reporter: currentUser?.id || 'u1',
      points: 3,
      dueDate: taskDue ? (typeof taskDue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(taskDue) ? taskDue.slice(0, 10) : new Date(taskDue).toISOString().split('T')[0]) : '',
      labels: [],
    });
    setIsTaskModalOpen(false);
  };

  const saveColumn = () => {
    if (isViewer) return;
    if (newColName.trim()) addColumn(newColName.trim());
    setNewColName(''); setIsAddingCol(false);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await apiClient.post('/invitations', {
        workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setInviteSuccess('Invitation sent successfully!');
      setInviteEmail('');
      try {
        const res = await apiClient.get(`/invitations/workspace/${workspaceId}`);
        setMembers(res.data);
      } catch (e) { }
      setTimeout(() => {
        setIsInvitePopupOpen(false);
        setInviteSuccess('');
      }, 1500);
    } catch (err) {
      setInviteError(err.response?.data?.message || err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const renderTaskCardContent = (task, isDragging = false) => {
    if (!task) return null;
    const pStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Low;
    const pDot = PRIORITY_DOT[task.priority] || 'bg-slate-300';
    const assignee = getUser(task.assignee);
    const labelCfg = task.labels?.[0] ? TASK_LABELS[task.labels[0]] : null;

    return (
      <div
        className={`bg-white border rounded-xl p-3.5 select-none transition-shadow ${isDragging
          ? 'shadow-2xl ring-2 ring-indigo-500 border-indigo-500 bg-white cursor-grabbing'
          : 'border-gray-200 shadow-xs hover:border-indigo-300 hover:shadow-md cursor-grab active:cursor-grabbing'
          }`}
      >
        {/* Label chip */}
        {labelCfg && (
          <span className={`inline-flex items-center text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider mb-1.5 ${labelCfg.bgClass}`}>
            {labelCfg.label}
          </span>
        )}

        {/* Title */}
        <p className="text-sm font-medium text-gray-800 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
          {task.title}
        </p>

        {/* Description preview */}
        {task.description && task.description !== 'No description provided.' && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80">
          <div className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${pStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pDot}`} />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-medium">
                <Clock className="w-2.5 h-2.5" />
                {task.dueDate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {task.points && (
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-black border border-slate-200">
                {task.points}
              </span>
            )}
            <img
              src={assignee.avatar || `https://i.pravatar.cc/40?u=${task.assignee}`}
              alt=""
              className="w-5 h-5 rounded-full border border-white shadow-xs object-cover"
            />
          </div>
        </div>
      </div>
    );
  };

  /* ── sprint stats strip ───────────────────────────────────── */
  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const inProg = filteredTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgent = filteredTasks.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const velocity = total > 0 ? Math.round((completed / total) * 100) : 0;

  const viewTabs = [
    { id: 'board', label: 'Board', icon: Grid },
    { id: 'list', label: 'List', icon: ListIcon },
    { id: 'gantt', label: 'Gantt', icon: Compass },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* ── Sprint Stats Banner ─────────────────────────────── */}
      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            {activeWorkspace?.name || 'Sprint Board'}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ Board View</span>
        </div>

        <div className="flex items-center gap-2">
          {[
            { icon: BarChart2, label: `${velocity}%`, sub: 'velocity', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { icon: CheckCircle2, label: completed, sub: 'done', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { icon: Zap, label: inProg, sub: 'in progress', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { icon: AlertTriangle, label: urgent, sub: 'urgent', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-1.5 bg-white border ${s.border} rounded-xl px-3 py-1.5 shadow-xs`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-sm font-bold text-gray-800">{s.label}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs + Filter Bar ───────────────────────────────── */}
      <div className="shrink-0 px-4">
        <Tabs tabs={viewTabs} activeTab={activeSubTab} onChange={setActiveSubTab} />
      </div>

      <div className="shrink-0 px-5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mine filter */}
          <button
            onClick={() => setFilterOnlyMine(!filterOnlyMine)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${filterOnlyMine
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
          >
            <Users className="w-3.5 h-3.5" /> My Tasks
          </button>

          {/* Priority filter chips */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 gap-0.5">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${priorityFilter === p
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-white'
                  }`}
              >
                {p !== 'All' && <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[p]}`} />}
                {p}
              </button>
            ))}
          </div>

          {/* Member avatars list */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterOnlyMine(prev => !prev)}
                title={`${m.name} (${m.role})`}
                className="w-7 h-7 rounded-lg border-2 border-white overflow-hidden hover:scale-110 transition-transform cursor-pointer shadow-xs"
              >
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              </button>
            ))}

            {/* Add Team Member + Icon */}
            {!isViewer && (
              <button
                onClick={() => {
                  setInviteEmail('');
                  setInviteError('');
                  setInviteSuccess('');
                  setIsInvitePopupOpen(true);
                }}
                title="Invite Team Member"
                className="w-7 h-7 rounded-lg border-2 border-white bg-slate-100 hover:bg-slate-200 flex items-center justify-center hover:scale-110 transition-all cursor-pointer shadow-xs text-slate-650"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* ── View Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeSubTab === 'board' && (
          <div className="h-full overflow-x-auto overflow-y-hidden px-4 py-3 select-none">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-3 h-full min-w-max items-start">
                {columns.map((col, colIdx) => {
                  const theme = COLUMN_THEMES[colIdx % COLUMN_THEMES.length];
                  const colTasks = filteredTasks.filter(t => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="w-72 flex flex-col bg-white border border-gray-200 rounded-2xl flex-shrink-0 h-full overflow-hidden shadow-card"
                    >
                      {/* Column header */}
                      <div className={`shrink-0 border-b ${theme.header} px-3 py-2.5 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
                          <span className="text-xs font-semibold text-gray-800">{col.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${theme.pill}`}>
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {!isViewer && (
                            <button
                              onClick={() => openAddTask(col.id)}
                              className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isViewer && (
                            <Dropdown
                              trigger={
                                <button className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              }
                              align="right"
                            >
                              <Dropdown.Item onClick={() => {
                                const n = prompt('Rename stage:', col.title);
                                if (n?.trim()) updateColumn(col.id, n.trim());
                              }}>
                                Rename Stage
                              </Dropdown.Item>
                              <Dropdown.Item danger onClick={() => {
                                if (confirm(`Delete "${col.title}"? All tasks will be removed.`)) deleteColumn(col.id);
                              }}>
                                Delete Stage
                              </Dropdown.Item>
                            </Dropdown>
                          )}
                        </div>
                      </div>

                      {/* Column progress micro-bar */}
                      <div className="h-0.5 bg-slate-100">
                        <div
                          className={`h-full ${theme.dot} transition-all duration-700`}
                          style={{ width: filteredTasks.length > 0 ? `${Math.round((colTasks.length / filteredTasks.length) * 100)}%` : '0%' }}
                        />
                      </div>

                      {/* Cards */}
                      <div className="flex-1 overflow-y-auto p-2.5 pb-16 space-y-2">
                        <Droppable
                          droppableId={col.id}
                          renderClone={(provided, snapshot, rubric) => {
                            const task = colTasks[rubric.source.index];
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className="outline-none"
                              >
                                {renderTaskCardContent(task, true)}
                              </div>
                            );
                          }}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex flex-col gap-2 min-h-[130px] rounded-xl p-1 transition-colors duration-150 ${snapshot.isDraggingOver
                                ? 'bg-indigo-50/70 ring-2 ring-indigo-400/40 ring-dashed border-indigo-200'
                                : 'border-transparent'
                                }`}
                            >
                              {colTasks.map((task, idx) => (
                                <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={isViewer}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={provided.draggableProps.style}
                                      onClick={() => navigate(`/workspace/${workspaceId}/task/${task.id}`)}
                                      className="outline-none"
                                    >
                                      {renderTaskCardContent(task, snapshot.isDragging)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {colTasks.length === 0 && !snapshot.isDraggingOver && !isViewer && (
                                <div
                                  onClick={() => openAddTask(col.id)}
                                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-center min-h-[80px] group"
                                >
                                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 mb-1 transition-colors" />
                                  <span className="text-xs text-gray-400 group-hover:text-indigo-600 font-medium transition-colors">Add task</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>

                      {/* Add task inline button at bottom */}
                      {!isViewer && (
                        <div className="shrink-0 px-2.5 pb-2.5">
                          <button
                            onClick={() => openAddTask(col.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer border border-dashed border-transparent hover:border-indigo-200"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add task
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add column */}
                {!isViewer && (
                  isAddingCol ? (
                    <div className="w-64 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 shrink-0 shadow-sm">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Stage name…"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveColumn(); if (e.key === 'Escape') setIsAddingCol(false); }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5f35f5]"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveColumn} className="flex-1 px-3 py-1.5 bg-[#5f35f5] text-white rounded-lg text-[10px] font-bold hover:bg-[#4c1d95] transition-colors cursor-pointer">Save</button>
                        <button onClick={() => setIsAddingCol(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsAddingCol(true)}
                      className="w-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#5f35f5]/50 hover:bg-[#5f35f5]/3 transition-all min-h-[120px] shrink-0 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#5f35f5]/10 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#5f35f5] transition-colors" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#5f35f5] transition-colors">New Stage</span>
                    </div>
                  )
                )}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* ════ LIST VIEW ════ */}
        {activeSubTab === 'list' && (
          <div className="h-full overflow-y-auto px-4 py-3 space-y-3">
            {columns.map((col, colIdx) => {
              const theme = COLUMN_THEMES[colIdx % COLUMN_THEMES.length];
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${theme.header}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{col.title}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${theme.pill}`}>{colTasks.length}</span>
                    </div>
                    <button onClick={() => openAddTask(col.id)} className="text-[10px] font-bold text-[#5f35f5] hover:underline cursor-pointer flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Task
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {colTasks.map(task => {
                      const pDot = PRIORITY_DOT[task.priority] || 'bg-slate-300';
                      const assignee = getUser(task.assignee);
                      return (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/workspace/${workspaceId}/task/${task.id}`)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 cursor-pointer group transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pDot}`} />
                          <span className="flex-1 text-xs font-semibold text-slate-800 group-hover:text-[#5f35f5] transition-colors truncate">{task.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {task.dueDate && <span className="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium"><Clock className="w-2.5 h-2.5" />{task.dueDate}</span>}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[task.priority] || 'bg-slate-100 text-slate-500'}`}>{task.priority}</span>
                            <img src={assignee.avatar || memberAvatars.u1} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="px-4 py-3 text-[11px] text-slate-400 italic">No tasks in this stage.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ GANTT VIEW ════ */}
        {activeSubTab === 'gantt' && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-black text-slate-800">Sprint Timeline</span>
                <span className="text-[10px] text-slate-400 font-semibold">Gantt · Weeks 1–4</span>
              </div>
              {/* Week headers */}
              <div className="flex px-5 pt-3 pb-1 gap-2">
                <div className="w-36 shrink-0" />
                {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => (
                  <div key={w} className="flex-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center">{w}</div>
                ))}
              </div>
              <div className="px-5 pb-4 space-y-2">
                {filteredTasks.map((task, idx) => {
                  const pDot = PRIORITY_DOT[task.priority] || 'bg-slate-300';
                  const left = (idx * 7) % 40;
                  const width = 20 + (idx * 13) % 45;
                  const colors = ['bg-[#5f35f5]', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                  const barColor = colors[idx % colors.length];
                  return (
                    <div key={task.id} className="flex items-center gap-2 group">
                      <div className="w-36 shrink-0 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${pDot} shrink-0`} />
                        <span className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-[#5f35f5] transition-colors">{task.title}</span>
                      </div>
                      <div className="flex-1 bg-slate-100 h-5 rounded-lg overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className={`absolute h-full ${barColor} rounded-lg flex items-center px-2`}
                          style={{ left: `${left}%` }}
                        >
                          <span className="text-[8px] text-white font-extrabold truncate">{task.priority}</span>
                        </motion.div>
                      </div>
                      <span className="text-[9px] text-slate-400 w-12 text-right font-medium">{task.dueDate || '—'}</span>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">No tasks to display.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ CALENDAR VIEW ════ */}
        {activeSubTab === 'calendar' && (() => {
          const now = new Date();
          const calYear = calendarDate.getFullYear();
          const calMonth = calendarDate.getMonth();
          const firstDay = new Date(calYear, calMonth, 1).getDay();
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

          const normalizeDate = (val) => {
            if (!val) return null;
            if (typeof val === 'string') {
              const trimmed = val.trim();
              if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
                return trimmed.slice(0, 10);
              }

              // Handle short dates like "Oct 3" or "Oct 03" or "Oct 3, 2026"
              const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
              const shortMatch = trimmed.match(/^([a-zA-Z]{3})\s+(\d{1,2})(?:,\s*(\d{4}))?/);
              if (shortMatch) {
                const mStr = shortMatch[1].toLowerCase();
                if (monthMap[mStr]) {
                  const m = monthMap[mStr];
                  const d = String(shortMatch[2]).padStart(2, '0');
                  const y = shortMatch[3] || calendarDate.getFullYear();
                  return `${y}-${m}-${d}`;
                }
              }

              try {
                const parsed = new Date(trimmed);
                if (!isNaN(parsed.getTime())) {
                  let y = parsed.getFullYear();
                  if (y < 2000) y = calendarDate.getFullYear();
                  const m = String(parsed.getMonth() + 1).padStart(2, '0');
                  const d = String(parsed.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                }
              } catch { }
            }
            try {
              const d = new Date(val);
              if (!isNaN(d.getTime())) {
                let y = d.getFullYear();
                if (y < 2000) y = calendarDate.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              }
            } catch { }
            return null;
          };

          // Workspace tasks matching active month
          const monthTasksCount = filteredTasks.filter(t => {
            const rawStart = t.startDate || t.fromDate || t.createdAt || t.dueDate || t.toDate;
            const rawDue = t.dueDate || t.toDate || t.startDate || t.fromDate || t.createdAt;
            const d = normalizeDate(rawDue) || normalizeDate(rawStart);
            return d && d.startsWith(monthStr);
          }).length;

          return (
            <div className="h-full overflow-y-auto px-4 py-3">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Header with Navigation Controls */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-slate-800">
                      {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                      <button
                        onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCalendarDate(new Date())}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {monthTasksCount} {monthTasksCount === 1 ? 'task' : 'tasks'} in {calendarDate.toLocaleString('default', { month: 'short' })}
                  </span>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50">{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {Array(firstDay).fill(null).map((_, i) => (
                    <div key={`e${i}`} className="min-h-[100px] border-b border-r border-slate-50 bg-slate-50/30" />
                  ))}
                  {Array(daysInMonth).fill(null).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;

                    // Calculate day tasks and sort by duration
                    const dayTasksWithMeta = filteredTasks
                      .map(t => {
                        const rawStart = t.startDate || t.fromDate || t.createdAt || t.dueDate || t.toDate;
                        const rawDue = t.dueDate || t.toDate || t.startDate || t.fromDate || t.createdAt;

                        const start = normalizeDate(rawStart);
                        const due = normalizeDate(rawDue);
                        if (!start && !due) return null;

                        const s = start || due;
                        const e = due || start;

                        if (dateStr >= s && dateStr <= e) {
                          const sDate = new Date(s);
                          const eDate = new Date(e);
                          const dur = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                          return {
                            task: t,
                            start: s,
                            due: e,
                            duration: dur,
                            isStart: dateStr === s,
                            isEnd: dateStr === e,
                            isMiddle: dateStr > s && dateStr < e
                          };
                        }
                        return null;
                      })
                      .filter(Boolean)
                      .sort((a, b) => {
                        const aStart = new Date(a.start || 0).getTime();
                        const bStart = new Date(b.start || 0).getTime();
                        if (aStart !== bStart) return aStart - bStart;
                        return (a.task?.id || '').localeCompare(b.task?.id || '');
                      });

                    return (
                      <div
                        key={day}
                        className={`min-h-[100px] py-1 px-0 border-b border-r border-slate-100 flex flex-col justify-between transition-colors overflow-visible group relative ${isToday ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
                          }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1 px-2">
                            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#5f35f5] text-white shadow-xs' : 'text-slate-600'
                              }`}>
                              {day}
                            </span>
                            {!isViewer && (
                              <button
                                onClick={() => {
                                  setTaskDue(dateStr);
                                  setTaskName('');
                                  setTaskDesc('');
                                  setTaskPriority('Medium');
                                  setTaskAssignee(currentUser?.id || 'u1');
                                  setIsTaskModalOpen(true);
                                }}
                                className="w-4 h-4 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                                title="Add task on this date"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5 w-full overflow-visible">
                            {dayTasksWithMeta.slice(0, 3).map(({ task: t, isStart, isEnd, isMiddle }) => {
                              const pDot = PRIORITY_DOT[t.priority] || 'bg-indigo-500';
                              const pPipe = PRIORITY_PIPE[t.priority] || 'bg-indigo-500';
                              const pLight = PRIORITY_LIGHT[t.priority] || 'bg-indigo-50 text-indigo-800 border-indigo-200';
                              const assignee = getUser(t.assignee);
                              const isSingle = isStart && isEnd;
                              // Show title ONLY on created date (isStart or isSingle), not on next rows
                              const showTitle = isStart || isSingle;

                              return (
                                <div
                                  key={t.id}
                                  onClick={() => setSelectedTask(t)}
                                  className="group/bar relative flex items-center w-full h-5 my-0.5 cursor-pointer select-none"
                                  title={`${t.title} (${t.priority})`}
                                >
                                  {showTitle ? (
                                    <>
                                      {/* Left line cap */}
                                      <div className={`h-[3px] ${pPipe} w-2 rounded-l-full shrink-0`} />

                                      {/* Embedded modern task name pill on created date only */}
                                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-2xs border shrink-0 mx-0.5 transition-transform group-hover/bar:scale-[1.03] ${pLight}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${pDot} shrink-0`} />
                                        <span className="truncate max-w-[75px] leading-none">{t.title}</span>
                                        <img
                                          src={assignee.avatar || memberAvatars.u1 || `https://i.pravatar.cc/40?u=${t.assignee}`}
                                          alt=""
                                          title={assignee.name || 'Assignee'}
                                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-white"
                                        />
                                      </div>

                                      {/* Right line extension (continues to next cell unless end of task or single day) */}
                                      <div className={`h-[3px] flex-1 ${pPipe} ${isSingle ? 'rounded-r-full mr-1.5' : '-mr-[1px]'}`} />
                                    </>
                                  ) : (
                                    /* Continuation line spanning across middle and end cells with zero gap */
                                    <div className={`h-[3px] w-full ${pPipe} ${isEnd ? 'rounded-r-full mr-1.5 -ml-[1px]' : '-mx-[1px]'}`} />
                                  )}
                                </div>
                              );
                            })}
                            {dayTasksWithMeta.length > 3 && (
                              <div className="text-[8px] text-slate-400 font-extrabold px-1 pt-0.5">
                                +{dayTasksWithMeta.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Add Task Modal ──────────────────────────────────── */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create Task">
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Task Name *</label>
            <input
              autoFocus required
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5f35f5] focus:ring-2 focus:ring-[#5f35f5]/15 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Add more details…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5f35f5] focus:ring-2 focus:ring-[#5f35f5]/15 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#5f35f5] transition-all">
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#5f35f5] transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Assignee</label>
            <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#5f35f5] transition-all">
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#5f35f5] hover:bg-[#4c1d95] text-white">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Popup Modal */}
      <AnimatePresence>
        {isInvitePopupOpen && (
          <Modal
            isOpen={isInvitePopupOpen}
            onClose={() => setIsInvitePopupOpen(false)}
            title="Invite Member to Workspace"
          >
            <form onSubmit={handleInviteMember} className="space-y-4 pt-2">
              {inviteError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                  {inviteSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Teammate Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assign Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none font-semibold"
                >
                  <option value="Member">Member (Can edit tasks)</option>
                  <option value="Admin">Admin (Full Workspace control)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsInvitePopupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isInviting}
                  className="bg-[#5f35f5] hover:bg-[#4c1d95] text-white font-bold"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Floating Task View Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskView
            isModal
            workspaceId={workspaceId}
            taskId={selectedTask.id || selectedTask._id}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
