import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Paper, Alert, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchTaskById, updateTask } from '../../api/taskApi';
import { getUserRole } from '../../utils/authUtils';
import dayjs from 'dayjs';

const TaskEdit = ({ role = getUserRole() }) => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', dueDate: null, priority: 'MEDIUM', status: 'TODO'
  });

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const task = await fetchTaskById(taskId);
        setFormData({
          title: task.title, description: task.description || '',
          dueDate: task.dueDate ? dayjs(task.dueDate) : null,
          priority: task.priority || 'MEDIUM', status: task.status || 'TODO'
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [taskId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (newValue) => {
    setFormData({ ...formData, dueDate: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const taskData = {
        title: formData.title, description: formData.description,
        dueDate: formData.dueDate ? formData.dueDate.format('YYYY-MM-DD') : null,
        priority: formData.priority, status: formData.status
      };
      await updateTask(taskId, taskData);
      setSuccess('Task updated successfully');
      setTimeout(() => {
        navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks/${taskId}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks/${taskId}`);

  if (loading) return <Box sx={{ p: 3 }}><LinearProgress /><Typography sx={{ mt: 2, textAlign: 'center' }}>Loading task details...</Typography></Box>;

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>Back</Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>Edit Task</Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField name="title" label="Task Title" value={formData.title} onChange={handleInputChange} fullWidth required disabled={saving} />
              </Grid>
              <Grid item xs={12}>
                <TextField name="description" label="Description" value={formData.description} onChange={handleInputChange} fullWidth multiline rows={4} disabled={saving} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="Due Date" value={formData.dueDate} onChange={handleDateChange} slotProps={{ textField: { fullWidth: true } }} disabled={saving} />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select name="priority" value={formData.priority} onChange={handleInputChange} label="Priority" disabled={saving}>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formData.status} onChange={handleInputChange} label="Status" disabled={saving}>
                    <MenuItem value="TODO">To Do</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Done</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={saving} sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
  );
};

export default TaskEdit;