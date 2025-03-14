import { useState, useEffect } from 'react';
import { Box, Toolbar, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';

const DashboardLayout = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }

                const response = await fetch('http://localhost:5001/api/users/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);

                    // Redirect if user is not an admin
                    if (data.userRole !== 'ADMIN') {
                        if (data.userRole === 'STUDENT') {
                            window.location.replace('/student');
                        } else if (data.userRole === 'TUTOR') {
                            window.location.replace('/tutor');
                        }
                    }
                } else {
                    throw new Error('Failed to fetch user profile');
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                localStorage.removeItem('token');
                navigate('/signin');
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const updateUser = (newUserData) => {
        setUser(newUserData);
    };

    if (!user) {
        return null; // Render nothing while fetching user data
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar user={user} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    overflow: 'auto',
                    position: 'relative'
                }}
            >
                <Toolbar sx={{ minHeight: '14px' }} />
                <Box sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 0.5
                }}>
                    <Typography variant="subtitle1" sx={{ color: '#dd2825', fontWeight: 'bold' }}>
                        Welcome, {user.firstName} {user.lastName}
                    </Typography>
                </Box>
                <Outlet context={{ user, updateUser }} />
            </Box>
        </Box>
    );
};

export default DashboardLayout;