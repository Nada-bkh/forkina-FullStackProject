import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const AuthTransfer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const transferToken = () => {
      try {
        // Get token from cookie
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
        
        if (!authCookie) {
          console.error('No auth token cookie found');
          navigate('/signin');
          return;
        }

        // Extract token value
        const token = authCookie.split('=')[1];
        
        // Store in localStorage
        localStorage.setItem('token', token);
        
        // Clear the cookie
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to admin
        navigate('/admin');
      } catch (error) {
        console.error('Error during token transfer:', error);
        navigate('/signin');
      }
    };

    transferToken();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography>Completing authentication...</Typography>
    </Box>
  );
};

export default AuthTransfer; 