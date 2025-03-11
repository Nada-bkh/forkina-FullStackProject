// src/components/dialogs/UserDetailsDialog.jsx
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';

const LabelValue = ({ label, value, chip }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    {chip ? (
      <Chip 
        label={value} 
        color={chip.color} 
        size="small" 
        sx={{ mt: 0.5 }}
      />
    ) : (
      <Typography variant="body1">{value || 'Not specified'}</Typography>
    )}
  </Box>
);

LabelValue.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  chip: PropTypes.shape({
    color: PropTypes.string
  })
};

const UserDetailsDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  const getRoleColor = (role) => {
    if (!role) return 'default';
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case 'ADMIN': return 'error';
      case 'TUTOR': return 'warning';
      case 'STUDENT': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        User Details
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="h6">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                ID: {user._id}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Informations de base
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LabelValue label="Email" value={user.email} />
            <LabelValue
            label="Role" value={user.userRole} chip={{ color: getRoleColor(user.userRole) }} />
            <LabelValue label="Account Status" value={user.accountStatus ? 'Active' : 'Inactive'} chip={{ color: user.accountStatus ? 'success' : 'error' }} />
            </Grid>
            <Grid item xs={12} md={6}>
            <LabelValue label="Birth Date" value={user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'Not provided'} />
            <LabelValue label="Department" value={user.department} />
            </Grid>
            
            {user.userRole === 'STUDENT' && (
            <>
            <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Academic Information
            </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
            <LabelValue label="Education Level" value={user.educationLevel || 'BEGINNER'} chip={{
            color: user.educationLevel === 'ADVANCED' ? 'success' :
            user.educationLevel === 'INTERMEDIATE' ? 'primary' : 'default'
            }} />
            <LabelValue label="CIN" value={user.cin} />
            </Grid>
            <Grid item xs={12} md={6}>
            <LabelValue label="Class" value={user.classe?.name || 'Not assigned'} />
            </Grid>
            </>
            )}
            
            <Grid item xs={12}> <Divider sx={{ mb: 2 }} /> <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}> Account Information </Typography> </Grid> <Grid item xs={12} md={6}> <LabelValue label="Created At" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'} /> <LabelValue label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'} /> </Grid> <Grid item xs={12} md={6}> <LabelValue label="Email Verified" value={user.isEmailVerified ? 'Verified' : 'Not verified'} chip={{ color: user.isEmailVerified ? 'success' : 'warning' }} /> </Grid> </Grid> </DialogContent> <DialogActions> <Button onClick={onClose}>Close</Button> </DialogActions> </Dialog> ); };
            UserDetailsDialog.propTypes = {
            open: PropTypes.bool.isRequired,
            onClose: PropTypes.func.isRequired,
            user: PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            email: PropTypes.string,
            userRole: PropTypes.string,
            accountStatus: PropTypes.bool,
            birthDate: PropTypes.string,
            educationLevel: PropTypes.string,
            department: PropTypes.string,
            cin: PropTypes.string,
            classe: PropTypes.any,
            createdAt: PropTypes.string,
            lastLogin: PropTypes.string,
            isEmailVerified: PropTypes.bool
            })
            };
            
            export default UserDetailsDialog;