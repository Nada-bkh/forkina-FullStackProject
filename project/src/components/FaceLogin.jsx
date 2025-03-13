import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '500px',
  marginBottom: theme.spacing(2),
}));

const LoginButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  backgroundColor: '#dd2825',
  '&:hover': {
    backgroundColor: '#c81e1a',
  },
}));

// Simplified face login component
const FaceLogin = ({ onLogin, onCancel }) => {
  const videoRef = useRef();
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    startVideo();
    return () => {
      // Cleanup: stop camera when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }  // Prefer front camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting video:', error);
      setIsLoading(false);
      setError('Could not access camera. Please ensure camera permissions are enabled.');
    }
  };

  const handleVideoPlay = () => {
    setIsVideoReady(true);
  };

  const authenticateWithFace = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsAuthenticating(true);
      setError('');
      
      // Capture the face image
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg');
      });
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('faceImage', blob, 'face.jpg');
      
      // Send to server for authentication
      const response = await fetch('http://localhost:5001/api/face-detection/login', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Face authentication failed');
      }
      
      // Authentication successful, call the login callback
      if (onLogin) {
        onLogin(data);
      }
    } catch (error) {
      console.error('Face authentication error:', error);
      setError(error.message || 'Face authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h6" gutterBottom>
        Face Authentication
      </Typography>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <VideoContainer>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress />
          </Box>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoPlay}
          style={{ width: '100%', display: isLoading ? 'none' : 'block', borderRadius: '8px' }}
        />
      </VideoContainer>
      
      <Typography 
        variant="body2" 
        color="info.main"
        sx={{ mb: 2 }}
      >
        Look directly at the camera to authenticate your face.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isAuthenticating}
        >
          Cancel
        </Button>
        
        <LoginButton 
          variant="contained" 
          onClick={authenticateWithFace}
          disabled={!isVideoReady || isAuthenticating}
        >
          {isAuthenticating ? <CircularProgress size={24} color="inherit" /> : 'Login with Face'}
        </LoginButton>
      </Box>
    </StyledPaper>
  );
};

export default FaceLogin; 