
import { useState, useEffect } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';
import { isAuthenticated } from '../utils/authUtils';
import FaceLogin from '../components/FaceLogin';
import FaceIcon from '@mui/icons-material/Face';

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
  Alert,
  Dialog
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import { Link as RouterLink } from 'react-router-dom';

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
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [remainingTime, setRemainingTime] = useState({ minutes: 0, seconds: 0 });
  const [showFaceLogin, setShowFaceLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    // Si le compte est bloqué, mettre à jour le blockedUntil toutes les secondes
    let interval;
    if (blockedUntil) {
      // Mettre à jour le temps restant immédiatement
      updateRemainingTime();
      
      // Puis lancer l'intervalle pour mettre à jour chaque seconde
      interval = setInterval(() => {
        if (blockedUntil && blockedUntil < Date.now()) {
          setBlockedUntil(null);
          setRemainingAttempts(3);
          clearInterval(interval);
        } else {
          updateRemainingTime();
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [blockedUntil]);

  // Fonction pour calculer et mettre à jour le temps restant
  const updateRemainingTime = () => {
    if (!blockedUntil) return;
    
    const timeLeft = blockedUntil - Date.now();
    if (timeLeft <= 0) {
      setRemainingTime({ minutes: 0, seconds: 0 });
      return;
    }
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    setRemainingTime({ minutes, seconds });
  };

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
    
    // Si le compte est bloqué, empêcher la soumission
    if (blockedUntil && blockedUntil > Date.now()) {
      return;
    }
    
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
        // Gestion spécifique pour le cas de compte bloqué (status 429)
        if (response.status === 429) {
          setBlockedUntil(data.blockedUntil);
          setRemainingAttempts(0);
        } else if (data.remainingAttempts !== undefined) {
          // Mettre à jour le nombre de tentatives restantes
          setRemainingAttempts(data.remainingAttempts);
        }
        
        throw new Error(data.message || 'Failed to login');
      }

      // Réinitialiser les tentatives après un login réussi
      setRemainingAttempts(3);
      setBlockedUntil(null);

      // Save token
      localStorage.setItem('token', data.token);
      
      // Redirection basée sur le rôle de l'utilisateur
      const userRole = data.user.role;
      if (userRole === 'ADMIN') {
        navigate('/admin');
      } else if (userRole === 'STUDENT') {
        navigate('/student');
      } else if (userRole === 'TUTOR') {
        navigate('/tutor');
      } else {
        // Default fallback
        navigate('/admin');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  const handleFaceLogin = () => {
    setShowFaceLogin(true);
  };

  const handleCancelFaceLogin = () => {
    setShowFaceLogin(false);
  };

  const handleFaceLoginSuccess = (data) => {
    // Save token
    localStorage.setItem('token', data.token);
    
    // Close the dialog
    setShowFaceLogin(false);
    
    // Redirect to admin dashboard
    navigate('/admin');
  };

  const googleLogin = () => {
    window.location.href = "http://localhost:5001/auth/google";
  };

  const githubLogin = () => {
    window.open(
      "http://localhost:5001/auth/github",
      "_self"
    );
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
        {blockedUntil && blockedUntil > Date.now() && (
          <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
            <div>
              <strong>Compte temporairement bloqué</strong>
              <div>
                Après 3 tentatives infructueuses, votre compte est bloqué pendant 2 minutes.
              </div>
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '5px 12px', 
                    background: '#f3f3f3',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: '#dd2825'
                  }}>
                    {remainingTime.minutes}:{remainingTime.seconds < 10 ? `0${remainingTime.seconds}` : remainingTime.seconds}
                  </div>
                </div>
                <div>
                  Réessayez après lexpiration du délai ou{' '}
                  <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ fontWeight: 'bold' }}>
                    réinitialisez votre mot de passe
                  </Link>.
                </div>
              </div>
            </div>
          </Alert>
        )}
        {!blockedUntil && remainingAttempts < 3 && remainingAttempts > 0 && (
          <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
            {remainingAttempts === 1 ? (
              <strong>Attention ! Dernière tentative avant blocage temporaire du compte.</strong>
            ) : (
              <div>Il vous reste {remainingAttempts} tentatives avant le blocage temporaire du compte.</div>
            )}
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
            disabled={blockedUntil && blockedUntil > Date.now()}
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
            disabled={blockedUntil && blockedUntil > Date.now()}
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
  sx={{ mt: 2, mb: 2 }}
  disabled={blockedUntil && blockedUntil > Date.now()}
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
            startIcon={<FaceIcon />}
            onClick={handleFaceLogin}
            sx={{ mb: 2 }}
          >
            Sign in with Face Recognition
          </StyledButton>

          <StyledButton
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={googleLogin}
          >
            Sign in using Google
          </StyledButton>

          <StyledButton
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={githubLogin}
            style={{ marginTop: '1px' }}
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

      {/* Face Login Dialog */}
      <Dialog 
        open={showFaceLogin} 
        onClose={handleCancelFaceLogin}
        fullWidth
        maxWidth="sm"
      >
        <FaceLogin 
          onLogin={handleFaceLoginSuccess} 
          onCancel={handleCancelFaceLogin} 
        />
      </Dialog>
    </Container>
  );
};

export default SignIn;