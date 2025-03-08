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
  value: PropTypes.string,
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
              label="Role" 
              value={user.userRole || 'N/A'} 
              chip={{
                color: getRoleColor(user.userRole)
              }}
            />
            <LabelValue 
              label="Account Status" 
              value={user.accountStatus ? 'Active' : 'Inactive'} 
              chip={{
                color: user.accountStatus ? 'success' : 'error'
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LabelValue 
              label="Birth Date" 
              value={user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'} 
            />
            <LabelValue label="Department" value={user.department} />
            {user.userRole === 'STUDENT' && (
              <LabelValue label="Education Level" value={user.educationLevel} />
            )}
          </Grid>
          
          {user.userRole === 'STUDENT' && (
            <>
        
              <Grid item xs={12} md={6}>
                <LabelValue 
                  label="CIN" 
                  value={user.cin || 'Non renseigné'} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LabelValue 
                  label="Classe" 
                  value={user.classe === '--' ? 'Non affecté' : user.classe || 'Non affecté'} 
                  chip={user.classe === '--' ? { color: 'warning' } : null}
                />
              </Grid>
            </>
          )}
          
          {user.isGoogleUser && (
            <Grid item xs={12}>
              <Chip 
                label="Google Account" 
                color="info" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Grid>
          )}
          
          {user.isGithubUser && (
            <Grid item xs={12}>
              <Chip 
                label="GitHub Account" 
                color="default" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

UserDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    userRole: PropTypes.string,
    accountStatus: PropTypes.bool,
    birthDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    educationLevel: PropTypes.string,
    department: PropTypes.string,
    cin: PropTypes.string,
    classe: PropTypes.string,
    isGoogleUser: PropTypes.bool,
    isGithubUser: PropTypes.bool
  })
};

export default UserDetailsDialog;