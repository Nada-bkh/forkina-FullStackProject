// project/src/pages/admin/TeamsManagement.jsx
import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { fetchAllTeams, deleteTeam, updateTeam, fetchTutorsByClass, fetchStudentsByClass } from '../../api/teamApi';

const TeamsManagement = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState(null);
    const [tutors, setTutors] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamsData = await fetchAllTeams();
                setTeams(teamsData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDeleteClick = (teamId) => {
        setTeamToDelete(teamId);
        setOpenDeleteDialog(true);
    };

    const handleDeleteDialogClose = () => {
        setOpenDeleteDialog(false);
        setTeamToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!teamToDelete) return;
        try {
            await deleteTeam(teamToDelete);
            setTeams(teams.filter((team) => team._id !== teamToDelete));
            setOpenDeleteDialog(false);
            setTeamToDelete(null);
        } catch (err) {
            setError(err.message);
            setOpenDeleteDialog(false);
        }
    };

    const handleEditClick = async (team) => {
        setTeamToEdit(team);
        setSelectedMembers(team.members.map((m) => m.user._id));
        setSelectedTutor(team.tutor?._id || ''); // Use tutor field
        setEditLoading(true);
        try {
            const classId = team.classRef._id;
            const [tutorsData, studentsData] = await Promise.all([
                fetchTutorsByClass(classId),
                fetchStudentsByClass(classId),
            ]);
            setTutors(tutorsData);
            setStudents(studentsData);
            setOpenEditDialog(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
        setTeamToEdit(null);
        setTutors([]);
        setStudents([]);
        setSelectedTutor('');
        setSelectedMembers([]);
    };

    const handleConfirmEdit = async () => {
        if (!teamToEdit) return;
        try {
            const updatedTeam = await updateTeam(teamToEdit._id, {
                memberIds: selectedMembers,
                tutor: selectedTutor || null, // Use 'tutor' to match schema
            });
            setTeams(teams.map((team) => (team._id === updatedTeam._id ? updatedTeam : team)));
            handleEditDialogClose();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#dd2825', mb: 3 }}>
                All Teams
            </Typography>
            {teams.length === 0 ? (
                <Typography>No teams available.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Team Name</TableCell>
                                <TableCell>Class</TableCell>
                                <TableCell>Created By</TableCell>
                                <TableCell>Members</TableCell>
                                <TableCell>Tutor</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teams.map((team) => (
                                <TableRow key={team._id}>
                                    <TableCell>{team.name}</TableCell>
                                    <TableCell>{team.classRef?.name || 'N/A'}</TableCell>
                                    <TableCell>{`${team.createdBy?.firstName || 'Unknown'} ${team.createdBy?.lastName || ''}`}</TableCell>
                                    <TableCell>
                                        {team.members?.map((m) => `${m.user?.firstName || 'Unknown'} ${m.user?.lastName || ''}`).join(', ') || 'No members'}
                                    </TableCell>
                                    <TableCell>
                                        {team.tutor && typeof team.tutor === 'object' && team.tutor.firstName
                                            ? `${team.tutor.firstName} ${team.tutor.lastName}`
                                            : 'Not assigned'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() => handleEditClick(team)}
                                            sx={{ mr: 1 }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => handleDeleteClick(team._id)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete this team? This action cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteDialogClose} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog open={openEditDialog} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Team</DialogTitle>
                <DialogContent>
                    {editLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Tutor</InputLabel>
                                <Select
                                    value={selectedTutor}
                                    onChange={(e) => setSelectedTutor(e.target.value)}
                                    label="Tutor"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {tutors.map((tutor) => (
                                        <MenuItem key={tutor._id} value={tutor._id}>
                                            {`${tutor.firstName} ${tutor.lastName}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Team Members</InputLabel>
                                <Select
                                    multiple
                                    value={selectedMembers}
                                    onChange={(e) => setSelectedMembers(e.target.value)}
                                    label="Team Members"
                                    renderValue={(selected) =>
                                        selected.map((id) => {
                                            const student = students.find((s) => s._id === id);
                                            return student ? `${student.firstName} ${student.lastName}` : id;
                                        }).join(', ')
                                    }
                                >
                                    {students.map((student) => (
                                        <MenuItem key={student._id} value={student._id}>
                                            {`${student.firstName} ${student.lastName}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmEdit} color="primary" disabled={editLoading}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamsManagement;