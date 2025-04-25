import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
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
  Warning as WarningIcon,
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

const PlagiarismChip = styled(Chip)(({ theme, value }) => ({
  fontWeight: 600,
  borderRadius: 4,
  backgroundColor: value > 0 ? theme.palette.warning.light : theme.palette.success.light,
  color: value > 0 ? theme.palette.warning.dark : theme.palette.success.dark,
  '& .MuiChip-icon': {
    color: value > 0 ? theme.palette.warning.dark : theme.palette.success.dark,
  },
}));

const CenteredTextField = styled(TextField)(({ theme, error }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: error ? theme.palette.error.main : undefined,
    },
    '&:hover fieldset': {
      borderColor: error ? theme.palette.error.main : undefined,
    },
    '& input': {
      textAlign: 'center',
    },
  },
  width: '100%',
}));

const EvaluationGrid = () => {
  const { user } = useOutletContext();
  const theme = useTheme();
  const { teamId } = useParams();
  const { state } = useLocation();
  const team = state?.team;
  const navigate = useNavigate();

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

  const fetchExistingEvaluation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:5001/api/evaluations/team/${teamId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const existingEvaluations = {};
          data.data.evaluations.forEach((evalData) => {
            existingEvaluations[evalData.member] = {
              clarity: evalData.clarity.toString(),
              commitFrequency: evalData.commitFrequency.toString(),
              deadlineRespect: evalData.deadlineRespect.toString(),
              efficiency: evalData.efficiency.toString(),
              codePerformance: evalData.codePerformance.toString(),
              plagiarismDetection: evalData.plagiarismDetection.toString(),
              collaboration: evalData.collaboration.toString(),
              testsValidation: evalData.testsValidation.toString(),
              reportQuality: evalData.reportQuality.toString(),
              note: evalData.note,
            };
          });
          setEvaluations(existingEvaluations);
        }
      }
    } catch (err) {
      console.error('Failed to fetch evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (team && team.members) {
      // Initialize evaluations
      const initialEvaluations = {};
      team.members.forEach((member) => {
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

      // Fetch existing evaluation
      fetchExistingEvaluation();
    }
  }, [team, teamId]);

  const calculateAverageTeamNote = () => {
    if (!team?.members?.length) return 0;
    const totalNotes = Object.values(evaluations).reduce(
      (sum, evalData) => sum + (evalData.note || 0),
      0
    );
    return parseFloat((totalNotes / team.members.length).toFixed(2));
  };

  const calculateMemberNote = (evaluation) => {
    const weights = {
      clarity: 1,
      commitFrequency: 1,
      deadlineRespect: 1.5,
      efficiency: 1.5,
      codePerformance: 2,
      plagiarismDetection: -3,
      collaboration: 1,
      testsValidation: 1.5,
      reportQuality: 1.5,
    };

    let total = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const value = parseFloat(evaluation[key]);
      if (!isNaN(value)) {
        if (key === 'plagiarismDetection') {
          total += value * weight;
        } else {
          total += (value / 5) * 20 * weight;
        }
        totalWeight += Math.abs(weight);
      }
    }

    const finalNote = totalWeight > 0 ? Math.max(0, Math.min(20, total / totalWeight)) : 0;
    return parseFloat(finalNote.toFixed(2));
  };

  const validateAllEvaluations = () => {
    const requiredFields = [
      'clarity',
      'commitFrequency',
      'deadlineRespect',
      'efficiency',
      'codePerformance',
      'plagiarismDetection',
      'collaboration',
      'testsValidation',
      'reportQuality',
    ];

    for (const memberId in evaluations) {
      for (const field of requiredFields) {
        if (evaluations[memberId][field] === '' || evaluations[memberId][field] === undefined) {
          return false;
        }
      }
    }
    return true;
  };

  const validateField = (field, value) => {
    if (value === '') return true;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (field === 'plagiarismDetection') return numValue >= 0 && numValue <= 1;
    return numValue >= 0 && numValue <= 5;
  };

  const handleEvaluationChange = (memberId, field, value) => {
    if (value !== '' && !/^(\d+(\.\d*)?)?$/.test(value)) return;
    const isValid = validateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [`${memberId}-${field}`]: !isValid,
    }));
    if (isValid || value === '') {
      setEvaluations((prevEvaluations) => ({
        ...prevEvaluations,
        [memberId]: {
          ...prevEvaluations[memberId],
          [field]: value,
          note: calculateMemberNote({
            ...prevEvaluations[memberId],
            [field]: value,
          }),
        },
      }));
    }
  };

  const handleBlur = (memberId, field, value) => {
    if (value === '') return;
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setFieldErrors((prev) => ({ ...prev, [`${memberId}-${field}`]: true }));
      return;
    }
    if (field === 'plagiarismDetection') {
      numValue = Math.max(0, Math.min(1, numValue));
      numValue = Math.round(numValue * 100) / 100;
    } else {
      numValue = Math.max(0, Math.min(5, numValue));
      numValue = Math.round(numValue * 10) / 10;
    }
    setEvaluations((prevEvaluations) => ({
      ...prevEvaluations,
      [memberId]: {
        ...prevEvaluations[memberId],
        [field]: numValue.toString(),
        note: calculateMemberNote({
          ...prevEvaluations[memberId],
          [field]: numValue.toString(),
        }),
      },
    }));
    setFieldErrors((prev) => ({ ...prev, [`${memberId}-${field}`]: false }));
  };

  const handleSubmitEvaluations = async () => {
    if (Object.values(fieldErrors).some(Boolean)) {
      showSnackbar('Please correct the invalid fields before submitting', 'error');
      return;
    }

    if (!validateAllEvaluations()) {
      showSnackbar('Please fill in all evaluation fields', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Authentication required. Please login again.', 'error');
        return;
      }

      if (!user?._id) {
        showSnackbar('User session expired. Please login again.', 'error');
        return;
      }

      const evaluationData = {
        evaluator: user._id,
        evaluations: Object.entries(evaluations).map(([memberId, evalData]) => ({
          member: memberId,
          clarity: parseFloat(evalData.clarity) || 0,
          commitFrequency: parseFloat(evalData.commitFrequency) || 0,
          deadlineRespect: parseFloat(evalData.deadlineRespect) || 0,
          efficiency: parseFloat(evalData.efficiency) || 0,
          codePerformance: parseFloat(evalData.codePerformance) || 0,
          plagiarismDetection: parseFloat(evalData.plagiarismDetection) || 0,
          collaboration: parseFloat(evalData.collaboration) || 0,
          testsValidation: parseFloat(evalData.testsValidation) || 0,
          reportQuality: parseFloat(evalData.reportQuality) || 0,
          note: evalData.note || 0,
        })),
        teamAverage: calculateAverageTeamNote(),
      };

      // Check if evaluation exists to decide between POST and PUT
      const checkResponse = await fetch(`http://localhost:5001/api/evaluations/team/${teamId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let method = 'POST';
      let url = `http://localhost:5001/api/evaluations/${teamId}`;
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.success && checkData.data) {
          method = 'PUT';
          url = `http://localhost:5001/api/evaluations/${checkData.data._id}`;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = `Unexpected response: ${text.slice(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      showSnackbar('Evaluations saved successfully!', 'success');
      setTimeout(() => {
        navigate('/tutor/teams/eval');
      }, 1000);
    } catch (err) {
      console.error('Submission error:', err);
      showSnackbar(err.message || 'Failed to save evaluations', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const renderEvaluationField = (memberId, field, label, range, min = 0, max = 5, step = 0.1) => (
    <Box sx={{ textAlign: 'center', mb: 1 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" color="text.secondary">({range})</Typography>
      <CenteredTextField
        type="number"
        inputProps={{ min, max, step }}
        value={evaluations[memberId]?.[field] || ''}
        onChange={(e) => handleEvaluationChange(memberId, field, e.target.value)}
        onBlur={(e) => handleBlur(memberId, field, e.target.value)}
        error={fieldErrors[`${memberId}-${field}`]}
        size="small"
      />
    </Box>
  );

  if (!team) return <Alert severity="error" sx={{ p: 3 }}>Team data not found</Alert>;
  if (loading) return <LinearProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  const filteredMembers = team.members.filter((member) =>
    `${member.user.firstName} ${member.user.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const visibleMembers = filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
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
    <Box>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
        Team Evaluation: {team.name}
      </Typography>
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 500, mt: 1 }}>
        Project: {team.projectRef ? team.projectRef.name : 'No Project Assigned'}
      </Typography>
    </Box>
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
        '&:hover': { background: 'rgba(255,255,255,0.9)' },
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
      '& .MuiInputBase-root': { height: 35 },
      '& .MuiInputBase-input': {
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      },
    }}
  />
</Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3, width: '100%' }}>
  <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
    <TableHead sx={{ bgcolor: theme.palette.error.light }}>
      <TableRow>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '15%' }}>Member</TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>
          Technical Skills
        </TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', width: '25%' }}>
          Work Quality
        </TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', width: '15%' }}>
          Plagiarism
        </TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>
          Teamwork
        </TableCell>
        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>
          Note
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {visibleMembers.map((member) => (
        <StyledTableRow key={member.user._id}>
          <TableCell sx={{ width: '15%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                {member.user.firstName[0]}
                {member.user.lastName[0]}
              </Avatar>
              <Box>
                <Typography fontWeight="bold">
                  {member.user.firstName} {member.user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.role}
                </Typography>
              </Box>
            </Box>
          </TableCell>

          <TableCell sx={{ width: '25%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderEvaluationField(member.user._id, 'codePerformance', 'Code Quality', '0-5')}
              {renderEvaluationField(member.user._id, 'efficiency', 'Efficiency', '0-5')}
              {renderEvaluationField(member.user._id, 'testsValidation', 'Tests Validation', '0-5')}
              {renderEvaluationField(member.user._id, 'clarity', 'Code Clarity', '0-5')}
            </Box>
          </TableCell>

          <TableCell sx={{ width: '25%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderEvaluationField(member.user._id, 'deadlineRespect', 'Deadline Respect', '0-5')}
              {renderEvaluationField(member.user._id, 'commitFrequency', 'Commit Frequency', '0-5')}
              {renderEvaluationField(member.user._id, 'reportQuality', 'Report Quality', '0-5')}
            </Box>
          </TableCell>

          <TableCell align="center" sx={{ width: '15%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {renderEvaluationField(
                member.user._id,
                'plagiarismDetection',
                'Plagiarism Detection',
                '0-1',
                0,
                1,
                0.01
              )}
              {evaluations[member.user._id]?.plagiarismDetection > 0 && (
                <PlagiarismChip
                  value={evaluations[member.user._id]?.plagiarismDetection}
                  icon={<WarningIcon />}
                  label={`${(evaluations[member.user._id]?.plagiarismDetection * 100).toFixed(0)}%`}
                />
              )}
            </Box>
          </TableCell>

          <TableCell sx={{ width: '10%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderEvaluationField(member.user._id, 'collaboration', 'Collaboration', '0-5')}
            </Box>
          </TableCell>

          <TableCell align="center" sx={{ width: '10%' }}>
            <StatusChip
              status={evaluations[member.user._id]?.note >= 10}
              icon={evaluations[member.user._id]?.note >= 10 ? <CheckCircle /> : <Cancel />}
              label={`${evaluations[member.user._id]?.note || 0}/20`}
              sx={{ fontSize: '1rem', padding: 1 }}
            />
          </TableCell>
        </StyledTableRow>
      ))}

      {filteredMembers.length === 0 && (
        <TableRow>
          <TableCell colSpan={6} align="center">
            <Typography>No members found</Typography>
          </TableCell>
        </TableRow>
      )}
      <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
        <TableCell colSpan={5} align="right">
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