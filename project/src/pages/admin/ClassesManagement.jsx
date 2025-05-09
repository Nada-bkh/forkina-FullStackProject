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
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GroupAdd as GroupAddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
} from '../../api/classApi';
import { fetchUsers, fetchUnassignedStudents, getCurrentUser } from '../../api/userApi';

const ClassesManagement = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddStudentsDialog, setOpenAddStudentsDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', tutorIds: [], department: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [error, setError] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);

  // Fetch current user
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

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

  // Fetch unassigned students
  const { data: unassignedStudents = [], error: studentsError } = useQuery({
    queryKey: ['unassignedStudents'],
    queryFn: fetchUnassignedStudents,
  });

  const combinedError = classesError || tutorsError || studentsError || userError || error;

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: (classData) => createClass(classData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setOpenCreateDialog(false);
      setFormData({ name: '', description: '', tutorIds: [], department: '' });
    },
    onError: (err) => setError(err.message),
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ classId, classData }) => updateClass(classId, classData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setOpenEditDialog(false);
      setSelectedClass(null);
    },
    onError: (err) => setError(err.message),
  });

  const deleteClassMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    },
    onError: (err) => setError(err.message),
  });

  const addStudentsMutation = useMutation({
    mutationFn: ({ classId, studentIds }) => addStudentsToClass(classId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      queryClient.invalidateQueries(['unassignedStudents']);
      setOpenAddStudentsDialog(false);
      setSelectedClass(null);
      setSelectedStudents([]);
      setAvailableStudents([]);
    },
    onError: (err) => setError(err.message),
  });

  // Handlers
  const handleOpenCreateDialog = () => {
    setFormData({ name: '', description: '', tutorIds: [], department: '' });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => setOpenCreateDialog(false);

  const handleOpenEditDialog = (classItem) => {
    const tutorIds = classItem.tutors?.map((tutor) => tutor._id) || [];
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      tutorIds,
      department: classItem.department || '',
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
    setAvailableStudents(unassignedStudents);
    setOpenAddStudentsDialog(true);
  };

  const handleCloseAddStudentsDialog = () => {
    setOpenAddStudentsDialog(false);
    setSelectedClass(null);
    setSelectedStudents([]);
    setAvailableStudents([]);
  };

  const handleFormChange = (e, newValue, field) => {
    if (field === 'tutorIds') {
      const newTutorIds = newValue.map((tutor) => tutor._id);
      setFormData((prev) => ({ ...prev, tutorIds: newTutorIds }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (formData.tutorIds.length === 0) {
      setError('At least one tutor is required.');
      return;
    }
    if (!formData.name) {
      setError('Class name is required.');
      return;
    }
    if (!formData.department) {
      setError('Department is required.');
      return;
    }
    createClassMutation.mutate(formData);
  };

  const handleUpdateClass = (e) => {
    e.preventDefault();
    if (formData.tutorIds.length === 0) {
      setError('At least one tutor is required.');
      return;
    }
    if (!formData.name) {
      setError('Class name is required.');
      return;
    }
    if (!formData.department) {
      setError('Department is required.');
      return;
    }
    updateClassMutation.mutate({ classId: selectedClass._id, classData: formData });
  };

  const handleDeleteClass = (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      deleteClassMutation.mutate(classId);
    }
  };

  const handleAddStudents = () => {
    if (currentUser?.userRole !== 'ADMIN') {
      setError('Only admins can add students to classes.');
      return;
    }
    const studentIds = selectedStudents.map((student) => student._id);
    addStudentsMutation.mutate({ classId: selectedClass._id, studentIds });
  };

  // Filter tutors by department
  const getTutorsForSelectedDepartment = () => {
    if (!formData.department) return tutors;
    return tutors.filter((tutor) => tutor.department === formData.department);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
          boxShadow: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
            Classes Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.light} 90%)`,
              color: 'white',
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.error.dark} 60%, ${theme.palette.error.light} 100%)`,
              },
            }}
            disabled={currentUser?.userRole !== 'ADMIN'}
          >
            New Class
          </Button>
        </Box>
      </Box>

      {userLoading || classesLoading ? <LinearProgress /> : null}

      {combinedError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {combinedError.message || 'An error occurred'}
        </Alert>
      )}

      {!userLoading && !classesLoading && classes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No Classes Found</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Create a new class to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.error.light }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tutor</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}># Students</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created By</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem._id} hover>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.description || 'No description'}</TableCell>
                  <TableCell>{classItem.department || 'Not assigned'}</TableCell>
                  <TableCell>
                    {classItem.tutors && classItem.tutors.length > 0
                      ? classItem.tutors.map((tutor) => `${tutor.firstName} ${tutor.lastName}`).join(', ')
                      : 'Not assigned'}
                  </TableCell>
                  <TableCell>{classItem.students?.length || 0}</TableCell>
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
                  error={!formData.name && error}
                  helperText={!formData.name && error ? 'Class name is required' : ''}
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
                <FormControl fullWidth required error={!formData.department && error}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    label="Department"
                  >
                    <MenuItem value="ArcTIC">Architecture IT & Cloud Computing</MenuItem>
                    <MenuItem value="DS">Data Science</MenuItem>
                    <MenuItem value="ERP/BI">Enterprise Resource Planning & Business Intelligence</MenuItem>
                    <MenuItem value="Gamix">Gaming & Immersive eXperience</MenuItem>
                    <MenuItem value="InFini">Informatique Financière Et Ingénierie</MenuItem>
                    <MenuItem value="NIDS">Network Infrastructure and Data Security</MenuItem>
                    <MenuItem value="SLEAM">Systèmes et Logiciels Embarqués Ambiants et Mobiles</MenuItem>
                    <MenuItem value="SAE">Software Architecture Engineering</MenuItem>
                    <MenuItem value="SE">Software Engineering</MenuItem>
                    <MenuItem value="SIM">Systèmes Informatiques et Mobiles</MenuItem>
                    <MenuItem value="TWIN">Technologies du Web et de l’Internet</MenuItem>
                  </Select>
                  {!formData.department && error && (
                    <Typography color="error" variant="caption">
                      Department is required
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={getTutorsForSelectedDepartment()}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  value={tutors.filter((tutor) => formData.tutorIds.includes(tutor._id))}
                  onChange={(e, newValue) => handleFormChange(e, newValue, 'tutorIds')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tutors"
                      placeholder="Select tutors..."
                      required={formData.tutorIds.length === 0}
                      error={formData.tutorIds.length === 0 && error}
                      helperText={
                        formData.tutorIds.length === 0 && error ? 'At least one tutor is required' : ''
                      }
                    />
                  )}
                  fullWidth
                  disabled={!formData.department}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#dd2825', color: 'white' }}
            >
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
                  error={!formData.name && error}
                  helperText={!formData.name && error ? 'Class name is required' : ''}
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
                <FormControl fullWidth required error={!formData.department && error}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    label="Department"
                  >
                    <MenuItem value="ArcTIC">Architecture IT & Cloud Computing</MenuItem>
                    <MenuItem value="DS">Data Science</MenuItem>
                    <MenuItem value="ERP/BI">Enterprise Resource Planning & Business Intelligence</MenuItem>
                    <MenuItem value="Gamix">Gaming & Immersive eXperience</MenuItem>
                    <MenuItem value="InFini">Informatique Financière Et Ingénierie</MenuItem>
                    <MenuItem value="NIDS">Network Infrastructure and Data Security</MenuItem>
                    <MenuItem value="SLEAM">Systèmes et Logiciels Embarqués Ambiants et Mobiles</MenuItem>
                    <MenuItem value="SAE">Software Architecture Engineering</MenuItem>
                    <MenuItem value="SE">Software Engineering</MenuItem>
                    <MenuItem value="SIM">Systèmes Informatiques et Mobiles</MenuItem>
                    <MenuItem value="TWIN">Technologies du Web et de l’Internet</MenuItem>
                  </Select>
                  {!formData.department && error && (
                    <Typography color="error" variant="caption">
                      Department is required
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={getTutorsForSelectedDepartment()}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  value={tutors.filter((tutor) => formData.tutorIds.includes(tutor._id))}
                  onChange={(e, newValue) => handleFormChange(e, newValue, 'tutorIds')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tutors"
                      placeholder="Select tutors..."
                      required={formData.tutorIds.length === 0}
                      error={formData.tutorIds.length === 0 && error}
                      helperText={
                        formData.tutorIds.length === 0 && error ? 'At least one tutor is required' : ''
                      }
                    />
                  )}
                  fullWidth
                  disabled={!formData.department}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#dd2825', color: 'white' }}
            >
              Save
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
            options={availableStudents}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            value={selectedStudents}
            onChange={(event, newValue) => {
              setSelectedStudents(newValue);
              setAvailableStudents(
                availableStudents.filter(
                  (student) => !newValue.some((selected) => selected._id === student._id)
                )
              );
            }}
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
            disabled={selectedStudents.length === 0 || currentUser?.userRole !== 'ADMIN'}
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