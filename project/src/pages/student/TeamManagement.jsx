import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentTeams, createTeam } from '../../api/teamApi';
import { fetchUsers, getCurrentUser } from '../../api/userApi';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [availableClassmates, setAvailableClassmates] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', memberIds: [] });

  // Fetch current user
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, classmatesData] = await Promise.all([
        fetchStudentTeams(),
        fetchUsers('STUDENT'),
      ]);
      setTeams(teamsData);
      const allStudents = classmatesData.filter(student => student.classe);
      setClassmates(allStudents);

      // Filter out students who are assigned to a team
      const assignedStudentIds = new Set(
          teamsData.flatMap(team => team.members.map(member => member.user._id))
      );
      const unassignedStudents = allStudents.filter(
          student => !assignedStudentIds.has(student._id)
      );
      setAvailableClassmates(unassignedStudents);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if the current user has already created a team
  const hasCreatedTeam = currentUser && teams.some(team => team.createdBy._id === currentUser._id);

  const handleOpenDialog = () => {
    if (hasCreatedTeam) {
      setError('You have already created a team.');
      return;
    }
    setFormData({ name: '', memberIds: [] });
    setSelectedMembers([]);

    // Reset available classmates to unassigned students
    const assignedStudentIds = new Set(
        teams.flatMap(team => team.members.map(member => member.user._id))
    );
    const unassignedStudents = classmates.filter(
        student => !assignedStudentIds.has(student._id)
    );
    setAvailableClassmates(unassignedStudents);

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', memberIds: [] });
    setSelectedMembers([]);

    // Restore the full list of unassigned students
    const assignedStudentIds = new Set(
        teams.flatMap(team => team.members.map(member => member.user._id))
    );
    const unassignedStudents = classmates.filter(
        student => !assignedStudentIds.has(student._id)
    );
    setAvailableClassmates(unassignedStudents);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const teamData = { ...formData, memberIds: selectedMembers.map(member => member._id) };
      const newTeam = await createTeam(teamData);
      setTeams([...teams, newTeam]);
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (userLoading || loading) return <Typography>Loading...</Typography>;

  if (userError) return <Alert severity="error">{userError.message}</Alert>;

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            My Teams
          </Typography>
          <Button
              variant="contained"
              onClick={handleOpenDialog}
              disabled={hasCreatedTeam}
              sx={{
                color: 'white',
                bgcolor: '#dd2825',
                '&:hover': { bgcolor: '#c42020' },
                '&.Mui-disabled': {
                  bgcolor: '#e57373',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
          >
            Create Team
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Assigned Project</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map(team => (
                  <TableRow key={team._id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.classRef.name}</TableCell>
                    <TableCell>
                      {team.members.map(m => `${m.user.firstName} ${m.user.lastName}`).join(', ')}
                    </TableCell>
                    <TableCell>{`${team.createdBy.firstName} ${team.createdBy.lastName}`}</TableCell>
                    <TableCell>{team.projectRef}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create Team</DialogTitle>
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
              <Autocomplete
                  multiple
                  options={availableClassmates.filter(classmate => !classmate.teamRef)} // Filter available classmates
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  value={selectedMembers}
                  onChange={(event, newValue) => {
                    setSelectedMembers(newValue);
                    // Update available classmates by excluding selected members and those already assigned
                    setAvailableClassmates(
                        classmates.filter(
                            classmate =>
                                !classmate.teamRef &&
                                !newValue.some(selected => selected._id === classmate._id)
                        )
                    );
                  }}
                  renderInput={(params) => (
                      <TextField {...params} label="Select Members" placeholder="Search members..." />
                  )}
                  fullWidth
                  isOptionEqualToValue={(option, value) => option._id === value._id}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                  type="submit"
                  variant="contained"
                  disabled={selectedMembers.length === 0 || !formData.name}
                  sx={{ bgcolor: '#dd2825', '&:hover': { bgcolor: '#c42020' } }}
              >
                Create
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
  );
};

export default TeamManagement;
