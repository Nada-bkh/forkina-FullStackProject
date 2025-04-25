// project/src/api/projectApi.js
import { api } from './axiosConfig';

export const fetchAllProjects = async (role) => {
    try {
        const endpoint = role === 'ADMIN' ? '/projects' : '/projects';
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch projects');
    }
};

export const fetchProjectById = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
};

export const createProject = async (projectData) => {
    try {
        const response = await api.post('/projects', projectData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to create project');
    }
};

export const updateProject = async (projectId, projectData) => {
    try {
        const response = await api.put(`/projects/${projectId}`, projectData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to update project');
    }
};

export const deleteProject = async (projectId) => {
    try {
        const response = await api.delete(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to delete project');
    }
};

export const assignClassesToProject = async (projectId, classIds) => {
    try {
        console.log('Sending assign classes request:', { projectId, classIds });
        const response = await api.put(`/projects/${projectId}/assign-classes`, { classIds });
        console.log('Assign classes API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Assign classes API error:', error.response?.data, error.response?.status);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to assign classes to project';
        throw new Error(errorMessage);
    }
};
/*
export const fetchPredictedCompletion = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/predicted-completion`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch predicted completion');
    }
};

export const fetchRiskAlerts = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/risk-alerts`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch risk alerts');
    }
};

export const fetchProjectsForClass = async (classId) => {
    try {
        const response = await api.get(`/classes/${classId}/projects`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
};
*/
export const fetchProjectInsights = async (projectId) => {
    try {
        // Add timeout and fallback mechanism
        const predictedCompletionPromise = api.get(`/projects/${projectId}/predicted-completion`)
            .catch(error => {
                console.warn(`Prediction service error: ${error.message}`);
                // Return a structured fallback response instead of throwing
                return { data: { message: 'Prediction service unavailable' } };
            });

        const riskAlertPromise = api.get(`/projects/${projectId}/risk-alerts`)
            .catch(error => {
                console.warn(`Risk alert service error: ${error.message}`);
                // Return a structured fallback response
                return { data: { message: 'Risk service unavailable' } };
            });

        const [predictedCompletionResponse, riskAlertResponse] = await Promise.all([
            predictedCompletionPromise,
            riskAlertPromise,
        ]);

        return {
            predictedCompletion: predictedCompletionResponse.data,
            riskAlert: riskAlertResponse.data
        };
    } catch (error) {
        console.error('Error fetching project insights:', error);
        // Return a structured error response rather than throwing
        return {
            predictedCompletion: { message: 'Failed to fetch prediction data' },
            riskAlert: { message: 'Failed to fetch risk data' }
        };
    }
};
export const assignTeamToProject = async (projectId, teamIds) => {
    try {
        const response = await api.put(`/projects/${projectId}/assignTeam`, { teamIds });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to assign teams to project');
    }
};

export const approveProject = async (projectId) => {
    try {
        const response = await api.put(`/projects/${projectId}/approve`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to approve project');
    }
};

export const rejectProject = async (projectId) => {
    try {
        const response = await api.put(`/projects/${projectId}/reject`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to reject project');
    }
};

