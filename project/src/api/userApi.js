// src/api/userApi.js
import { api } from './axiosConfig';

export const fetchUsers = async (role) => {
  try {
    const params = role ? { role } : {};
    const response = await api.get('/users', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await api.put(`/users/${userData._id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

export const deleteUser = async (userId) => {
  try {
    console.log('Deleting user with ID:', userId);
    const response = await api.delete(`/users/${userId}`);
    console.log('Delete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Delete error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};