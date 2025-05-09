import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Box, Typography, Button, Paper, Alert, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Enhanced styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  width: '100%',
  maxWidth: '450px',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.75),
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  '&.MuiButton-containedPrimary': {
    backgroundColor: '#dd2825',
    boxShadow: '0 4px 14px rgba(221, 40, 37, 0.3)',
    '&:hover': {
      backgroundColor: '#c82321',
      boxShadow: '0 6px 20px rgba(221, 40, 37, 0.4)',
      transform: 'translateY(-2px)',
    },
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: '#dd2825',
  marginBottom: theme.spacing(2),
  textAlign: 'center',
}));

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/auth/verify-email/${token}`);
        setMessage(response.data.message);
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    verifyEmailToken();
  }, [token]);

  return (
    <Container 
      component="main" 
      maxWidth={false}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
        background: 'linear-gradient(135deg, #f5f5f5 0%, #f9f9f9 100%)',
      }}
    >
      <StyledPaper elevation={6}>
        {/* Logo with improved styling */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 4,
          '& img': {
            height: '80px',
            width: 'auto',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }
        }}>
          <img src="/logo.png" alt="Logo" />
        </Box>
        
        {/* Title */}
        <Title variant="h4">
          {isLoading ? 'Verifying Email...' : (message ? 'Email Verified!' : 'Verification Failed')}
        </Title>
        
        {/* Status icon */}
        <Box sx={{ 
          mb: 3,
          color: message ? '#4caf50' : '#f44336',
          fontSize: '4rem',
          display: 'flex',
        }}>
          {isLoading ? (
            <Box sx={{ 
              width: 60, 
              height: 60, 
              border: '4px solid #dd2825',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              }
            }} />
          ) : message ? (
            <CheckCircleOutlineIcon fontSize="inherit" />
          ) : (
            <ErrorOutlineIcon fontSize="inherit" />
          )}
        </Box>
        
        {/* Message content */}
        <Box sx={{ 
          width: '100%', 
          textAlign: 'center',
          mb: 3,
        }}>
          {isLoading ? (
            <Typography variant="body1" color="textSecondary">
              Please wait while we verify your email address...
            </Typography>
          ) : message ? (
            <>
              <Alert 
                severity="success" 
                icon={false}
                sx={{ 
                  mb: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  color: '#2e7d32',
                  borderRadius: '12px',
                  fontWeight: 500,
                }}
              >
                {message}
              </Alert>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Your email has been successfully verified. You can now sign in to your account.
              </Typography>
            </>
          ) : (
            <>
              <Alert 
                severity="error" 
                icon={false}
                sx={{ 
                  mb: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#d32f2f',
                  borderRadius: '12px',
                  fontWeight: 500,
                }}
              >
                {error}
              </Alert>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Please try again or contact support if the problem persists.
              </Typography>
            </>
          )}
        </Box>
        
        {/* Divider */}
        <Divider sx={{ 
          width: '100%', 
          my: 3, 
          borderColor: 'rgba(0, 0, 0, 0.08)' 
        }} />
        
        {/* Action buttons */}
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}>
          <StyledButton
            fullWidth
            variant="contained"
            color="primary"
            href="/signin"
          >
            Go to Sign In
          </StyledButton>
          
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 2,
            '& a': {
              color: '#dd2825',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              }
            }
          }}>
        A    Need help? <a href="/contact">Contact support</a>
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default VerifyEmail;