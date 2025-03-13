// src/api/notificationApi.js
import { api } from './axiosConfig';

export const fetchNotifications = async () => {
    try {
        const response = await api.get('/notifications');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
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