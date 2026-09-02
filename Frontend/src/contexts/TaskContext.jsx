import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspace } from './WorkspaceContext';
import apiClient from '../services/apiClient';

const TaskContext = createContext(null);

export const useTask = () => useContext(TaskContext);

export const DEFAULT_KANBAN_COLUMNS = [
  { id: 'TODO', title: 'TO DO', color: 'border-l-4 border-slate-400', badgeBg: 'bg-slate-100 text-slate-600' },
  { id: 'IN_PROGRESS', title: 'IN PROGRESS', color: 'border-l-4 border-[#1a73e8]', badgeBg: 'bg-blue-50 text-[#1a73e8]' },
  { id: 'IN_REVIEW', title: 'IN REVIEW', color: 'border-l-4 border-amber-500', badgeBg: 'bg-amber-50 text-amber-600' },
  { id: 'COMPLETED', title: 'COMPLETED', color: 'border-l-4 border-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-600' }
];

const TASKS_CACHE_KEY = 'projectgo_tasks_cache_v2';

export const TaskProvider = ({ children }) => {
  const { activeWorkspace, workspaces } = useWorkspace();
  
  // Initialize tasks from localStorage cache for 0ms initial load
  const [allTasks, setAllTasks] = useState(() => {
    try {
      const cached = localStorage.getItem(TASKS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [columns, setColumns] = useState(DEFAULT_KANBAN_COLUMNS);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Helper to get columns scoped strictly to a specific workspace
  const getWorkspaceColumns = useCallback((wsId) => {
    if (!wsId) return DEFAULT_KANBAN_COLUMNS;
    try {
      const key = `projectgo_columns_ws_${wsId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading workspace columns:', e);
    }
    return DEFAULT_KANBAN_COLUMNS;
  }, []);

  // Update columns when active workspace changes
  useEffect(() => {
    if (activeWorkspace?.id) {
      setColumns(getWorkspaceColumns(activeWorkspace.id));
    } else {
      setColumns(DEFAULT_KANBAN_COLUMNS);
    }
  }, [activeWorkspace?.id, getWorkspaceColumns]);

  // Persist tasks in cache whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(allTasks));
    } catch (e) {
      console.warn('Unable to cache tasks in localStorage:', e);
    }
  }, [allTasks]);

  // Comprehensive fetch for ALL tasks across user's workspaces
  const fetchAllTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const response = await apiClient.get('/tasks', {
        params: { workspaceId: 'ALL' }
      });
      if (Array.isArray(response.data)) {
        setAllTasks(prev => {
          // Merge incoming tasks without losing any existing ones
          const map = new Map();
          prev.forEach(t => map.set(t.id || t._id, t));
          response.data.forEach(t => map.set(t.id || t._id, t));
          return Array.from(map.values());
        });
      }
    } catch (error) {
      console.error("Error loading tasks from backend:", error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Initial load and whenever workspaces change
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks, workspaces.length]);

  // When activeWorkspace changes, ensure its specific tasks are refreshed and merged
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    let isMounted = true;
    apiClient.get('/tasks', {
      params: { workspaceId: activeWorkspace.id }
    }).then(res => {
      if (isMounted && Array.isArray(res.data)) {
        setAllTasks(prev => {
          const map = new Map();
          prev.forEach(t => map.set(t.id || t._id, t));
          res.data.forEach(t => map.set(t.id || t._id, t));
          return Array.from(map.values());
        });
      }
    }).catch(err => {
      console.error("Error fetching workspace tasks:", err);
    });

    return () => { isMounted = false; };
  }, [activeWorkspace?.id]);

  const moveTask = async (taskId, newStatus) => {
    // Instant optimistic update
    setAllTasks(prev => prev.map(task =>
      (task.id === taskId || task._id === taskId) ? { ...task, status: newStatus } : task
    ));

    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      console.error('Error moving task:', error);
      fetchAllTasks(); // Resync on failure
    }
  };

  const addTask = async (taskData) => {
    const wsId = taskData.workspaceId || activeWorkspace?.id;
    if (!wsId) return;

    // Temporary optimistic task
    const tempId = `temp_${Date.now()}`;
    const optimisticTask = {
      ...taskData,
      id: tempId,
      _id: tempId,
      workspaceId: wsId,
      createdAt: new Date().toISOString()
    };

    setAllTasks(prev => [optimisticTask, ...prev]);

    try {
      const response = await apiClient.post('/tasks', {
        ...taskData,
        workspaceId: wsId
      });
      const newTask = response.data;
      setAllTasks(prev => prev.map(t => t.id === tempId ? newTask : t));
      return newTask;
    } catch (error) {
      console.error("Error adding task:", error);
      setAllTasks(prev => prev.filter(t => t.id !== tempId));
      throw error;
    }
  };

  const updateTask = async (taskId, updates) => {
    // Optimistic update
    setAllTasks(prev => prev.map(task =>
      (task.id === taskId || task._id === taskId) ? { ...task, ...updates } : task
    ));

    try {
      const response = await apiClient.put(`/tasks/${taskId}`, updates);
      const updatedTask = response.data;
      setAllTasks(prev => prev.map(task =>
        (task.id === taskId || task._id === taskId) ? updatedTask : task
      ));
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      fetchAllTasks();
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    // Optimistic delete
    setAllTasks(prev => prev.filter(task => task.id !== taskId && task._id !== taskId));

    try {
      await apiClient.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error("Error deleting task:", error);
      fetchAllTasks();
      throw error;
    }
  };

  // Workspace-scoped column additions
  const addColumn = (title) => {
    const wsId = activeWorkspace?.id;
    if (!wsId) return;

    const cleanId = title.toUpperCase().replace(/\s+/g, '_');
    const newCol = {
      id: cleanId,
      title: title.toUpperCase(),
      color: 'border-l-4 border-slate-400',
      badgeBg: 'bg-slate-100 text-slate-600'
    };

    setColumns(prev => {
      if (prev.some(col => col.id === cleanId)) return prev;
      const updated = [...prev, newCol];
      try {
        localStorage.setItem(`projectgo_columns_ws_${wsId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving columns:', e);
      }
      return updated;
    });
  };

  const updateColumn = (columnId, newTitle) => {
    const wsId = activeWorkspace?.id;
    if (!wsId) return;

    setColumns(prev => {
      const updated = prev.map(col =>
        col.id === columnId ? { ...col, title: newTitle.toUpperCase() } : col
      );
      try {
        localStorage.setItem(`projectgo_columns_ws_${wsId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error updating columns:', e);
      }
      return updated;
    });
  };

  const deleteColumn = async (columnId) => {
    const wsId = activeWorkspace?.id;
    if (!wsId) return;

    setColumns(prev => {
      const updated = prev.filter(col => col.id !== columnId);
      try {
        localStorage.setItem(`projectgo_columns_ws_${wsId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error deleting columns:', e);
      }
      return updated;
    });

    // Delete tasks in this column for this workspace
    const tasksToDelete = allTasks.filter(t => t.workspaceId === wsId && t.status === columnId);
    for (const t of tasksToDelete) {
      await deleteTask(t.id || t._id);
    }
  };

  const value = {
    tasks: allTasks,
    allTasks,
    columns,
    tasksLoading,
    fetchAllTasks,
    moveTask,
    addTask,
    updateTask,
    deleteTask,
    addColumn,
    updateColumn,
    deleteColumn
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
