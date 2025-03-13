// src/api/classApi.js
import { api } from './axiosConfig';

// Fetch all classes (for admin or tutor)
export const fetchClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch classes');
  }
};

// Fetch a specific class by ID
export const fetchClassById = async (classId) => {
  try {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch class');
  }
};

// Create a new class (Admin only)
export const createClass = async (classData) => {
  try {
    const response = await api.post('/classes', classData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create class');
  }
};

// Update a class (Admin only)
export const updateClass = async (classId, classData) => {
  try {
    const response = await api.put(`/classes/${classId}`, classData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update class');
  }
};

// Delete a class (Admin only)
export const deleteClass = async (classId) => {
  try {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete class');
  }
};

// Add students to a class (Admin only)
export const addStudentsToClass = async (classId, studentIds) => {
  try {
    const response = await api.post('/classes/add-students', { classId, studentIds });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add students to class');
  }
};

// Fetch all students for a tutor (across all their classes)
export const fetchStudentsForTutor = async () => {
  try {
    const response = await api.get('/classes/tutor/students');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch students');
  }
};
