
import { useState, useEffect } from 'react';
import { Box, Container, TextField, Button, Typography, Link, Paper, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/authUtils';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '1rem',
  color: 'white',
  backgroundColor: '#dd2825',
  '&:hover': {
    backgroundColor: 'rgba(221, 40, 37, 0.7)',
  },
}));

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Redirection après succès
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        navigate('/signin');
      }, 3000); // Redirige après 3 secondes
    }
  }, [success, navigate]);

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Box component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img src="logo.png" alt="" style={{ height: '70px' }} />
        </Box>


        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            Password reset link has been sent to your email. Redirecting...
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <StyledButton type="submit" fullWidth variant="contained">
            Send Reset Link
          </StyledButton>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="#" variant="body2" onClick={() => navigate('/signin')}>
              Remember your password? Sign In
            </Link>
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default ForgotPassword;