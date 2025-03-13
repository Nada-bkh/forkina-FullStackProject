// src/pages/tutor/ClassDetails.jsx
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
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { fetchClassById } from '../../../api/classApi';

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    navigate(`/tutor/students/${studentId}`); // You may need to create a student details page if required
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading class details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={handleBack}>
          Back to Classes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          Class Details
        </Typography>
      </Box>

      {classDetails && (
        <Paper sx={{ p: 4 }}>
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
              {classDetails.students.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No students assigned to this class.</Typography>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Student</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>CIN</TableCell>
                        <TableCell>Education Level</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classDetails.students.map((student) => (
                        <TableRow key={student._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={getProfileImageUrl(student)}
                                alt={`${student.firstName} ${student.lastName}`}
                                sx={{ mr: 2, width: 40, height: 40 }}
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
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
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