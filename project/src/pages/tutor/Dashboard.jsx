import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { fetchAllProjects } from '../../api/projectApi';
import { useOutletContext } from 'react-router-dom'; // Add this import

const TutorDashboard = () => {
  const { user } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    recommended: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const projectsData = await fetchAllProjects('TUTOR');
        setProjects(projectsData);
        
        // Calculate stats
        const total = projectsData.length;
        const recommended = projectsData.filter(p => p.approvalStatus === 'RECOMMENDED').length;
        const approved = projectsData.filter(p => p.approvalStatus === 'APPROVED').length;
        const rejected = projectsData.filter(p => p.approvalStatus === 'REJECTED').length;
        
        setStats({ total, recommended, approved, rejected });
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);

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

        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'white',
              border: '1px solid #eaeaea'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
              Projects Overview
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="h4" sx={{ color: '#dd2825' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2">Total Projects</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                    <Typography variant="h4" sx={{ color: '#ff9800' }}>
                      {stats.recommended}
                    </Typography>
                    <Typography variant="body2">Pending Approval</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                    <Typography variant="h4" sx={{ color: '#4caf50' }}>
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2">Approved</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                    <Typography variant="h4" sx={{ color: '#f44336' }}>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2">Rejected</Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TutorDashboard; 