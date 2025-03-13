// src/pages/admin/ClassesManagement.jsx
import { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, GroupAdd as GroupAddIcon } from '@mui/icons-material';
import { fetchClasses, createClass, updateClass, deleteClass, addStudentsToClass } from '../../api/classApi';
import { fetchUsers } from '../../api/userApi';

const ClassesManagement = () => {
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddStudentsDialog, setOpenAddStudentsDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', tutorId: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchAllClasses();
    fetchTutorsAndStudents();
  }, []);

  const fetchAllClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorsAndStudents = async () => {
    try {
      const tutorsData = await fetchUsers('TUTOR');
      const studentsData = await fetchUsers('STUDENT');
      setTutors(tutorsData);
      setStudents(studentsData);
    } catch (err) {
      setError(err.message);
    }
  };

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
      tutorId: classItem.tutor._id
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const newClass = await createClass(formData);
      setClasses([...classes, newClass]);
      handleCloseCreateDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      const updatedClass = await updateClass(selectedClass._id, formData);
      setClasses(classes.map(c => (c._id === selectedClass._id ? updatedClass : c)));
      handleCloseEditDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(classId);
        setClasses(classes.filter(c => c._id !== classId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddStudents = async () => {
    try {
      const studentIds = selectedStudents.map(student => student._id);
      const updatedClass = await addStudentsToClass(selectedClass._id, studentIds);
      setClasses(classes.map(c => (c._id === selectedClass._id ? updatedClass : c)));
      fetchAllClasses();

      handleCloseAddStudentsDialog();
    } catch (err) {
      setError(err.message);
    }
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
            '&:hover': { backgroundColor: '#c42020' }
          }}
        >
          Create Class
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
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
                  <TableCell>{classItem.tutor ? `${classItem.tutor.firstName} ${classItem.tutor.lastName}` : 'Not assigned'}</TableCell>
                  <TableCell>{classItem.students.length}</TableCell>
                  <TableCell>{classItem.createdBy ? `${classItem.createdBy.firstName} ${classItem.createdBy.lastName}` : 'Unknown'}</TableCell>
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
                      <IconButton onClick={() => handleDeleteClass(classItem._id)} size="small" color="error">
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
                    {tutors.map(tutor => (
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
                    {tutors.map(tutor => (
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
            options={students.filter(student => !selectedClass?.students.some(s => s._id === student._id))}
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