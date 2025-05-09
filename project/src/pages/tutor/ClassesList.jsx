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
  Tooltip,
  Button,
  useTheme,
} from '@mui/material';
import { Visibility as VisibilityIcon, Refresh } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { fetchClasses } from '../../api/classApi';

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

const ClassesList = () => {
  const theme = useTheme();
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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            My Classes
          </Typography>
          <RedGradientButton onClick={fetchTutorClasses} startIcon={<Refresh />} aria-label="Refresh classes">
            Refresh
          </RedGradientButton>
        </Box>
      </Box>

      {/* Main Content */}
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Paper sx={{ p: 3, boxShadow: 3 }}>
          <Alert severity="error">{error}</Alert>
          <RedGradientButton onClick={fetchTutorClasses} startIcon={<Refresh />} sx={{ mt: 2 }} aria-label="Retry fetch classes">
            Retry
          </RedGradientButton>
        </Paper>
      ) : classes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', boxShadow: 3 }}>
          <Typography variant="h6">No Classes Assigned</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            You are not assigned to any classes yet. Please contact the admin.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.error.light }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Number of Students</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created By</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <StyledTableRow key={classItem._id}>
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
                        aria-label="View class details"
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
    </Box>
  );
};

export default ClassesList;