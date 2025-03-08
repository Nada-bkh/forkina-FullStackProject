import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Box, Typography, TextField, Button, Paper, Alert } from "@mui/material";
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

const ResetPassword = () => {
  const { token } = useParams(); // Retrieve the token from the URL
  const navigate = useNavigate(); // Initialize useNavigate for redirection
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async (event) => {
    event.preventDefault(); // Prevent page reload
    
    // Password validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setMessage("");  // Reset message if error occurs
      return;
    }
  
    try {
      // Sending POST request with axios
      const response = await axios.post("http://localhost:5001/api/auth/reset-password/", {
        token, // Pass the token in the request body
        newPassword,
      });
  
      // Handling response
      setMessage(response.data.message || "Password reset successfully");
      setError(""); // Reset errors

      // Redirect to Sign In page after success
      setTimeout(() => {
        navigate('/signin'); // Redirect after a short delay to allow message display
      }, 2000); // Wait 2 seconds before redirecting
    } catch (err) {
      console.error("Error during password reset:", err);  // Log error for inspection
      
      // Check if the response exists and display it
      if (err.response) {
        console.error("Error with the response:", err.response);
        setError(err.response?.data?.message || "Error during password reset");
      } else if (err.request) {
        // If the request was sent but no response received
        console.error("Request error:", err.request);
        setError("Server connection issue");
      } else {
        // Other errors
        console.error("General error:", err.message);
        setError("An error occurred");
      }
      setMessage("");  // Reset message
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        {/* Centered Logo */}
        <Box component="div" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '70px', width: 'auto' }} />
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}
        
        <form onSubmit={handlePasswordReset} style={{ width: '100%' }}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />
          <StyledButton type="submit" variant="contained" color="primary" fullWidth sx={{
            color: 'white'     // Text color set to white
          }}>
            Reset
          </StyledButton>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Return to <a href="/signin" style={{ textDecoration: 'none', color: '#dd2825' }}>Sign In</a>
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default ResetPassword;
