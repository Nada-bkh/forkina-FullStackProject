import { api } from './axiosConfig';

export const fetchTutorTasks = async () => {
  try {
    const response = await api.get('/tutor/tasks');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.response?.statusText || 'Failed to fetch tutor tasks');
  }
};

export const fetchTasksByProject = async (projectId) => {
  try {
    const response = await api.get(`/tasks/project/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.response?.data?.details || error.response?.statusText || 'Failed to fetch tasks';
    throw new Error(`${message} (Status: ${status || 'unknown'})`);
  }
};

export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    await api.put(`/tasks/${taskId}`, { status: newStatus });
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update task status');
  }
};