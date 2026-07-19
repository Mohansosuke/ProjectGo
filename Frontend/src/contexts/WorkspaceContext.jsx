import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../services/apiClient';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [workspacesLoading, setWorkspacesLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!currentUser) {
      setWorkspacesLoading(false);
      return;
    }
    setWorkspacesLoading(true);
    try {
      const response = await apiClient.get('/workspaces');
      const list = response.data;
      setWorkspaces(list);

      const storedWorkspace = localStorage.getItem('projectgo_active_workspace');
      if (storedWorkspace) {
        const found = list.find(w => w.id === storedWorkspace);
        if (found) {
          setActiveWorkspace(found);
        } else if (list.length > 0) {
          setActiveWorkspace(list[0]);
          localStorage.setItem('projectgo_active_workspace', list[0].id);
        }
      } else if (list.length > 0) {
        setActiveWorkspace(list[0]);
        localStorage.setItem('projectgo_active_workspace', list[0].id);
      }
    } catch (error) {
      console.error("Error fetching workspaces from backend:", error);
    } finally {
      setWorkspacesLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setWorkspacesLoading(false);
      return;
    }

    fetchWorkspaces();
  }, [currentUser]);

  const selectWorkspace = (id) => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      setActiveWorkspace(workspace);
      localStorage.setItem('projectgo_active_workspace', id);
    }
  };

  const createWorkspace = async (workspaceData) => {
    if (!currentUser) return;
    try {
      const response = await apiClient.post('/workspaces', workspaceData);
      const newWorkspace = response.data;
      setWorkspaces(prev => [...prev, newWorkspace]);
      setActiveWorkspace(newWorkspace);
      localStorage.setItem('projectgo_active_workspace', newWorkspace.id);
      return newWorkspace;
    } catch (error) {
      console.error("Error creating workspace:", error);
      throw error;
    }
  };

  const updateWorkspace = async (id, updates) => {
    try {
      const response = await apiClient.put(`/workspaces/${id}`, updates);
      const updatedWorkspace = response.data;
      setWorkspaces(prev => {
        const updated = prev.map(w => w.id === id ? updatedWorkspace : w);
        if (activeWorkspace && activeWorkspace.id === id) {
          setActiveWorkspace(updatedWorkspace);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error updating workspace:", error);
      throw error;
    }
  };

  const deleteWorkspace = async (id) => {
    try {
      await apiClient.delete(`/workspaces/${id}`);
      setWorkspaces(prev => {
        const updated = prev.filter(w => w.id !== id);
        if (activeWorkspace && activeWorkspace.id === id) {
          if (updated.length > 0) {
            setActiveWorkspace(updated[0]);
            localStorage.setItem('projectgo_active_workspace', updated[0].id);
          } else {
            setActiveWorkspace(null);
            localStorage.removeItem('projectgo_active_workspace');
          }
        }
        return updated;
      });
    } catch (error) {
      console.error("Error deleting workspace:", error);
      throw error;
    }
  };

  const value = {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
    workspacesLoading,
    globalSearchQuery,
    setGlobalSearchQuery
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
