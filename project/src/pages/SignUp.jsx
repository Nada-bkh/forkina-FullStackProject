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
        birthdate: null, // Keep as null initially
        role: '',
        educationLevel: '',
        cin: '',
        department: ''
    });
    const [errors, setErrors] = useState({}); // State for individual field errors
    const [generalError, setGeneralError] = useState(''); // State for general errors
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
        // Clear the error for the current field when the user types
        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: ''
        }));
    };

    const handleDateChange = (date) => {
      setFormData(prev => ({
          ...prev,
          birthdate: date // Now 'date' will be a Dayjs object
      }));
      // Clear any existing birthdate error when date changes
      if (errors.birthdate) {
          setErrors(prevErrors => ({
              ...prevErrors,
              birthdate: ''
          }));
      }
  };

    const handleFileUpload = async (event) => {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('faceImage', file);

            const response = await fetch('http://localhost:5001/api/face-detection/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload face image');
            }

            setFaceImage(data.filePath);
            setFaceDescriptor(data.faceDescriptor);

            console.log('Face image uploaded successfully with descriptor');
        } catch (error) {
            console.error('Error uploading face image:', error);
            setGeneralError('Failed to upload face image. Please try again.');
        }
    };

    const validatePersonalInformation = () => {
        const newErrors = {};
        /*****************************************************/
        if (!formData.firstName)
          {
             newErrors.firstName = 'Last name is required.';
            } else if (!/^[a-zA-Z]+$/.test(formData.firstName)) { // Controle pour les espaces dans le username
              newErrors.firstName = 'First name must contain only letters without spaces..';
          }          /******************************************************/
        if (!formData.lastName)
          {
             newErrors.lastName = 'Last name is required.';
            } else if (!/^[a-zA-Z]+$/.test(formData.lastName)) { // Controle pour les espaces dans le username
              newErrors.lastName = 'Last name must contain only letters without spaces..';
          }  
 /******************************************************/
 if (!formData.username) {
  newErrors.username = 'Username is required.';
} else if (/\s/.test(formData.username)) { // Controle pour les espaces dans le username
  newErrors.username = 'Username cannot contain spaces.';
}     
       /******************************************************/

        if (!formData.email) {
            newErrors.email = 'Email is required.';
        } else if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|.*\.tn)$/.test(formData.email)) {
            newErrors.email = 'Email must be a valid address ending with gmail.com or .tn domain.';
        }
         /******************************************************/

        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/.test(formData.password)) {
            newErrors.password = 'Password must be at least 10 characters long and include at least one uppercase letter, one number, and one special character.';
        }
         /******************************************************/
         if (!formData.birthdate) {
          newErrors.birthdate = 'Birthdate is required.';
        } else {
          const birthDate = new Date(formData.birthdate);
          const today = new Date();
          const minAllowedDate = new Date();
          minAllowedDate.setFullYear(today.getFullYear() - 10);
        
          if (birthDate > today) {
            newErrors.birthdate = 'Birthdate cannot be in the future.';
          } else if (birthDate > minAllowedDate) {
            newErrors.birthdate = 'User must be at least 10 years old.';
          }
        }
               /******************************************************/

        if (!formData.role) newErrors.role = 'Role is required.';
        if (formData.role === 'STUDENT' && !formData.educationLevel) newErrors.educationLevel = 'Education level is required for students.';
        if (formData.role === 'STUDENT' && !formData.cin) newErrors.cin = 'CIN is required for students.';
        if (formData.role === 'STUDENT' && formData.cin && !/^[0-9]{8}$/.test(formData.cin)) newErrors.cin = 'CIN must contain exactly 8 digits without spaces.';
        if (formData.role === 'TUTOR' && !formData.department) newErrors.department = 'Department is required for tutors.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (validatePersonalInformation()) {
                setActiveStep(prevStep => prevStep + 1);
            }
        } else {
            setActiveStep(prevStep => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setGeneralError('');

        if (!faceImage || !faceDescriptor) {
            setGeneralError('Face image is required. Please upload your face image.');
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
                    cin: formData.cin,
                    birthdate: formData.birthdate,
                    educationLevel: formData.educationLevel,
                    department: formData.department,
                    username: formData.username // Don't forget to send the username
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    // Backend returned specific field errors
                    setErrors(data.errors);
                    setGeneralError(data.message || 'Registration failed due to validation errors.');
                } else {
                    setGeneralError(data.message || 'Registration failed');
                }
                return;
            }

            navigate('/signin');

        } catch (err) {
            setGeneralError(err.message);
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
                                error={!!errors.firstName}
                                helperText={errors.firstName}
                                sx={{ '& .MuiOutlinedInput-root': { borderColor: errors.firstName ? 'red' : formData.firstName ? 'green' : '' } }}
                            />
                            <TextField
                                required
                                name="lastName"
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                                sx={{ '& .MuiOutlinedInput-root': { borderColor: errors.lastName ? 'red' : formData.lastName ? 'green' : '' } }}
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
                            error={!!errors.username}
                            helperText={errors.username}
                            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderColor: errors.username ? 'red' : formData.username ? 'green' : '' } }}
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
                            error={!!errors.email}
                            helperText={errors.email}
                            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderColor: errors.email ? 'red' : formData.email ? 'green' : '' } }}
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
                            error={!!errors.password}
                            helperText={errors.password}
                            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderColor: errors.password ? 'red' : formData.password ? 'green' : '' } }}
                        />

<LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
            label="Birth Date"
            value={formData.birthdate} // Should now be a Dayjs object or null
            onChange={handleDateChange}
            sx={{
                width: '100%',
                mt: 2,
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: errors.birthdate ? 'red' : formData.birthdate ? 'green' : '',
                    },
                }
            }}
            slotProps={{
                textField: {
                    error: !!errors.birthdate,
                    helperText: errors.birthdate,
                    required: true,
                },
            }}
        />
    </LocalizationProvider>

                        <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.role}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderColor: errors.role ? 'red' : formData.role ? 'green' : '' } }}
                            >
                                <MenuItem value="STUDENT">Student</MenuItem>
                                <MenuItem value="TUTOR">Tutor</MenuItem>
                            </Select>
                            {errors.role && <Typography variant="caption" color="error">{errors.role}</Typography>}
                        </FormControl>

                        {formData.role === 'STUDENT' && (
                            <>
                                <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.educationLevel}>
                                    <InputLabel>Education Level</InputLabel>
                                    <Select
                                        name="educationLevel"
                                        value={formData.educationLevel}
                                        onChange={handleChange}
                                        required
                                        sx={{ '& .MuiOutlinedInput-root': { borderColor: errors.educationLevel ? 'red' : formData.educationLevel ? 'green' : '' } }}
                                    >
                                        <MenuItem value="BEGINNER">Beginner</MenuItem>
                                        <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                                        <MenuItem value="ADVANCED">Advanced</MenuItem>
                                    </Select>
                                    {errors.educationLevel && <Typography variant="caption" color="error">{errors.educationLevel}</Typography>}
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
                                    helperText={errors.cin || "Votre numéro d'identité est requis pour l'inscription"}
                                    error={!!errors.cin}
                                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderColor: errors.cin ? 'red' : formData.cin ? 'green' : '' } }}
                                />
                            </>
                        )}
                        {formData.role === 'TUTOR' && (
                            <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.department}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    label="Department"
                                    required
                                    sx={{ '& .MuiOutlinedInput-root': { borderColor: errors.department ? 'red' : formData.department ? 'green' : '' } }}
                                >
                                    <MenuItem value="ArcTIC">Architecture IT & Cloud Computing</MenuItem>
                                    <MenuItem value="DS">Data Science</MenuItem>
                                    <MenuItem value="ERP/BI">Enterprise Resource Planning & Business Intelligence</MenuItem>
                                    <MenuItem value="Gamix">Gaming & Immersive eXperience</MenuItem>
                                    <MenuItem value="InFini">Informatique Financière Et Ingénierie</MenuItem>
                                    <MenuItem value="NIDS">Network Infrastructure and Data Security</MenuItem>
                                    <MenuItem value="SLEAM">Systèmes et Logiciels Embarqués Ambiants et Mobiles</MenuItem>
                                    <MenuItem value="SAE">Software Architecture Engineering</MenuItem>
                                    <MenuItem value="SE">Software Engineering</MenuItem>
                                    <MenuItem value="SIM">Systèmes Informatiques et Mobiles</MenuItem>
                                    <MenuItem value="TWIN">Technologies du Web et de l’Internet</MenuItem>
                                </Select>
                                {errors.department && <Typography variant="caption" color="error">{errors.department}</Typography>}
                            </FormControl>
                        )}
                        <StyledButton
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            sx={{
                                color: 'white',
                                mt: 2
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

                {generalError && (
                    <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                        {generalError}
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