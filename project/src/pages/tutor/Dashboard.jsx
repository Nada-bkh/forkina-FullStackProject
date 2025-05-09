import { Box, Typography, Paper, Grid, CircularProgress, Chip, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { fetchAllProjects } from '../../api/projectApi';
import { useOutletContext } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Assignment, CheckCircle, PendingActions, Cancel } from '@mui/icons-material';

// Custom styled components
const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  height: '100%',
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f5f5f5 100%)`,
  borderLeft: `6px solid ${theme.palette.error.main}`,
}));

const TutorDashboard = () => {
  const theme = useTheme();
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.error.main,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Assignment fontSize="large" />
          Tutor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Overview of your projects and activities
        </Typography>
      </Box>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12} md={6}>
          <WelcomeCard elevation={3}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.error.main }}>
              Welcome, {user?.firstName}!
            </Typography>
            <Typography variant="body1" paragraph>
              Here you can monitor student projects, evaluate tasks, and provide guidance to your teams.
            </Typography>
            <Chip 
              label={`Tutor since ${new Date(user?.createdAt).getFullYear()}`} 
              color="error" 
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          </WelcomeCard>
        </Grid>
        
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f5f5f5 100%)`,
              borderLeft: `6px solid ${theme.palette.error.light}`,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.error.main }}>
              Your Profile
            </Typography>
            {user && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography>{user.firstName} {user.lastName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography>{user.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                  <Chip label={user.userRole} color="error" size="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={user.accountStatus ? 'Active' : 'Inactive'} 
                    color={user.accountStatus ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Stats Section */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: '12px',
              background: theme.palette.background.paper,
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 2
            }}>
              <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
                Projects Overview
              </Typography>
              <Chip 
                label={`Last updated: ${new Date().toLocaleTimeString()}`} 
                size="small" 
                color="default"
                variant="outlined"
              />
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress color="error" />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard elevation={2}>
                    <Typography variant="h2" sx={{ color: theme.palette.error.main, mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="subtitle1">Total Projects</Typography>
                    <Typography variant="caption" color="text.secondary">
                      All assigned projects
                    </Typography>
                  </StatCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard elevation={2}>
                    <PendingActions fontSize="large" sx={{ color: theme.palette.warning.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ color: theme.palette.warning.main, mb: 1 }}>
                      {stats.recommended}
                    </Typography>
                    <Typography variant="subtitle1">Pending Approval</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Awaiting admin review
                    </Typography>
                  </StatCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard elevation={2}>
                    <CheckCircle fontSize="large" sx={{ color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ color: theme.palette.success.main, mb: 1 }}>
                      {stats.approved}
                    </Typography>
                    <Typography variant="subtitle1">Approved</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active projects
                    </Typography>
                  </StatCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard elevation={2}>
                    <Cancel fontSize="large" sx={{ color: theme.palette.error.light, mb: 1 }} />
                    <Typography variant="h4" sx={{ color: theme.palette.error.light, mb: 1 }}>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="subtitle1">Rejected</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Needs revision
                    </Typography>
                  </StatCard>
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