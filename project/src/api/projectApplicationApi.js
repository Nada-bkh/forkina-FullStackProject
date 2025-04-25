import { api } from './axiosConfig';

export const fetchStudentApplications = async () => {
  try {
    const response = await api.get('/project-applications');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch applications');
  }
};

export const submitApplication = async (applicationData) => {
  try {
    console.log('Submitting application data to API:', applicationData);
    
    // Validate data before sending request
    if (!applicationData.projectId) {
      throw new Error('Project ID is required');
    }
    if (!applicationData.teamName) {
      throw new Error('Team name is required');
    }
    if (!applicationData.priority) {
      throw new Error('Priority is required');
    }
    if (!applicationData.motivationLetter) {
      throw new Error('Motivation letter is required');
    }
    
    const response = await api.post('/project-applications', applicationData);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Application submission error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to submit application');
  }
};

export const cancelApplication = async (applicationId) => {
  try {
    const response = await api.delete(`/project-applications/${applicationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to cancel application');
  }
};

export const getTeamApplications = async (teamName) => {
  try {
    const response = await api.get(`/applications/team/${encodeURIComponent(teamName)}`);
    return response.data;
  } catch (error) {
    throw new Error(
        error.response?.data?.error ||
        `Failed to fetch team applications: ${error.message}`
    );
  }
};