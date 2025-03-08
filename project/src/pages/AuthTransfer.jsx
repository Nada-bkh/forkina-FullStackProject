import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const AuthTransfer = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Get token and role from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const role = urlParams.get('role');
        
        if (token) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          console.log('Token stored in localStorage');
          
          // If we have a role from URL params, use it for immediate redirect
          if (role) {
            console.log('Role from URL:', role);
            switch(role.toUpperCase()) {
              case 'STUDENT':
                navigate('/student');
                return;
              case 'TUTOR':
                navigate('/tutor');
                return;
              case 'ADMIN':
                navigate('/admin');
                return;
              default:
                // Continue with profile fetch to determine role
            }
          }
        } else {
          console.warn('No token found in URL params');
        }

        // Get user profile with token as backup
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          setError('No authentication token found');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        const response = await fetch('http://localhost:5001/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data from profile:', userData);
          
          // Redirect based on role from profile
          switch(userData.userRole?.toUpperCase()) {
            case 'STUDENT':
              navigate('/student');
              break;
            case 'TUTOR':
              navigate('/tutor');
              break;
            case 'ADMIN':
              navigate('/admin');
              break;
            default:
              // Default to student dashboard
              navigate('/student');
          }
        } else {
          setError('Authentication failed');
          setTimeout(() => navigate('/signin'), 3000);
        }
      } catch (err) {
        console.error('Auth transfer error:', err);
        setError('Authentication failed');
        setTimeout(() => navigate('/signin'), 3000);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3
      }}
    >
      {error ? (
        <Typography color="error" variant="h6">
          {error}. Redirecting to login...
        </Typography>
      ) : (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Authentication successful! Redirecting...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthTransfer; 