// src/api/notificationApi.js
import { api } from './axiosConfig';

export const fetchNotifications = async () => {
    try {
        const response = await api.get('/notifications');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return []; // Return empty array on error
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
};