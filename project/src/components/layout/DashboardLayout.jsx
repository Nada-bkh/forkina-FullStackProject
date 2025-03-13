
// src/components/layout/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Box, Toolbar, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

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
          
          // Rediriger si l'utilisateur n'est pas un admin
          if (data.userRole !== 'ADMIN') {
            if (data.userRole === 'STUDENT') {
              window.location.replace('/student');
            } else if (data.userRole === 'TUTOR') {
              window.location.replace('/tutor');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure full height layout */}
      <Sidebar user={user} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          minHeight: '100vh', /* Match sidebar height */
          bgcolor: 'background.default',
          overflow: 'auto', /* Prevent content overflow */
          position: 'relative'
        }}
      >
        <Toolbar sx={{ minHeight: '14px' }} /> {/* Ensure spacing for AppBar */}
        {user && (
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
        )}
        <Outlet context={{ user, updateUser }} />
      </Box>
    </Box>
  );
};

export default DashboardLayout;