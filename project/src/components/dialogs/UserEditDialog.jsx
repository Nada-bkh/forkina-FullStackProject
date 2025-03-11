// src/components/dialogs/UserEditDialog.jsx
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
import dayjs from 'dayjs';
import { fetchClasses } from '../../api/classApi';

const UserEditDialog = ({ open, onClose, user, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userRole: 'STUDENT',
    accountStatus: true,
    birthDate: null,
    educationLevel: 'BEGINNER',
    department: '',
    cin: '',
    classe: null
  });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        birthDate: user.birthDate ? dayjs(user.birthDate) : null,
        classe: user.classe?._id || null
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        const data = await fetchClasses();
        setClasses(data);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchAllClasses();
  }, []);

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
    const submitData = {
      ...formData,
      birthDate: formData.birthDate ? formData.birthDate.format('YYYY-MM-DD') : null,
      _id: user._id
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
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
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    name="cin"
                    label="CIN (Carte d'Identité Nationale)"
                    value={formData.cin || ''}
                    onChange={handleChange}
                    inputProps={{ maxLength: 8 }}
                    helperText="Numéro d'identité nationale de l'étudiant"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="classe"
                      value={formData.classe || ''}
                      onChange={handleChange}
                      label="Class"
                    >
                      <MenuItem value="">Not Assigned</MenuItem>
                      {classes.map(classItem => (
                        <MenuItem key={classItem._id} value={classItem._id}>
                          {classItem.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

UserEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
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
    classe: PropTypes.any
  })
};

export default UserEditDialog;