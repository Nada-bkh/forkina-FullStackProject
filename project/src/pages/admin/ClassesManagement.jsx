import { useState } from 'react';
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
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, GroupAdd as GroupAddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, updateClass, deleteClass, addStudentsToClass } from '../../api/classApi';
import { fetchUsers, fetchUnassignedStudents } from '../../api/userApi';

const ClassesManagement = () => {
  const queryClient = useQueryClient();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddStudentsDialog, setOpenAddStudentsDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', tutorId: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Fetch all classes
  const { data: classes = [], isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  // Fetch tutors
  const { data: tutors = [], error: tutorsError } = useQuery({
    queryKey: ['tutors'],
    queryFn: () => fetchUsers('TUTOR'),
  });

  // Fetch unassigned students for the Add Students dialog
  const { data: unassignedStudents = [], error: studentsError } = useQuery({
    queryKey: ['unassignedStudents'],
    queryFn: fetchUnassignedStudents,
  });

  const error = classesError || tutorsError || studentsError;

  // Mutation for creating a class
  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setOpenCreateDialog(false);
    },
    onError: (err) => setError(err.message),
  });

  // Mutation for updating a class
  const updateClassMutation = useMutation({
    mutationFn: ({ classId, classData }) => updateClass(classId, classData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setOpenEditDialog(false);
      setSelectedClass(null);
    },
    onError: (err) => setError(err.message),
  });

  // Mutation for deleting a class
  const deleteClassMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    },
    onError: (err) => setError(err.message),
  });

  // Mutation for adding students to a class
  const addStudentsMutation = useMutation({
    mutationFn: ({ classId, studentIds }) => addStudentsToClass(classId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      queryClient.invalidateQueries(['unassignedStudents']);
      setOpenAddStudentsDialog(false);
      setSelectedClass(null);
      setSelectedStudents([]);
    },
    onError: (err) => setError(err.message),
  });

  const handleOpenCreateDialog = () => {
    setFormData({ name: '', description: '', tutorId: '' });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleOpenEditDialog = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      tutorId: classItem.tutor?._id || '',
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedClass(null);
  };

  const handleOpenAddStudentsDialog = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStudents([]);
    setOpenAddStudentsDialog(true);
  };

  const handleCloseAddStudentsDialog = () => {
    setOpenAddStudentsDialog(false);
    setSelectedClass(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    createClassMutation.mutate(formData);
  };

  const handleUpdateClass = (e) => {
    e.preventDefault();
    updateClassMutation.mutate({ classId: selectedClass._id, classData: formData });
  };

  const handleDeleteClass = (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      deleteClassMutation.mutate(classId);
    }
  };

  const handleAddStudents = () => {
    const studentIds = selectedStudents.map((student) => student._id);
    addStudentsMutation.mutate({ classId: selectedClass._id, studentIds });
  };

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            Classes Management
          </Typography>
          <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                backgroundColor: '#dd2825',
                color: 'white',
                '&:hover': { backgroundColor: '#c42020' },
              }}
          >
            Create Class
          </Button>
        </Box>

        {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error.message || 'An error occurred'}
            </Alert>
        )}

        {classesLoading ? (
            <LinearProgress />
        ) : classes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">No Classes Found</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Create a new class to get started.
              </Typography>
            </Paper>
        ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Class Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Tutor</TableCell>
                    <TableCell>Number of Students</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((classItem) => (
                      <TableRow key={classItem._id} hover>
                        <TableCell>{classItem.name}</TableCell>
                        <TableCell>{classItem.description || 'No description'}</TableCell>
                        <TableCell>
                          {classItem.tutor ? `${classItem.tutor.firstName} ${classItem.tutor.lastName}` : 'Not assigned'}
                        </TableCell>
                        <TableCell>{classItem.students.length}</TableCell>
                        <TableCell>
                          {classItem.createdBy
                              ? `${classItem.createdBy.firstName} ${classItem.createdBy.lastName}`
                              : 'Unknown'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Class">
                            <IconButton onClick={() => handleOpenEditDialog(classItem)} size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Students">
                            <IconButton onClick={() => handleOpenAddStudentsDialog(classItem)} size="small">
                              <GroupAddIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Class">
                            <IconButton
                                onClick={() => handleDeleteClass(classItem._id)}
                                size="small"
                                color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
        )}

        {/* Create Class Dialog */}
        <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Class</DialogTitle>
          <form onSubmit={handleCreateClass}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                      name="name"
                      label="Class Name"
                      value={formData.name}
                      onChange={handleFormChange}
                      fullWidth
                      required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                      name="description"
                      label="Description"
                      value={formData.description}
                      onChange={handleFormChange}
                      fullWidth
                      multiline
                      rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Tutor</InputLabel>
                    <Select
                        name="tutorId"
                        value={formData.tutorId}
                        onChange={handleFormChange}
                        label="Tutor"
                    >
                      {tutors.map((tutor) => (
                          <MenuItem key={tutor._id} value={tutor._id}>
                            {tutor.firstName} {tutor.lastName}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCreateDialog}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: '#dd2825', color: 'white' }}>
                Create
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Class Dialog */}
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Class</DialogTitle>
          <form onSubmit={handleUpdateClass}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                      name="name"
                      label="Class Name"
                      value={formData.name}
                      onChange={handleFormChange}
                      fullWidth
                      required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                      name="description"
                      label="Description"
                      value={formData.description}
                      onChange={handleFormChange}
                      fullWidth
                      multiline
                      rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Tutor</InputLabel>
                    <Select
                        name="tutorId"
                        value={formData.tutorId}
                        onChange={handleFormChange}
                        label="Tutor"
                    >
                      {tutors.map((tutor) => (
                          <MenuItem key={tutor._id} value={tutor._id}>
                            {tutor.firstName} {tutor.lastName}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: '#dd2825', color: 'white' }}>
                Save Changes
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add Students Dialog */}
        <Dialog open={openAddStudentsDialog} onClose={handleCloseAddStudentsDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add Students to {selectedClass?.name}</DialogTitle>
          <DialogContent>
            <Autocomplete
                multiple
                options={unassignedStudents}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                value={selectedStudents}
                onChange={(event, newValue) => setSelectedStudents(newValue)}
                renderInput={(params) => (
                    <TextField {...params} label="Select Students" placeholder="Search students..." />
                )}
                fullWidth
                sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddStudentsDialog}>Cancel</Button>
            <Button
                onClick={handleAddStudents}
                variant="contained"
                disabled={selectedStudents.length === 0}
                sx={{ backgroundColor: '#dd2825', color: 'white' }}
            >
              Add Students
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default ClassesManagement;