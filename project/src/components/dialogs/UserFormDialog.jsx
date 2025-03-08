// src/components/dialogs/UserFormDialog.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
const UserFormDialog = ({ open, onClose, user, onSubmit, mode = 'create' }) => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      userRole: 'STUDENT',
      accountStatus: true,
      birthDate: null,
      educationLevel: 'BEGINNER',
      department: '',
      cin: '',
      classe: '--'
    });
  
    useEffect(() => {
      if (user && mode === 'edit') {
        setFormData({
          ...user,
          password: '' // Don't populate password in edit mode
        });
      }
    }, [user, mode]);
  
    const handleChange = (event) => {
      const { name, value, checked } = event.target;
      setFormData(prev => ({
        ...prev,
        [name]: name === 'accountStatus' ? checked : value
      }));
    };
  
    const handleDateChange = (date) => {
      setFormData(prev => ({
        ...prev,
        birthDate: date
      }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };
  
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'create' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              {mode === 'create' && (
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Grid>
              )}
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleChange}
                    label="Role"
                  >
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="TUTOR">Tutor</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Birth Date"
                    value={formData.birthDate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              {formData.userRole === 'STUDENT' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Education Level</InputLabel>
                      <Select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        label="Education Level"
                      >
                        <MenuItem value="BEGINNER">Beginner</MenuItem>
                        <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                        <MenuItem value="ADVANCED">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      name="cin"
                      label="CIN (Carte d'Identité Nationale)"
                      value={formData.cin}
                      onChange={handleChange}
                      inputProps={{ maxLength: 8 }}
                      helperText="Numéro d'identité nationale (obligatoire pour les étudiants)"
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="department"
                  label="Department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.accountStatus}
                      onChange={handleChange}
                      name="accountStatus"
                    />
                  }
                  label="Account Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {mode === 'create' ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  };

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  user: PropTypes.shape({
    idUser: PropTypes.number,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    accountStatus: PropTypes.bool,
    birthDate: PropTypes.instanceOf(Date),
    educationLevel: PropTypes.string,
    department: PropTypes.string
  })
};

UserFormDialog.defaultProps = {
  mode: 'create',
  user: null
};

export default UserFormDialog;