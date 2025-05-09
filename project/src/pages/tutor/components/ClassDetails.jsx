import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  LinearProgress,
  Alert,
  Divider,
  Grid,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon, Search } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { fetchClassById } from '../../../api/classApi';

// Custom styled components
const RedGradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
  color: theme.palette.common.white,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.light} 90%)`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const ClassDetails = () => {
  const theme = useTheme();
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchClassById(classId);
      setClassDetails(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching class details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/tutor/classes');
  };

  const handleViewStudent = (studentId) => {
    navigate(`/tutor/students/${studentId}`);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const getProfileImageUrl = (user) => {
    if (!user) return null;
    if (user.profilePicture || user.faceImage || user.avatar) {
      const imagePath = user.profilePicture || user.faceImage || user.avatar;
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else {
        return `http://localhost:5001${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      }
    }
    return null;
  };

  const filteredStudents = classDetails?.students?.filter((student) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (student.firstName || '').toLowerCase().includes(query) ||
      (student.lastName || '').toLowerCase().includes(query) ||
      (student.email || '').toLowerCase().includes(query)
    );
  }) || [];

  if (loading) {
    return (
      <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading class details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
        <Alert severity="error">{error}</Alert>
        <RedGradientButton onClick={handleBack} sx={{ mt: 2 }} aria-label="Back to classes">
          Back to Classes
        </RedGradientButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
          boxShadow: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ color: 'white', mr: 2 }} aria-label="Back to classes">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Class Details: {classDetails?.name || 'Unknown'}
            </Typography>
          </Box>
        </Box>
        <TextField
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search students..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: 'white',
            borderRadius: 1,
            '& .MuiInputBase-root': {
              height: 35,
            },
            '& .MuiInputBase-input': {
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
            },
          }}
        />
      </Box>

      {/* Main Content */}
      {classDetails && (
        <Paper sx={{ p: 4, boxShadow: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4">{classDetails.name}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {classDetails.description || 'No description provided'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">Class Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">
                    {classDetails.createdBy ? `${classDetails.createdBy.firstName} ${classDetails.createdBy.lastName}` : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">
                    {new Date(classDetails.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Number of Students</Typography>
                  <Typography variant="body1">{classDetails.students.length}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">Students</Typography>
              {filteredStudents.length === 0 ? (
                <Typography sx={{ mt: 2 }}>
                  {searchQuery ? `No students found matching "${searchQuery}"` : 'No students assigned to this class.'}
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: theme.palette.error.light }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CIN</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Education Level</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <StyledTableRow key={student._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                src={getProfileImageUrl(student)}
                                alt={`${student.firstName} ${student.lastName}`}
                                sx={{
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  bgcolor: theme.palette.error.main,
                                  background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
                                  color: 'white',
                                }}
                              >
                                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                              </Avatar>
                              <Typography>{student.firstName} {student.lastName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.cin || 'Not provided'}</TableCell>
                          <TableCell>
                            <Chip
                              label={student.educationLevel || 'BEGINNER'}
                              size="small"
                              color={
                                student.educationLevel === 'ADVANCED' ? 'success' :
                                student.educationLevel === 'INTERMEDIATE' ? 'primary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                onClick={() => handleViewStudent(student._id)}
                                size="small"
                                aria-label={`View details for ${student.firstName} ${student.lastName}`}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default ClassDetails;