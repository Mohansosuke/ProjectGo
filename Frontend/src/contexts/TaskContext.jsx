import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWorkspace } from './WorkspaceContext';
import apiClient from '../services/apiClient';

const TaskContext = createContext(null);

export const useTask = () => useContext(TaskContext);

const defaultColumns = [
  { id: 'TODO', title: 'TO DO', color: 'border-l-4 border-slate-400', badgeBg: 'bg-slate-100 text-slate-600  ' },
  { id: 'IN_PROGRESS', title: 'IN PROGRESS', color: 'border-l-4 border-[#1a73e8]', badgeBg: 'bg-blue-50 text-[#1a73e8]  ' },
  { id: 'IN_REVIEW', title: 'IN REVIEW', color: 'border-l-4 border-amber-500', badgeBg: 'bg-amber-50 text-amber-600  ' },
  { id: 'COMPLETED', title: 'COMPLETED', color: 'border-l-4 border-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-600  ' }
];

export const TaskProvider = ({ children }) => {
  const { activeWorkspace } = useWorkspace();
  const [allTasks, setAllTasks] = useState([]);
  const [columns, setColumns] = useState([]);

  // Load columns from localStorage or use default
  useEffect(() => {
    const localCols = localStorage.getItem('projectgo_columns_db');
    if (localCols) {
      setColumns(JSON.parse(localCols));
    } else {
      localStorage.setItem('projectgo_columns_db', JSON.stringify(defaultColumns));
      setColumns(defaultColumns);
    }
  }, []);

  // Fetch tasks when active workspace changes
  useEffect(() => {
    if (!activeWorkspace) {
      setAllTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await apiClient.get('/tasks', {
          params: { workspaceId: activeWorkspace.id }
        });
        setAllTasks(response.data);
      } catch (error) {
        console.error("Error loading tasks from backend:", error);
      }
    };

    fetchTasks();
  }, [activeWorkspace]);

  const moveTask = async (taskId, newStatus) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      setAllTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  const addTask = async (taskData) => {
    if (!activeWorkspace) return;
    try {
      const response = await apiClient.post('/tasks', {
        ...taskData,
        workspaceId: activeWorkspace.id
      });
      const newTask = response.data;
      setAllTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, updates);
      const updatedTask = response.data;
      setAllTasks(prev => prev.map(task =>
        task.id === taskId ? updatedTask : task
      ));
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const addColumn = (title) => {
    const cleanId = title.toUpperCase().replace(/\s+/g, '_');
    const newCol = {
      id: cleanId,
      title: title.toUpperCase(),
      color: 'border-l-4 border-slate-400',
      badgeBg: 'bg-slate-100 text-slate-600  '
    };

    setColumns(prev => {
      if (prev.some(col => col.id === cleanId)) return prev;
      const updated = [...prev, newCol];
      localStorage.setItem('projectgo_columns_db', JSON.stringify(updated));
      return updated;
    });
  };

  const updateColumn = (columnId, newTitle) => {
    setColumns(prev => {
      const updated = prev.map(col =>
        col.id === columnId ? { ...col, title: newTitle.toUpperCase() } : col
      );
      localStorage.setItem('projectgo_columns_db', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteColumn = async (columnId) => {
    setColumns(prev => {
      const updated = prev.filter(col => col.id !== columnId);
      localStorage.setItem('projectgo_columns_db', JSON.stringify(updated));
      return updated;
    });

    // Delete tasks in this column
    const tasksToDelete = allTasks.filter(t => t.status === columnId);
    for (const t of tasksToDelete) {
      await deleteTask(t.id);
    }
  };

  const value = {
    tasks: allTasks,
    allTasks,
    columns,
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
