import { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
      backgroundColor: '', // Même couleur au survol
    },
  },
}));

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    birthDate: null,
    role: '',
    educationLevel: ''
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      birthDate: date
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful
      navigate('/signin');
      
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    }
  };

  return (
<Container component="main" maxWidth="sm">
<StyledPaper elevation={6}>
        {/* Logo */}
        <Box component="div" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '70px', width: 'auto' }} />
        </Box>

     

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              required
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              required
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          
          <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Birth Date"
    value={formData.birthDate}
    onChange={handleDateChange}
    PopperProps={{
      disablePortal: true,
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: 'window',
          },
        },
      ],
    }}
    slotProps={{
      desktop: {
        transitionDuration: '0ms', // Supprimer toute animation de transition
      },
    }}
    sx={{ width: '100%', mt: 2 }}
  />
</LocalizationProvider>





          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="TUTOR">Tutor</MenuItem>
            </Select>
          </FormControl>
          
          {formData.role === 'STUDENT' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Education Level</InputLabel>
              <Select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                required
              >
                <MenuItem value="BEGINNER">Beginner</MenuItem>
                <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                <MenuItem value="ADVANCED">Advanced</MenuItem>
              </Select>
            </FormControl>
          )}

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
            Sign Up
          </StyledButton>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              href="#"
              variant="body2"
              onClick={() => navigate('/signin')}
              sx={{ display: 'block', mb: 1 }}
            >
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default SignUp;
