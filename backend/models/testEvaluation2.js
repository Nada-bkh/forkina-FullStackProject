import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const StyledTextField = styled(TextField)(({ theme, error }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: error ? theme.palette.error.main : undefined,
    },
    '&:hover fieldset': {
      borderColor: error ? theme.palette.error.main : undefined,
    },
  },
}));

const EvaluationGrid = () => {
  const theme = useTheme();
  const { teamId } = useParams();
  const { state } = useLocation();
  const team = state?.team;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluations, setEvaluations] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (team && team.members) {
      const initialEvaluations = {};
      team.members.forEach(member => {
        initialEvaluations[member.user._id] = {
          clarity: '',
          commitFrequency: '',
          deadlineRespect: '',
          efficiency: '',
          codePerformance: '',
          plagiarismDetection: '',
          collaboration: '',
          testsValidation: '',
          reportQuality: '',
          note: 0,
        };
      });
      setEvaluations(initialEvaluations);
    }
  }, [team]);

  const validateField = (field, value) => {
    if (value === '') return true;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    if (field === 'plagiarismDetection') {
      return numValue >= 0 && numValue <= 1;
    }
    return numValue >= 1 && numValue <= 5;
  };

  const handleEvaluationChange = (memberId, field, value) => {
    if (value !== '' && !/^(\d+(\.\d*)?)?$/.test(value)) return;
    
    const isValid = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [`${memberId}-${field}`]: !isValid
    }));

    if (isValid || value === '') {
      setEvaluations(prevEvaluations => ({
        ...prevEvaluations,
        [memberId]: {
          ...prevEvaluations[memberId],
          [field]: value,
          note: calculateMemberNote({ 
            ...prevEvaluations[memberId], 
            [field]: value 
          }),
        },
      }));
    }
  };

  const handleBlur = (memberId, field, value) => {
    if (value === '') return;
    
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setFieldErrors(prev => ({
        ...prev,
        [`${memberId}-${field}`]: true
      }));
      return;
    }

    if (field === 'plagiarismDetection') {
      numValue = Math.max(0, Math.min(1, numValue));
      numValue = Math.round(numValue);
    } else {
      numValue = Math.max(1, Math.min(5, numValue));
    }

    setEvaluations(prevEvaluations => ({
      ...prevEvaluations,
      [memberId]: {
        ...prevEvaluations[memberId],
        [field]: numValue.toString(),
        note: calculateMemberNote({ 
          ...prevEvaluations[memberId], 
          [field]: numValue.toString() 
        }),
      },
    }));

    setFieldErrors(prev => ({
      ...prev,
      [`${memberId}-${field}`]: false
    }));
  };

  const calculateMemberNote = (evaluation) => {
    let totalScore = 0;
    let validFields = 0;
    const weightings = {
      clarity: 1,
      commitFrequency: 0.5,
      deadlineRespect: 1.5,
      efficiency: 1,
      codePerformance: 1,
      plagiarismDetection: -3,
      collaboration: 1,
      testsValidation: 1,
      reportQuality: 1,
    };

    for (const field in weightings) {
      if (evaluation && evaluation.hasOwnProperty(field)) {
        const value = parseFloat(evaluation[field]);
        if (!isNaN(value)) {
          totalScore += value * weightings[field];
          validFields++;
        }
      }
    }

    if (validFields === 0) return 0;
    const averageScore = totalScore / validFields;
    const note = Math.max(0, Math.min(20, (averageScore / 5) * 20));
    return parseFloat(note.toFixed(2));
  };

  const calculateAverageTeamNote = () => {
    if (!team?.members || team.members.length === 0) return 0;
    const totalNotes = Object.values(evaluations).reduce((sum, evalData) => sum + (evalData.note || 0), 0);
    return parseFloat((totalNotes / team.members.length).toFixed(2));
  };

  const handleSubmitEvaluations = async () => {
    const hasErrors = Object.values(fieldErrors).some(error => error);
    if (hasErrors) {
      showSnackbar('Please correct the invalid fields before submitting', 'error');
      return;
    }

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

  if (!team) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Team data not found</Alert>
      </Box>
    );
  }

  const filteredMembers = team.members.filter(member => {
    const query = searchQuery.toLowerCase();
    const memberName = `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
    return memberName.includes(query);
  });

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredMembers.length) : 0;
  const visibleMembers = filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <LinearProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

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
            Team Evaluation: {team.name}
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
        
        <TextField
          variant="standard"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search members..."
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
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold' }}>Member</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Code Clarity<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Commit Frequency<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Deadline Respect<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Efficiency<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Performance<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Plagiarism<br />(0-1)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Collaboration<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Tests<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Report<br />(1-5)</TableCell>
              <TableCell sx={{ color: 'white!important', fontWeight: 'bold', textAlign: 'center' }}>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleMembers.map((member) => (
              <StyledTableRow key={member.user._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </Avatar>
                    <Typography>{member.user.firstName} {member.user.lastName}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.clarity || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'clarity', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'clarity', e.target.value)}
                    error={fieldErrors[`${member.user._id}-clarity`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.commitFrequency || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'commitFrequency', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'commitFrequency', e.target.value)}
                    error={fieldErrors[`${member.user._id}-commitFrequency`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.deadlineRespect || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'deadlineRespect', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'deadlineRespect', e.target.value)}
                    error={fieldErrors[`${member.user._id}-deadlineRespect`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.efficiency || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'efficiency', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'efficiency', e.target.value)}
                    error={fieldErrors[`${member.user._id}-efficiency`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.codePerformance || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'codePerformance', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'codePerformance', e.target.value)}
                    error={fieldErrors[`${member.user._id}-codePerformance`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 1 }}
                    value={evaluations[member.user._id]?.plagiarismDetection || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'plagiarismDetection', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'plagiarismDetection', e.target.value)}
                    error={fieldErrors[`${member.user._id}-plagiarismDetection`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.collaboration || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'collaboration', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'collaboration', e.target.value)}
                    error={fieldErrors[`${member.user._id}-collaboration`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.testsValidation || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'testsValidation', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'testsValidation', e.target.value)}
                    error={fieldErrors[`${member.user._id}-testsValidation`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StyledTextField
                    type="number"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                    value={evaluations[member.user._id]?.reportQuality || ''}
                    onChange={(e) => handleEvaluationChange(member.user._id, 'reportQuality', e.target.value)}
                    onBlur={(e) => handleBlur(member.user._id, 'reportQuality', e.target.value)}
                    error={fieldErrors[`${member.user._id}-reportQuality`]}
                    size="small"
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <StatusChip
                    status={evaluations[member.user._id]?.note >= 10}
                    icon={evaluations[member.user._id]?.note >= 10 ? <CheckCircle /> : <Cancel />}
                    label={`${evaluations[member.user._id]?.note || 0}/20`}
                  />
                </TableCell>
              </StyledTableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={11} />
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={10} align="right">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Team Average:
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {calculateAverageTeamNote()} / 20
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Members per page:"
        />
      </TableContainer>

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