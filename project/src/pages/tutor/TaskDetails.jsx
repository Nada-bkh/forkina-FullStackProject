import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Divider, Grid, Alert, LinearProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchTaskById, deleteTask } from '../../api/taskApi';
import { getUserRole } from '../../utils/authUtils';

const TaskDetails = ({ role = getUserRole() }) => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [task, setTask] = useState(null);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const taskData = await fetchTaskById(taskId);
        setTask(taskData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [taskId]);

  const handleBack = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks`);
  const handleEdit = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks/${taskId}/edit`);
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ p: 3 }}><LinearProgress /><Typography sx={{ mt: 2, textAlign: 'center' }}>Loading task details...</Typography></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert><Button sx={{ mt: 2 }} onClick={handleBack}>Back to Tasks</Button></Box>;

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>Back</Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>Task Details</Typography>
        </Box>
        {task && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">{task.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>Edit</Button>
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Delete</Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6">Description</Typography>
                  <Typography paragraph>{task.description || 'No description'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h6">Status</Typography>
                  <Chip label={task.status} color={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'primary' : 'default'} sx={{ mt: 1 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h6">Priority</Typography>
                  <Chip label={task.priority} color={task.priority === 'HIGH' ? 'error' : task.priority === 'MEDIUM' ? 'warning' : 'info'} sx={{ mt: 1 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h6">Due Date</Typography>
                  <Typography>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>
        )}
      </Box>
  );
};

export default TaskDetails;