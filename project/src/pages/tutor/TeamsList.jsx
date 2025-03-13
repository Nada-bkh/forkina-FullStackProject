// src/pages/tutor/TeamsList.jsx
import { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Chip,
  Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh'; // Correct import
import { fetchAllTeams, confirmOrDeleteTeam } from '../../api/teamApi';

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const teamsData = await fetchAllTeams();
      setTeams(teamsData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while fetching teams');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTeamAction = async (teamId, action) => {
    if (window.confirm(`Are you sure you want to ${action} this team?`)) {
      try {
        await confirmOrDeleteTeam(teamId, action);
        fetchData(); // Refresh after action
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading teams...</Typography></Box>;
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            Teams Overview
          </Typography>
          <Button
              variant="contained"
              onClick={fetchData}
              startIcon={<RefreshIcon />} // Use RefreshIcon
              sx={{ bgcolor: '#dd2825', '&:hover': { bgcolor: '#c42020' } }}
          >
            Refresh
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Member Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>
                      {team.members.map((m) => `${m.user.firstName} ${m.user.lastName}`).join(', ')}
                    </TableCell>
                    <TableCell>{team.classRef?.name || 'Not assigned'}</TableCell>
                    <TableCell>{`${team.createdBy.firstName} ${team.createdBy.lastName}`}</TableCell>
                    <TableCell><Chip label={team.members.length} color="primary" /></TableCell>
                    <TableCell>
                      <Chip
                          label={team.confirmed ? 'Confirmed' : 'Pending'}
                          color={team.confirmed ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {!team.confirmed && (
                          <>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleTeamAction(team._id, 'confirm')}
                                sx={{ mr: 1 }}
                            >
                              Confirm
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleTeamAction(team._id, 'delete')}
                            >
                              Delete
                            </Button>
                          </>
                      )}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  );
};

export default TeamsList;