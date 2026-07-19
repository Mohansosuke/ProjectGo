import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
// Seeding is disabled since local data files are deleted
export const seedInitialDataIfEmpty = async (userId) => {
  // no-op
};

export const getWorkspaces = async (userId) => {
  const ref = collection(db, "workspaces");
  // Get workspaces where user is a member
  const q = query(ref, where("members", "array-contains", userId));
  const snap = await getDocs(q);
  
  const list = [];
  snap.forEach(d => {
    list.push(d.data());
  });
  return list;
};

export const createWorkspaceDoc = async (userId, data) => {
  const id = `w_${Date.now()}`;
  const newWorkspace = {
    id,
    name: data.name,
    description: data.description || '',
    url: data.url || data.name.toLowerCase().replace(/\s+/g, '-'),
    logo: null,
    members: [userId],
    visibility: data.visibility || 'Private',
    recent: true,
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, "workspaces", id), newWorkspace);
  return newWorkspace;
};

export const updateWorkspaceDoc = async (workspaceId, updates) => {
  const ref = doc(db, "workspaces", workspaceId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteWorkspaceDoc = async (workspaceId) => {
  await deleteDoc(doc(db, "workspaces", workspaceId));
  // Clean up associated tasks
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("workspaceId", "==", workspaceId));
  const snap = await getDocs(q);
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "tasks", d.id));
  });
};

// --- Tasks ---
export const getTasksByWorkspace = async (workspaceId) => {
  const ref = collection(db, "tasks");
  const q = query(ref, where("workspaceId", "==", workspaceId));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => {
    list.push(d.data());
  });
  return list;
};

export const createTaskDoc = async (workspaceId, taskData) => {
  const id = `t_${Date.now()}`;
  const newTask = {
    id,
    workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    points: taskData.points || 1,
    labels: taskData.labels || [],
    ...taskData
  };
  await setDoc(doc(db, "tasks", id), newTask);
  return newTask;
};

export const updateTaskDoc = async (taskId, updates) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteTaskDoc = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// --- Comments ---
export const getCommentsByTask = async (taskId) => {
  const ref = collection(db, "comments");
  const q = query(ref, where("taskId", "==", taskId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => {
    list.push(d.data());
  });
  return list;
};

export const createCommentDoc = async (taskId, commentData) => {
  const id = `c_${Date.now()}`;
  const newComment = {
    id,
    taskId,
    createdAt: new Date().toISOString(),
    ...commentData
  };
  await setDoc(doc(db, "comments", id), newComment);
  return newComment;
};
