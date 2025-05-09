import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Edit, ArrowBack, Lock, LockOpen, Email, School, Badge, Person } from '@mui/icons-material';
import EditProfileDialog from '../../components/dialogs/EditProfileDialog';

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const DetailCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const Profile = () => {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return null;
    }
    return token;
  };

  const fetchUserProfile = async () => {
    try {
      const token = checkToken();
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/signin');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = checkToken();
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const handleEditClick = () => setIsEditDialogOpen(true);
  const handleEditClose = () => setIsEditDialogOpen(false);
  const handleProfileUpdate = (updatedUser) => setUser(updatedUser);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!user) {
    return <Alert severity="info">No profile data available.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
          My Profile
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <ProfileCard>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              {user.profilePicture || user.faceImage ? (
                <Avatar 
                  src={`http://localhost:5001${user.profilePicture || user.faceImage}`}
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    mb: 3,
                    border: `4px solid ${theme.palette.error.light}`
                  }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    mb: 3,
                    bgcolor: theme.palette.error.main,
                    fontSize: '3rem',
                    border: `4px solid ${theme.palette.error.light}`
                  }}
                >
                  {user.firstName?.charAt(0)}
                </Avatar>
              )}
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {`${user.firstName} ${user.lastName}`}
              </Typography>
              
              <Chip 
                label={user.userRole} 
                color="error" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Chip 
                icon={user.accountStatus ? <LockOpen /> : <Lock />}
                label={user.accountStatus ? 'Active' : 'Inactive'} 
                color={user.accountStatus ? 'success' : 'error'}
                variant="outlined"
                sx={{ mb: 3 }}
              />
            </Box>
            
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<Edit />}
              onClick={handleEditClick}
              sx={{ 
                background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
                color: 'white',
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.light} 90%)`,
                }
              }}
            >
              Edit Profile
            </Button>
          </ProfileCard>
        </Grid>

        {/* Details Card */}
        <Grid item xs={12} md={8}>
          <DetailCard>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                Personal Information
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Person color="action" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2">First Name</Typography>
                        </Box>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.firstName}
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <Divider sx={{ my: 1 }} />

                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Person color="action" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2">Last Name</Typography>
                        </Box>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.lastName}
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <Divider sx={{ my: 1 }} />

                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email color="action" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2">Email</Typography>
                        </Box>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.email}
                        </Typography>
                      } 
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} sm={6}>
  <List dense>
    {user.userRole === 'STUDENT' && (
      <>
        <ListItem sx={{ px: 0 }}>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Badge color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">CIN</Typography>
              </Box>
            } 
            secondary={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.cin || 'Not provided'}
              </Typography>
            } 
          />
        </ListItem>
        
        <Divider sx={{ my: 1 }} />

        <ListItem sx={{ px: 0 }}>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <School color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Class</Typography>
              </Box>
            } 
            secondary={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.classe || 'Not assigned'}
              </Typography>
            } 
          />
        </ListItem>
        
        <Divider sx={{ my: 1 }} />

        <ListItem sx={{ px: 0 }}>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <School color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Education Level</Typography>
              </Box>
            } 
            secondary={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.educationLevel || 'Beginner'}
              </Typography>
            } 
          />
        </ListItem>
      </>
    )}
  </List>
</Grid>
            </Grid>
          </DetailCard>
        </Grid>
      </Grid>

      <EditProfileDialog 
        open={isEditDialogOpen}
        onClose={handleEditClose}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </Box>
  );
};

export default Profile;