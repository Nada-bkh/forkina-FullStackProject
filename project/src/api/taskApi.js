import { api } from './axiosConfig';

export const fetchTutorTasks = async () => {
  try {
    const response = await api.get('/tutor/tasks');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch tutor tasks');
  }
};

export const fetchTasksByProject = async (projectId) => {
  try {
    const response = await api.get(`/tasks/project/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch tasks');
  }
};

export const fetchAllTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch all tasks');
  }
};

export const fetchTaskById = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch task');
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create task');
  }
};

export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    await api.put(`/tasks/${taskId}`, { status: newStatus });
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update task status');
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update task');
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete task');
  }
};