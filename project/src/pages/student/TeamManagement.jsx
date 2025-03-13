// src/pages/student/TeamManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh'; // Correct import
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  fetchStudentTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../../api/teamApi';
import { fetchUsers } from '../../api/userApi';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', memberIds: [] });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsData, classmatesData] = await Promise.all([
        fetchStudentTeams(),
        fetchUsers('STUDENT'),
      ]);
      setTeams(teamsData);
      setClassmates(classmatesData.filter((student) => student.classe));
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (team = null) => {
    setIsEditMode(!!team);
    setCurrentTeam(team);
    setFormData({
      name: team ? team.name : '',
      memberIds: team ? team.members.map((m) => m.user._id) : [],
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', memberIds: [] });
    setCurrentTeam(null);
    setIsEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (e) => {
    setFormData((prev) => ({ ...prev, memberIds: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode && currentTeam) {
        const updatedTeam = await updateTeam(currentTeam._id, formData);
        setTeams(teams.map((t) => (t._id === updatedTeam._id ? updatedTeam : t)));
      } else {
        const newTeam = await createTeam(formData);
        setTeams([...teams, newTeam]);
      }
      handleCloseDialog();
      fetchData(); // Refresh data after submission
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(teamId);
        setTeams(teams.filter((t) => t._id !== teamId));
        fetchData(); // Refresh data after deletion
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            My Teams
          </Typography>
          <Box>
            <Button
                variant="contained"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />} // Use RefreshIcon
                sx={{ mr: 2, bgcolor: '#dd2825', '&:hover': { bgcolor: '#c42020' } }}
            >
              Refresh
            </Button>
            <Button
                variant="contained"
                onClick={() => handleOpenDialog()}
                sx={{ bgcolor: '#dd2825', '&:hover': { bgcolor: '#c42020' } }}
            >
              Create Team
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>
                      {team.members.map((m) => `${m.user.firstName} ${m.user.lastName}`).join(', ')}
                    </TableCell>
                    <TableCell>{`${team.createdBy.firstName} ${team.createdBy.lastName}`}</TableCell>
                    <TableCell>
                      <Chip
                          label={team.confirmed ? 'Confirmed' : 'Pending'}
                          color={team.confirmed ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDialog(team)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(team._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      {/* Team Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Team' : 'Create Team'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Team Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Members</InputLabel>
              <Select
                multiple
                name="memberIds"
                value={formData.memberIds}
                onChange={handleMemberChange}
                label="Members"
                renderValue={(selected) =>
                  selected
                    .map((id) => {
                      const member = classmates.find((c) => c._id === id);
                      return member ? `${member.firstName} ${member.lastName} / ${member.email}` : '';
                    })
                    .join(', ')
                }
              >
                {classmates.map((classmate) => (
                  <MenuItem key={classmate._id} value={classmate._id}>
                    {`${classmate.firstName} ${classmate.lastName}  /   ${classmate.email}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#dd2825', '&:hover': { bgcolor: '#c42020' } }}>
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;
