import { Box, Typography, Paper, Grid } from '@mui/material';
import { useOutletContext } from 'react-router-dom';

const TutorDashboard = () => {
  const { user } = useOutletContext();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#dd2825', fontWeight: 'bold' }}>
        Tutor Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              bgcolor: 'white',
              border: '1px solid #eaeaea'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
              Welcome to your Tutor Portal
            </Typography>
            <Typography variant="body1">
              Here you can monitor student projects, evaluate tasks, and provide guidance.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              bgcolor: 'white',
              border: '1px solid #eaeaea'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
              Your Profile
            </Typography>
            {user && (
              <Box>
                <Typography variant="body1">
                  <strong>Name:</strong> {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {user.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Role:</strong> {user.userRole}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TutorDashboard; 