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
  FormControlLabel,
  useTheme,
  styled,
  InputAdornment
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fetchClasses } from '../../api/classApi';
import {
  Person,
  Email,
  Lock,
  School,
  Class,
  Cake,
  Engineering,
  AssignmentInd,
  Grade,
  CorporateFare
} from '@mui/icons-material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& label.Mui-focused': {
    color: theme.palette.error.main,
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
    },
    borderRadius: '8px'
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: `${theme.palette.error.main} !important`,
  },
  borderRadius: '8px'
}));

const UserFormDialog = ({ open, onClose, user, onSubmit, mode = 'create' }) => {
  const theme = useTheme();
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
    classe: null
  });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        ...user,
        password: '',
        classe: user.classe?._id || null
      });
    }
  }, [user, mode]);

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
    onSubmit(formData);
  };

  return (
      <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: theme.shadows[10]
            }
          }}
      >
        <DialogTitle
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: 'white',
              py: 2,
              fontSize: '1.5rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
        >
          <Engineering fontSize="large" />
          {mode === 'create' ? 'Create New User' : 'Edit User Profile'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 4, backgroundColor: '#fff5f5' }}>
            <Grid container spacing={3}>
              {/* First Name */}
              <Grid item xs={12} md={6}>
                <StyledTextField
                    required
                    fullWidth
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: theme.palette.error.main }} />
                          </InputAdornment>
                      )
                    }}
                    variant="outlined"
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} md={6}>
                <StyledTextField
                    required
                    fullWidth
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: theme.palette.error.main }} />
                          </InputAdornment>
                      )
                    }}
                    variant="outlined"
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <StyledTextField
                    required
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: theme.palette.error.main }} />
                          </InputAdornment>
                      )
                    }}
                    variant="outlined"
                />
              </Grid>

              {/* Password (Create only) */}
              {mode === 'create' && (
                  <Grid item xs={12}>
                    <StyledTextField
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: theme.palette.error.main }} />
                              </InputAdornment>
                          )
                        }}
                        variant="outlined"
                    />
                  </Grid>
              )}

              {/* Role Selector */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: theme.palette.error.main }}>
                    User Role
                  </InputLabel>
                  <StyledSelect
                      name="userRole"
                      value={formData.userRole}
                      onChange={handleChange}
                      label="User Role"
                      startAdornment={<Engineering />}
                  >
                    <MenuItem value="STUDENT">
                      <AssignmentInd sx={{ mr: 1, color: theme.palette.error.main }} />
                      Student
                    </MenuItem>
                    <MenuItem value="TUTOR">
                      <School sx={{ mr: 1, color: theme.palette.error.main }} />
                      Tutor
                    </MenuItem>
                    <MenuItem value="ADMIN">
                      <Engineering sx={{ mr: 1, color: theme.palette.error.main }} />
                      Administrator
                    </MenuItem>
                  </StyledSelect>
                </FormControl>
              </Grid>

              {/* Birth Date Picker */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                      label="Birth Date"
                      value={formData.birthDate}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          InputProps: {
                            startAdornment: (
                                <InputAdornment position="start">
                                  <Cake sx={{ color: theme.palette.error.main }} />
                                </InputAdornment>
                            )
                          },
                          sx: {
                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${theme.palette.error.main} !important`
                            }
                          }
                        },
                      }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Student-specific fields */}
              {formData.userRole === 'STUDENT' && (
                  <>
                    {/* Education Level */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel sx={{ color: theme.palette.error.main }}>
                          Education Level
                        </InputLabel>
                        <StyledSelect
                            name="educationLevel"
                            value={formData.educationLevel}
                            onChange={handleChange}
                            label="Education Level"
                        >
                          <MenuItem value="BEGINNER">
                            <Grade sx={{ mr: 1, color: theme.palette.error.main }} />
                            Beginner
                          </MenuItem>
                          <MenuItem value="INTERMEDIATE">
                            <Grade sx={{ mr: 1, color: theme.palette.error.main }} />
                            Intermediate
                          </MenuItem>
                          <MenuItem value="ADVANCED">
                            <Grade sx={{ mr: 1, color: theme.palette.error.main }} />
                            Advanced
                          </MenuItem>
                        </StyledSelect>
                      </FormControl>
                    </Grid>

                    {/* CIN Number */}
                    <Grid item xs={12} md={6}>
                      <StyledTextField
                          required
                          fullWidth
                          name="cin"
                          label="National ID (CIN)"
                          value={formData.cin}
                          onChange={handleChange}
                          inputProps={{ maxLength: 8 }}
                          helperText="Mandatory national identification number"
                          InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                  <AssignmentInd sx={{ color: theme.palette.error.main }} />
                                </InputAdornment>
                            )
                          }}
                      />
                    </Grid>

                    {/* Class Assignment */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: theme.palette.error.main }}>
                          Class Assignment
                        </InputLabel>
                        <StyledSelect
                            name="classe"
                            value={formData.classe || ''}
                            onChange={handleChange}
                            label="Class Assignment"
                        >
                          <MenuItem value="">
                            <CorporateFare sx={{ mr: 1, color: theme.palette.error.main }} />
                            Unassigned
                          </MenuItem>
                          {classes.map(classItem => (
                              <MenuItem key={classItem._id} value={classItem._id}>
                                <Class sx={{ mr: 1, color: theme.palette.error.main }} />
                                {classItem.name}
                              </MenuItem>
                          ))}
                        </StyledSelect>
                      </FormControl>
                    </Grid>
                  </>
              )}

              {/* Department */}
              <Grid item xs={12}>
                <StyledTextField
                    fullWidth
                    name="department"
                    label="Department"
                    value={formData.department}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                          <InputAdornment position="start">
                            <CorporateFare sx={{ color: theme.palette.error.main }} />
                          </InputAdornment>
                      )
                    }}
                />
              </Grid>

              {/* Account Status Switch */}
              <Grid item xs={12}>
                <FormControlLabel
                    control={
                      <Switch
                          checked={formData.accountStatus}
                          onChange={handleChange}
                          name="accountStatus"
                          color="error"
                      />
                    }
                    label="Active Account"
                    sx={{ '& .MuiFormControlLabel-label': { fontWeight: 500 } }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 4, py: 2, backgroundColor: '#fff5f5' }}>
            <Button
                onClick={onClose}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light,
                    borderColor: theme.palette.error.dark
                  }
                }}
            >
              Cancel
            </Button>
            <Button
                type="submit"
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  color: 'white',
                  '&:hover': {
                    opacity: 0.9,
                    background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                  }
                }}
            >
              {mode === 'create' ? 'Create User' : 'Update Profile'}
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
    department: PropTypes.string,
    classe: PropTypes.any
  })
};

UserFormDialog.defaultProps = {
  mode: 'create',
  user: null
};

export default UserFormDialog;