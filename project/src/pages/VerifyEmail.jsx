import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button, Paper, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";

// Styled components
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
      backgroundColor: 'rgba(221, 40, 37, 0.7)',
    },
  },
}));

const VerifyEmail = () => {
  const { token } = useParams(); // Retrieve the token from the URL
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/auth/verify-email/${token}`);
        setMessage(response.data.message); // Set success message
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed"); // Set error message
      }
    };

    verifyEmailToken(); // Call the function to verify the token
  }, [token]); // Run this effect when the token changes

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        {/* Centered Logo */}
        <Box component="div" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '70px', width: 'auto' }} />
        </Box>
        
        {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Return to <a href="/signin" style={{ textDecoration: 'none', color: '#dd2825' }}>Sign In</a>
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default VerifyEmail;