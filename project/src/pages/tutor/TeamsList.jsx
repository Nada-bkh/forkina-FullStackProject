import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Refresh } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const TeamsList = () => {
  const { user } = useOutletContext();
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return null;
    }
    return token;
  };

  const fetchTutorTeams = async () => {
    try {
      const token = checkToken();
      if (!token || !user?._id) return;

      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/teams/tutor/${user._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      if (data.success) {
        setTeams(data.data || []);
      } else {
        setError(data.message || 'No teams found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id && user?.userRole === 'TUTOR') {
      fetchTutorTeams();
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          onClick={fetchTutorTeams} 
          startIcon={<Refresh />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StyledPaper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Teams</Typography>
              <Button 
                onClick={fetchTutorTeams}
                startIcon={<Refresh />}
                size="small"
              >
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {teams.length === 0 ? (
              <Alert severity="info">No teams assigned to you</Alert>
            ) : (
              <TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Team Name</TableCell>
        <TableCell>Project</TableCell>
        <TableCell>Class</TableCell>
        <TableCell>Members</TableCell>
        {/* Colonne Average conditionnelle */}
        {teams.some(team => team.evaluation) && (
          <TableCell>Average</TableCell>
        )}
        <TableCell>Action</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {teams.map((team) => (
        <TableRow key={team._id}>
          <TableCell>{team.name}</TableCell>
          <TableCell>{team.projectRef?.name || 'None'}</TableCell>   
          <TableCell>
            {team.classRef ? (
              team.classRef.name
            ) : (
              <Chip label="Not assigned" color="warning" size="small" />
            )}
          </TableCell>
          <TableCell>
            {team.members?.map(member => (
              <div key={member.user._id}>
                {member.user.firstName} {member.user.lastName}
              </div>
            ))}
          </TableCell>
          {/* Cellule Average conditionnelle */}
          {team.evaluation && (
            <TableCell>
              <Chip 
                label={`${team.evaluation.teamAverage}`}
                color="primary"
                variant="outlined"
                sx={{ 
                  fontWeight: 'bold',
                  borderWidth: 2,
                  borderColor: 'primary.main'
                }}
              />
            </TableCell>
          )}
          <TableCell>
            {!team.evaluation ? (
              <Button
                variant="contained"
                onClick={() => navigate(`/tutor/teams/${team._id}/evaluate`, { 
                  state: { team } 
                })}
              >
                Evaluate
              </Button>
            ) : (
<Button
  variant="outlined"
  size="small"
  onClick={() => navigate(`/tutor/evaluationdetails/${team._id}`, { 
    state: { 
      teamName: team.name,
      teamData: team // Passez l'objet team entier au cas où
    } 
  })}
>
  Details
</Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
            )}
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamsList;