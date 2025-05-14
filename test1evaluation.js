import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Snackbar,
  TextField,
  Avatar,
  useTheme,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Save as SaveIcon,
  Search as SearchIcon,
  School as StudentIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Custom styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  borderRadius: 4,
  backgroundColor: status ? theme.palette.success.light : theme.palette.error.light,
  color: status ? theme.palette.success.dark : theme.palette.error.dark,
  '& .MuiChip-icon': {
    color: status ? theme.palette.success.dark : theme.palette.error.dark,
  },
}));

const EvaluationGrid = () => {
  const theme = useTheme();
  const { teamId } = useParams();
  const [tasksWithEvaluation, setTasksWithEvaluation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluations, setEvaluations] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchTasks = async () => {
      try {
        // Simulate API response
        const data = [
          {
            _id: 'task1',
            title: 'Implement User Authentication',
            assignedTo: { _id: 'student1', name: 'Alice Johnson' },
            clarity: 4,
            commitFrequency: 3,
            deadlineRespect: 5,
            efficiency: 4,
            codePerformance: 4,
            plagiarismDetection: 1,
            collaboration: 5,
            testsValidation: 4,
            reportQuality: 4,
          },
          {
            _id: 'task2',
            title: 'Design Database Schema',
            assignedTo: { _id: 'student2', name: 'Bob Smith' },
            clarity: 5,
            commitFrequency: 4,
            deadlineRespect: 4,
            efficiency: 5,
            codePerformance: 5,
            plagiarismDetection: 1,
            collaboration: 5,
            testsValidation: 3,
            reportQuality: 5,
          },
          {
            _id: 'task3',
            title: 'Write Unit Tests',
            assignedTo: { _id: 'student1', name: 'Alice Johnson' },
            clarity: 4,
            commitFrequency: 3,
            deadlineRespect: 5,
            efficiency: 4,
            codePerformance: 4,
            plagiarismDetection: 1,
            collaboration: 5,
            testsValidation: 5,
            reportQuality: 3,
          },
        ];
        setTasksWithEvaluation(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tasks.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchTasks();
  }, [teamId]);

  useEffect(() => {
    // Initialize evaluations state based on fetched tasks
    const initialEvaluations = {};
    tasksWithEvaluation.forEach(task => {
      initialEvaluations[task._id] = {
        clarity: task.clarity || '',
        commitFrequency: task.commitFrequency || '',
        deadlineRespect: task.deadlineRespect || '',
        efficiency: task.efficiency || '',
        codePerformance: task.codePerformance || '',
        plagiarismDetection: task.plagiarismDetection || '',
        collaboration: task.collaboration || '',
        testsValidation: task.testsValidation || '',
        reportQuality: task.reportQuality || '',
        note: calculateTaskNote(task),
      };
    });
    setEvaluations(initialEvaluations);
  }, [tasksWithEvaluation]);

  const handleEvaluationChange = (taskId, field, value) => {
    setEvaluations(prevEvaluations => ({
      ...prevEvaluations,
      [taskId]: {
        ...prevEvaluations[taskId],
        [field]: value,
        note: calculateTaskNote({ 
          ...tasksWithEvaluation.find(t => t._id === taskId), 
          [field]: value 
        }),
      },
    }));
  };

  const calculateTaskNote = (taskEvaluation) => {
    let totalScore = 0;
    let validFields = 0;
    const weightings = {
      clarity: 1,
      commitFrequency: 0.5,
      deadlineRespect: 1.5,
      efficiency: 1,
      codePerformance: 1,
      plagiarismDetection: -2,
      collaboration: 1,
      testsValidation: 1,
      reportQuality: 1,
    };

    for (const field in weightings) {
      if (taskEvaluation && taskEvaluation.hasOwnProperty(field) && typeof taskEvaluation[field] === 'number') {
        totalScore += taskEvaluation[field] * weightings[field];
        validFields++;
      }
    }

    if (validFields === 0) return 0;
    const averageScore = totalScore / validFields;
    const note = Math.max(0, Math.min(20, (averageScore / 5) * 20));
    return parseFloat(note.toFixed(2));
  };

  const calculateAverageProjectNote = () => {
    if (tasksWithEvaluation.length === 0) return 0;
    const totalNotes = Object.values(evaluations).reduce((sum, evalData) => sum + (evalData.note || 0), 0);
    return parseFloat((totalNotes / tasksWithEvaluation.length).toFixed(2));
  };

  const handleSubmitEvaluations = async () => {
    try {
      console.log('Evaluations submitted:', evaluations);
      showSnackbar('Evaluations submitted successfully!', 'success');
    } catch (err) {
      setError('Failed to submit evaluations.');
      console.error(err);
      showSnackbar('Failed to submit evaluations', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredTasks = tasksWithEvaluation.filter(task => {
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.assignedTo.name.toLowerCase().includes(query)
    );
  });

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredTasks.length) : 0;
  const visibleTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <LinearProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!tasksWithEvaluation || tasksWithEvaluation.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', boxShadow: 3 }}>
        <Typography variant="h6" color="textSecondary">
          No tasks found for this team.
        </Typography>
      </Paper>
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
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            Team Evaluation: {teamId}
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon sx={{ color: 'white' }} />}
            onClick={handleSubmitEvaluations}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              background: 'white',
              color: theme.palette.error.main,
              '&:hover': {
                background: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Save Evaluations
          </Button>
        </Box>
        
        {/* Search Bar */}
        <TextField
          variant="standard"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '35%',
            maxWidth: 400,
            mb: 2,
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: 1,
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
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.error.light }}>
            <TableRow>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold' }}>Task</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold' }}>Assigned To</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Code Clarity</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Commit Frequency</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Deadline Respect</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Efficiency</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Performance</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Plagiarism</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Collaboration</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Tests</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Report</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTasks.map((task) => (
              <StyledTableRow key={task._id}>
                <TableCell>
                  <Typography fontWeight="500">{task.title}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                      {task.assignedTo.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Typography>{task.assignedTo.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.clarity || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'clarity', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.commitFrequency || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'commitFrequency', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.deadlineRespect || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'deadlineRespect', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.efficiency || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'efficiency', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.codePerformance || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'codePerformance', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 0, max: 1 }}
                    value={evaluations[task._id]?.plagiarismDetection || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'plagiarismDetection', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.collaboration || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'collaboration', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.testsValidation || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'testsValidation', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    value={evaluations[task._id]?.reportQuality || ''}
                    onChange={(e) => handleEvaluationChange(task._id, 'reportQuality', parseInt(e.target.value))}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <StatusChip
                    status={evaluations[task._id]?.note >= 10}
                    icon={evaluations[task._id]?.note >= 10 ? <CheckCircle /> : <Cancel />}
                    label={`${evaluations[task._id]?.note || 0}/20`}
                  />
                </TableCell>
              </StyledTableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={12} />
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={11} align="right">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Project Average:
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {calculateAverageProjectNote()} / 20
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Tasks per page:"
        />
      </TableContainer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationGrid;