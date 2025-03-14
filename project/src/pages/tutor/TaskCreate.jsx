import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Grid, TextField, MenuItem, Typography, Alert } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTask } from '../../api/taskApi';
import { getUserRole } from '../../utils/authUtils';

const TaskCreate = ({ role = getUserRole(), projectId: propProjectId }) => {
  const { projectId: urlProjectId } = useParams();
  const projectId = propProjectId || urlProjectId;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', dueDate: null
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const statusOptions = ['To Do', 'In Progress', 'Done'];
  const priorityOptions = ['Low', 'Medium', 'High'];
  const statusMap = { 'To Do': 'TODO', 'In Progress': 'IN_PROGRESS', 'Done': 'COMPLETED' };
  const priorityMap = { 'Low': 'LOW', 'Medium': 'MEDIUM', 'High': 'HIGH' };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (newValue) => {
    setFormData((prev) => ({ ...prev, dueDate: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    const taskData = {
      title: formData.title, description: formData.description,
      status: statusMap[formData.status], priority: priorityMap[formData.priority],
      dueDate: formData.dueDate ? formData.dueDate.format('YYYY-MM-DD') : null,
      projectRef: projectId
    };
    try {
      await createTask(taskData);
      setSuccessMessage('Task created successfully');
      setTimeout(() => {
        navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks`);
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks`);

  return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>Create New Task</Typography>
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleChange} required disabled={loading} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={4} disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange} disabled={loading}>
                  {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Priority" name="priority" value={formData.priority} onChange={handleChange} disabled={loading}>
                  {priorityOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="Due Date" value={formData.dueDate} onChange={handleDateChange} disabled={loading} slotProps={{ textField: { fullWidth: true } }} />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" color="primary" type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={handleBack} disabled={loading}>Back</Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Container>
  );
};

export default TaskCreate;