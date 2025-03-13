import { useState, useEffect } from 'react';
import { Box, Toolbar, Typography } from '@mui/material';
import StudentSidebar from './StudentSidebar';
import { Outlet } from 'react-router-dom';

const StudentDashboardLayout = () => {
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
          
          // Rediriger si l'utilisateur n'est pas un étudiant
          if (data.userRole !== 'STUDENT') {
            if (data.userRole === 'ADMIN') {
              window.location.replace('/admin');
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
          position: 'relative'
        }}
      >
        <Toolbar sx={{ minHeight: '14px' }} />
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

export default StudentDashboardLayout; 