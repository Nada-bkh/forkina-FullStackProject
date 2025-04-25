// src/api/teamApi.js
import { api } from './axiosConfig';

export const fetchStudentTeams = async () => {
  try {
    const response = await api.get('/teams/my-teams');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch teams');
  }
};

export const createTeam = async (teamData) => {
  try {
    const response = await api.post('/teams', teamData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create team');
  }
};

export const confirmOrDeleteTeam = async (teamId, action) => {
  try {
    const response = await api.post('/teams/confirm-delete', { teamId, action });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to perform action on team');
  }
};

export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update team');
  }
};

export const deleteTeam = async (teamId) => {
  try {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete team');
  }
};

export const fetchTeamById = async (teamId) => {
  try {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch team');
  }
};

export const fetchAllTeams = async () => {
  try {
    const response = await api.get('/teams');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all teams');
  }
};

export const fetchTutorsByClass = async (classId) => {
  try {
    const response = await api.get('/teams/tutors', { params: { classId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch tutors');
  }
};

export const fetchStudentsByClass = async (classId) => {
  try {
    const response = await api.get('/teams/students', { params: { classId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch students');
  }
};