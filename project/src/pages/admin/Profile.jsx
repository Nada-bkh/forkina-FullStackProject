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
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Person as PersonIcon } from '@mui/icons-material';
import EditProfileDialog from '../../components/dialogs/EditProfileDialog';
import { useNavigate, useOutletContext } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const Profile = () => {
  const { user, updateUser } = useOutletContext();
  const [error, setError] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to signin');
      navigate('/signin');
      return null;
    }
    return token;
  };

  const fetchUserProfile = async () => {
    try {
      const token = checkToken();
      if (!token) return;

      console.log('Fetching profile with token:', token);

      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          console.log('Token invalid, clearing and redirecting');
          localStorage.removeItem('token');
          navigate('/signin');
          return;
        }
        throw new Error(data.message || 'Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      updateUser(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
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

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleProfileUpdate = (updatedUser) => {
    updateUser(updatedUser);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!user) {
    return <Alert severity="info">Loading profile...</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Profile</Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Profile Info */}
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              {user.profilePicture || user.faceImage ? (
                <Avatar 
                  src={`http://localhost:5001${user.profilePicture || user.faceImage}`}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2, 
                    bgcolor: '#dd2825' 
                  }}
                >
                  {user.firstName?.charAt(0)}
                </Avatar>
              )}
              <Typography variant="h6">{`${user.firstName} ${user.lastName}`}</Typography>
              <Typography color="textSecondary">{user.userRole}</Typography>
            </Box>
            
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleEditClick}
              sx={{ 
                bgcolor: '#dd2825',
                '&:hover': { bgcolor: 'rgba(221, 40, 37, 0.9)' },
                color: 'white'
              }}
            >
              Edit Profile
            </Button>
          </StyledPaper>
        </Grid>

        {/* Right column - Detailed Info */}
        <Grid item xs={12} md={8}>
          <StyledPaper>
            <Typography variant="h6" sx={{ mb: 2 }}>Profile Details</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="First Name" 
                  secondary={user.firstName} 
                  primaryTypographyProps={{ color: 'textSecondary' }}
                />
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText 
                  primary="Last Name" 
                  secondary={user.lastName} 
                  primaryTypographyProps={{ color: 'textSecondary' }}
                />
              </ListItem>
              <Divider />

              <ListItem>
                <ListItemText 
                  primary="Email" 
                  secondary={user.email} 
                  primaryTypographyProps={{ color: 'textSecondary' }}
                />
              </ListItem>
              <Divider />

              {user.userRole === 'STUDENT' && (
                <>
                  <ListItem>
                    <ListItemText 
                      primary="CIN" 
                      secondary={user.cin || 'Non renseigné'} 
                      primaryTypographyProps={{ color: 'textSecondary' }}
                    />
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Classe" 
                      secondary={user.classe || '--'} 
                      primaryTypographyProps={{ color: 'textSecondary' }}
                    />
                  </ListItem>
                  <Divider />
                </>
              )}

              <ListItem>
                <ListItemText 
                  primary="Role" 
                  secondary={user.userRole} 
                  primaryTypographyProps={{ color: 'textSecondary' }}
                />
              </ListItem>
              <Divider />
              
              {user.userRole === 'STUDENT' && (
                <>
                  <ListItem>
                    <ListItemText 
                      primary="Education Level" 
                      secondary={user.educationLevel || 'Beginner'} 
                      primaryTypographyProps={{ color: 'textSecondary' }}
                    />
                  </ListItem>
                  <Divider />
                </>
              )}
              
              <ListItem>
                <ListItemText 
                  primary="Account Status" 
                  secondary={user.accountStatus ? 'Active' : 'Inactive'} 
                  primaryTypographyProps={{ color: 'textSecondary' }}
                />
              </ListItem>
            </List>
          </StyledPaper>
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