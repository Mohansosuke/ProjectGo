import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MoreHorizontal, Calendar, Grid,
  List as ListIcon, ChevronDown, Compass, Clock,
  CheckCircle2, Zap, AlertTriangle, Users, BarChart2, X, Check
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button, Modal, Dropdown, Tabs, Input } from '../components/ui';
import { TASK_PRIORITY_MAP, TASK_LABELS } from '../lib/constants';
import apiClient from '../services/apiClient';

/* ── Colour palette per column position ───────────────────── */
const COLUMN_THEMES = [
  { dot: 'bg-slate-400',   header: 'bg-slate-50 border-slate-200',  pill: 'bg-slate-100 text-slate-600',  accent: '#94a3b8' },
  { dot: 'bg-blue-500',    header: 'bg-blue-50 border-blue-200',    pill: 'bg-blue-100 text-blue-700',   accent: '#3b82f6' },
  { dot: 'bg-violet-500',  header: 'bg-violet-50 border-violet-200',pill: 'bg-violet-100 text-violet-700',accent: '#8b5cf6' },
  { dot: 'bg-amber-500',   header: 'bg-amber-50 border-amber-200',  pill: 'bg-amber-100 text-amber-700', accent: '#f59e0b' },
  { dot: 'bg-emerald-500', header: 'bg-emerald-50 border-emerald-200',pill:'bg-emerald-100 text-emerald-700',accent:'#10b981'},
  { dot: 'bg-rose-500',    header: 'bg-rose-50 border-rose-200',    pill: 'bg-rose-100 text-rose-700',   accent: '#f43f5e' },
];

const PRIORITY_STYLE = {
  Critical: 'bg-red-50 text-red-600 border border-red-100',
  High:     'bg-orange-50 text-orange-600 border border-orange-100',
  Medium:   'bg-blue-50 text-blue-600 border border-blue-100',
  Low:      'bg-gray-100 text-gray-500 border border-gray-200',
};
const PRIORITY_DOT = {
  Critical: 'bg-red-500',
  High:     'bg-orange-500',
  Medium:   'bg-blue-500',
  Low:      'bg-gray-400',
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
  const [filterQuery, setFilterQuery]       = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeSubTab, setActiveSubTab]     = useState('board');
  const [isAddingCol, setIsAddingCol]       = useState(false);
  const [newColName, setNewColName]         = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalColumnId, setTaskModalColumnId] = useState('');
  const [taskName, setTaskName]             = useState('');
  const [taskDesc, setTaskDesc]             = useState('');
  const [taskPriority, setTaskPriority]     = useState('Medium');
  const [taskDue, setTaskDue]               = useState('');
  const [taskAssignee, setTaskAssignee]     = useState('');

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
    const inWs      = t.workspaceId === workspaceId;
    const query     = globalSearchQuery || filterQuery;
    const inSearch  = (t.title || '').toLowerCase().includes(query.toLowerCase());
    const inMine    = filterOnlyMine ? t.assignee === currentUser?.id : true;
    const inPriority= priorityFilter === 'All' || t.priority === priorityFilter;
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
      description: taskDesc || 'No description.',
      status: taskModalColumnId,
      priority: taskPriority,
      assignee: taskAssignee,
      reporter: currentUser?.id || 'u1',
      points: 3,
      dueDate: taskDue ? new Date(taskDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      labels: ['FRONTEND'],
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
      } catch (e) {}
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

  /* ── sprint stats strip ───────────────────────────────────── */
  const total     = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const inProg    = filteredTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgent    = filteredTasks.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const velocity  = total > 0 ? Math.round((completed / total) * 100) : 0;

  const viewTabs = [
    { id: 'board',    label: 'Board',    icon: Grid },
    { id: 'list',     label: 'List',     icon: ListIcon },
    { id: 'gantt',    label: 'Gantt',    icon: Compass },
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
            { icon: BarChart2,    label: `${velocity}%`,  sub: 'velocity',     color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { icon: CheckCircle2, label: completed,        sub: 'done',         color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { icon: Zap,          label: inProg,           sub: 'in progress',  color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { icon: AlertTriangle,label: urgent,           sub: 'urgent',       color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
              filterOnlyMine
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  priorityFilter === p
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >

            {/* ════ BOARD VIEW ════ */}
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
                          className="w-72 flex flex-col bg-white border border-gray-200 rounded-2xl flex-shrink-0 h-full overflow-hidden shadow-card backdrop-blur-sm"
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
                              style={{ width: total > 0 ? `${Math.round((colTasks.length / total) * 100)}%` : '0%' }}
                            />
                          </div>

                          {/* Cards */}
                          <div className="flex-1 overflow-y-auto p-2.5 pb-16 space-y-2">
                            <Droppable droppableId={col.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`flex flex-col gap-2 min-h-[120px] rounded-xl transition-all ${
                                    snapshot.isDraggingOver ? 'bg-indigo-500/5 ring-1 ring-indigo-500/20' : ''
                                  }`}
                                >
                                  {colTasks.map((task, idx) => {
                                    const pStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Low;
                                    const pDot   = PRIORITY_DOT[task.priority] || 'bg-slate-300';
                                    const assignee = getUser(task.assignee);
                                    const labelCfg = task.labels?.[0] ? TASK_LABELS[task.labels[0]] : null;
                                    return (
                                      <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={isViewer}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={provided.draggableProps.style}
                                            onClick={() => navigate(`/workspace/${workspaceId}/task/${task.id}`)}
                                            className={`bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs cursor-grab active:cursor-grabbing transition-all group hover:border-indigo-300 hover:shadow-elevated ${
                                              snapshot.isDragging ? 'shadow-xl border-indigo-400 rotate-1 scale-105' : 'hover:-translate-y-0.5'
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
                                        )}
                                      </Draggable>
                                    );
                                  })}
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
                      const left  = (idx * 7) % 40;
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
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const todayDate = now.getDate();
              const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              return (
                <div className="h-full overflow-y-auto px-4 py-3">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                      <span className="text-sm font-black text-slate-800">
                        {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {tasks.filter(t => t.dueDate?.startsWith(monthStr)).length} tasks this month
                      </span>
                    </div>
                    <div className="grid grid-cols-7 border-b border-slate-100">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-2 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {Array(firstDay).fill(null).map((_, i) => (
                        <div key={`e${i}`} className="min-h-[80px] border-b border-r border-slate-50 bg-slate-50/30" />
                      ))}
                      {Array(daysInMonth).fill(null).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                        const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
                        const isToday = day === todayDate;
                        return (
                          <div key={day} className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 flex flex-col transition-colors hover:bg-slate-50/50 ${isToday ? 'bg-violet-50/40' : ''}`}>
                            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-[#5f35f5] text-white' : 'text-slate-500'}`}>
                              {day}
                            </span>
                            <div className="space-y-0.5 overflow-hidden">
                              {dayTasks.slice(0, 2).map(t => {
                                const pDot = PRIORITY_DOT[t.priority] || 'bg-slate-300';
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => navigate(`/workspace/${workspaceId}/task/${t.id}`)}
                                    className="text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 cursor-pointer bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors truncate"
                                  >
                                    <span className={`w-1 h-1 rounded-full ${pDot} shrink-0`} />
                                    {t.title}
                                  </div>
                                );
                              })}
                              {dayTasks.length > 2 && (
                                <div className="text-[8px] text-slate-400 font-bold px-1">+{dayTasks.length - 2}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

          </motion.div>
        </AnimatePresence>
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
    </div>
  );
}
