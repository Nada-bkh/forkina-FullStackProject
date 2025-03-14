import { useState, useEffect } from 'react';
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
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
    educationLevel: '',
    cin: ''
  });
  const [error, setError] = useState('');
  const [faceImage, setFaceImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Personal Information', 'Face Detection'];

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

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

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Create FormData
      const formData = new FormData();
      formData.append('faceImage', file);
      
      // Upload the face image
      const response = await fetch('http://localhost:5001/api/face-detection/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload face image');
      }
      
      // Save the file path and face descriptor
      setFaceImage(data.filePath);
      setFaceDescriptor(data.faceDescriptor);
      
      console.log('Face image uploaded successfully with descriptor');
    } catch (error) {
      console.error('Error uploading face image:', error);
      setError('Failed to upload face image. Please try again.');
    }
  };

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    // Validate that we have both face image and descriptor
    if (!faceImage || !faceDescriptor) {
      setError('Face image is required. Please upload your face image.');
      return;
    }

    // Validate CIN for student role
    if (formData.role === 'STUDENT' && !formData.cin) {
      setError('CIN is required for students.');
      return;
    }

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
          role: formData.role,
          faceImage: faceImage,
          faceDescriptor: faceDescriptor,
          cin: formData.cin
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

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" sx={{ width: '100%' }}>
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
                    transitionDuration: '0ms',
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
              <>
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
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="cin"
                  label="CIN (Carte d'Identité Nationale)"
                  value={formData.cin}
                  onChange={handleChange}
                  inputProps={{ maxLength: 8 }}
                  helperText="Votre numéro d'identité est requis pour l'inscription"
                />
                
            
              </>
            )}
                    {formData.role === 'TUTOR' && (
              <>
                <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Department</InputLabel>
    <Select
      name="departement"
      value={formData.departement}
      onChange={handleChange}
      required
    >
      <MenuItem value="SE">Software Engineering</MenuItem>
      <MenuItem value="DS">Artificial Intelligence & Data Science</MenuItem>
      <MenuItem value="NIDS">Network Infrastructure & Data Security</MenuItem>
      <MenuItem value="ArcTIC">IT Architecture & Cloud Computing</MenuItem>
      <MenuItem value="Gamix">Gaming & Immersive eXperience</MenuItem>
      <MenuItem value="InFini">Financial Computing & Engineering</MenuItem>
      <MenuItem value="SLEAM">Embedded, Ambient & Mobile Systems</MenuItem>
      <MenuItem value="SAE">Software Architecture Engineering</MenuItem>
      <MenuItem value="ERP">Enterprise Resource Planning & BI</MenuItem>
      <MenuItem value="SIM">Information & Mobile Systems</MenuItem>
      <MenuItem value="TWIN">Web & Internet Technologies</MenuItem>
    </Select>
                </FormControl>
                
                
              </>
            )}

            <StyledButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{
                color: 'white'
              }}
            >
              Next: Face Detection
            </StyledButton>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please upload a clear photo of your face. This will be used for authentication.
            </Typography>
            
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Upload Face Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
            
            {faceImage && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="success.main">
                  Face image uploaded successfully!
                </Typography>
                <img 
                  src={`http://localhost:5001${faceImage}`} 
                  alt="Uploaded face" 
                  style={{ width: '200px', height: 'auto', margin: '10px auto', borderRadius: '8px' }} 
                />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
              >
                Back
              </Button>
              
              <StyledButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={!faceImage || !faceDescriptor}
                onClick={handleSubmit}
                sx={{
                  color: 'white'
                }}
              >
                Complete Registration
              </StyledButton>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <StyledPaper elevation={6}>
        {/* Logo */}
        <Box component="div" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '70px', width: 'auto' }} />
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {renderStep(activeStep)}
        
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
      </StyledPaper>
    </Container>
  );
};

export default SignUp;
