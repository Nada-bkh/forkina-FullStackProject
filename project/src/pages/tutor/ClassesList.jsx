// src/pages/tutor/ClassesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { fetchClasses } from '../../api/classApi';

const ClassesList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTutorClasses();
  }, []);

  const fetchTutorClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (classId) => {
    navigate(`/tutor/classes/${classId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>
        My Classes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LinearProgress />
      ) : classes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No Classes Assigned</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            You are not assigned to any classes yet. Please contact the admin.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Class Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Number of Students</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem._id} hover>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.description || 'No description'}</TableCell>
                  <TableCell>{classItem.students.length}</TableCell>
                  <TableCell>
                    {classItem.createdBy ? `${classItem.createdBy.firstName} ${classItem.createdBy.lastName}` : 'Unknown'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => handleViewDetails(classItem._id)}
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
    </Box>
  );
};

export default ClassesList;