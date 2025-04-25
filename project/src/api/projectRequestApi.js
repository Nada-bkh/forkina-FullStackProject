import { api } from './axiosConfig';

export const createProjectRequest = async (projectData) => {
    try {
        const response = await api.post('/project-requests', projectData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to create project request');
    }
};

export const fetchPendingProjectRequests = async () => {
    try {
        const response = await api.get('/project-requests/pending');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch project requests');
    }
};

export const confirmProjectRequest = async (requestId) => {
    try {
        const response = await api.put(`/project-requests/${requestId}/confirm`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to confirm project request');
    }
};

export const rejectProjectRequest = async (requestId) => {
    try {
        const response = await api.put(`/project-requests/${requestId}/reject`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to reject project request');
    }
};
export const createJoinProjectRequest = async (projectId) => {
    try {
        const response = await api.post('/project-requests', { type: 'JOIN', projectId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to create join request');
    }
};