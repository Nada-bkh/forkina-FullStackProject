import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { api } from '../../api/axiosConfig'; // Adjust path based on your project structure

const TaskCreate = () => {
  const { projectId } = useParams(); // Get projectId from URL
  console.log('Project ID:', projectId);
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: null,
  });

  // State for feedback messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Options for dropdowns
  const statusOptions = ['To Do', 'In Progress', 'Done'];
  const priorityOptions = ['Low', 'Medium', 'High'];

  // Mapping functions for backend compatibility
  const statusMap = {
    'To Do': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Done': 'COMPLETED',
  };

  const priorityMap = {
    'Low': 'LOW',
    'Medium': 'MEDIUM',
    'High': 'HIGH',
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date picker change
  const handleDateChange = (newValue) => {
    setFormData((prev) => ({ ...prev, dueDate: newValue }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
  
    const taskData = {
      title: formData.title,
      description: formData.description,
      status: statusMap[formData.status],
      priority: priorityMap[formData.priority],
      dueDate: formData.dueDate ? formData.dueDate.format('YYYY-MM-DD') : null,
      projectRef: projectId,
    };
  
    console.log('Sending taskData:', taskData);
  
    try {
      const response = await api.post('/tasks', taskData);
      setSuccessMessage('Task created successfully');
      setTimeout(() => {
        navigate('..');
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create task';
      setErrorMessage(errorMsg);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('..'); // Navigate back to tasks list
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Task
        </Typography>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  disabled={loading}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
};

export default TaskCreate;