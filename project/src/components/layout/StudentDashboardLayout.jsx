// src/components/layout/StudentDashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Box, Toolbar, Typography, IconButton, Badge, Popover, List, ListItem, ListItemText } from '@mui/material';
import StudentSidebar from './StudentSidebar';
import { Outlet } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { fetchNotifications, markNotificationAsRead } from '../../api/notificationApi';

const StudentDashboardLayout = () => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://localhost:5001/api/users/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    if (data.userRole !== 'STUDENT') {
                        window.location.replace(data.userRole === 'ADMIN' ? '/admin' : '/tutor');
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        const loadNotifications = async () => {
            try {
                const notifs = await fetchNotifications();
                setNotifications(notifs);
            } catch (err) {
                console.error(err.message);
            }
        };

        fetchUserProfile();
        loadNotifications();
    }, []);

    const handleNotificationClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(notifications.map((n) =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error(err.message);
        }
    };

    const open = Boolean(anchorEl);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <StudentSidebar user={user} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    overflow: 'auto',
                    position: 'relative',
                }}
            >
                <Toolbar sx={{ minHeight: '14px' }} />
                {user && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ color: '#dd2825', fontWeight: 'bold' }}>
                            Welcome, {user.firstName} {user.lastName}
                        </Typography>
                        <IconButton onClick={handleNotificationClick}>
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon sx={{ color: '#dd2825' }} />
                            </Badge>
                        </IconButton>
                        <Popover
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handleNotificationClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <List sx={{ width: '300px', maxHeight: '400px', overflow: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <ListItem><ListItemText primary="No notifications" /></ListItem>
                                ) : (
                                    notifications.map((notif) => (
                                        <ListItem
                                            key={notif._id}
                                            sx={{ bgcolor: notif.read ? 'inherit' : '#f5f5f5' }}
                                            onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                                        >
                                            <ListItemText
                                                primary={notif.message}
                                                secondary={new Date(notif.createdAt).toLocaleString()}
                                            />
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Popover>
                    </Box>
                )}
                <Outlet context={{ user, updateUser: (newUserData) => setUser(newUserData) }} />
            </Box>
        </Box>
    );
};

export default StudentDashboardLayout;