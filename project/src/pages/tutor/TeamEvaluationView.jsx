import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const TeamEvaluationView = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extrayez correctement les deux valeurs de location.state
  const { teamName, teamData } = location.state || {};
  
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debug logs
  console.log('Team ID from URL:', teamId);
  console.log('Location state:', location.state);
  console.log('Team name from state:', teamName);
  console.log('Full team data from state:', teamData); // Maintenant teamData est défini

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/evaluations/team/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch evaluation');
        
        const data = await response.json();
        if (data.success) {
          setEvaluation(data.data);
          console.log("Evaluation data:", data.data);
        } else {
          setError(data.message || 'No evaluation found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [teamId]);

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={4}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box p={3}>
      <Typography color="error">{error}</Typography>
      <Button 
        variant="outlined" 
        onClick={() => navigate(-1)}
        sx={{ mt: 2 }}
      >
        Go Back
      </Button>
    </Box>
  );

  if (!evaluation) return (
    <Box p={3}>
      <Typography>No evaluation available for this team</Typography>
      <Button 
        variant="outlined" 
        onClick={() => navigate(-1)}
        sx={{ mt: 2 }}
      >
        Go Back
      </Button>
    </Box>
  );
  
  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center">
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5">
          Evaluation for Team: {teamName || teamData?.name || 'Unknown'}
        </Typography>
      </Box>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Member</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Code Quality</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Efficiency</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Deadline Respect</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Collaboration</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Plagiarism</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Final Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluation.evaluations.map((evalItem) => (
              <TableRow key={evalItem.member._id}>
                <TableCell>
                  {evalItem.member.firstName} {evalItem.member.lastName}
                </TableCell>
                <TableCell align="center">{evalItem.codePerformance}/5</TableCell>
                <TableCell align="center">{evalItem.efficiency}/5</TableCell>
                <TableCell align="center">{evalItem.deadlineRespect}/5</TableCell>
                <TableCell align="center">{evalItem.collaboration}/5</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${(evalItem.plagiarismDetection * 100).toFixed(0)}%`} 
                    color={evalItem.plagiarismDetection > 0 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${evalItem.note}/20`} 
                    color={evalItem.note >= 10 ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell colSpan={6} align="right">
                <Typography fontWeight="bold">Team Average:</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight="bold">{evaluation.teamAverage}/20</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TeamEvaluationView;