import { useState } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';

import { 
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

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
  '&.MuiButton-containedPrimary': {
    backgroundColor: '#dd2825',
    '&:hover': {
      backgroundColor: 'rgba(221, 40, 37, 0.7)', // Même couleur au survol
    },
  },
}));

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      // Save token
      localStorage.setItem('token', data.token);
      
      // Redirect to admin dashboard instead of /dashboard
      navigate('/admin');
      
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
      <Box
    component="div"
    sx={{
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center'
    }}
  >
    <img 
    src="logo.png" 
    alt="" 
    style={{ height: '70px' }} 
  />
    </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
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
            autoFocus
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                value="remember"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Remember Me"
          />
<StyledButton
  type="submit"
  fullWidth
  variant="contained"
  color="primary"
  sx={{
    //color: '#FFFFFF',  // This sets the text color to white
    // or
    color: 'white'     // This also works
  }}
>
  Sign In
</StyledButton>
          
          <Box sx={{ my: 2, textAlign: 'center' }}>
            <Divider sx={{ my: 2 }}>
              <Typography color="textSecondary">OR</Typography>
            </Divider>
          </Box>

          <StyledButton
  fullWidth
  variant="outlined"
  startIcon={<GoogleIcon />}
  onClick={() => console.log('Google sign in')}
>
  Sign in using Google
</StyledButton>

<StyledButton
  fullWidth
  variant="outlined"
  startIcon={<GitHubIcon />}
  onClick={() => console.log('GitHub sign in')}
  style={{ marginTop: '1px' }} // Réduction de l'espace entre les boutons
>
  Sign in using GitHub
</StyledButton>


          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              href="#"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              sx={{ display: 'block', mb: 1 }}
            >
              I forgot my password
            </Link>
            <Link
              href="#"
              variant="body2"
              onClick={() => navigate('/signup')}
              
            >
              Register a new membership
            </Link>
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default SignIn;