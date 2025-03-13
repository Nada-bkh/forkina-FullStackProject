// src/pages/tutor/ProjectDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Grid,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '../../api/axiosConfig';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch project and tasks data
  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch project details
        const projectResponse = await api.get(`/projects/${projectId}`);
        setProject(projectResponse.data);

        // Fetch tasks specific to this project
        const tasksResponse = await api.get('/tasks', {
          params: { projectId }
        });
        setTasks(tasksResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch project or tasks');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [projectId]);

  // Navigation handlers
  const handleBack = () => {
    navigate('/tutor/projects');
  };

  const handleViewTasks = () => {
    navigate(`/tutor/projects/${projectId}/tasks`);
  };

  // Calculate task summary and progress
  const taskSummary = {
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length
  };
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (taskSummary.completed / totalTasks) * 100 : 0;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading project details...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={handleBack}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  // Main render
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          {project.name}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {/* Project Overview */}
        <Typography variant="h6" gutterBottom>Project Overview</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography><strong>Status:</strong> {project.status}</Typography>
            <Typography><strong>Description:</strong> {project.description || 'No description available'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={handleViewTasks}
              sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
            >
              View All Tasks
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4 }} />

        {/* Task List */}
        <Typography variant="h6" gutterBottom>Tasks</Typography>
        {tasks.length === 0 ? (
          <Typography>No tasks found for this project.</Typography>
        ) : (
          <List>
            {tasks.map(task => (
              <ListItem
                key={task._id}
                button
                onClick={() => navigate(`/tutor/projects/${projectId}/tasks/${task._id}`)}
                sx={{ mb: 1, border: '1px solid #eee', borderRadius: '4px' }}
              >
                <ListItemText
                  primary={task.title}
                  secondary={
                    <>
                      <Chip
                        label={task.status}
                        size="small"
                        color={
                          task.status === 'COMPLETED' ? 'success' :
                          task.status === 'IN_PROGRESS' ? 'primary' : 'default'
                        }
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        color={
                          task.priority === 'HIGH' ? 'error' :
                          task.priority === 'MEDIUM' ? 'warning' : 'info'
                        }
                      />
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
        <Button
          variant="contained"
          onClick={() => navigate(`/tutor/projects/${projectId}/tasks/create`)}
          sx={{ mt: 2, backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
        >
          Add Task
        </Button>

        <Divider sx={{ my: 4 }} />

        {/* Task Summary */}
        <Typography variant="h6" gutterBottom>Task Summary</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <Typography>To Do: {taskSummary.todo}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography>In Progress: {taskSummary.inProgress}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography>Completed: {taskSummary.completed}</Typography>
          </Grid>
        </Grid>

        {/* Project Progress */}
        <Typography variant="h6" gutterBottom>Project Progress</Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
        <Typography>{progress.toFixed(2)}% Complete</Typography>

        <Divider sx={{ my: 4 }} />

        {/* Team Members */}
        <Typography variant="h6" gutterBottom>Team Members</Typography>
        {project.members && project.members.length > 0 ? (
          <Grid container spacing={2}>
            {project.members.map(member => (
              <Grid item xs={12} sm={6} md={4} key={member._id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>
                    {member.firstName[0]}{member.lastName[0]}
                  </Avatar>
                  <Typography>{member.firstName} {member.lastName}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>No team members assigned.</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ProjectDetails;