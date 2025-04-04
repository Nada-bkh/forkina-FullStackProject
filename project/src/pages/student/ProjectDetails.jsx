// project/src/pages/student/ProjectDetails.jsx
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
} from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchProjectById, fetchTasksForProject } from '../../api/projectApi';

const ProjectDetails = ({ role = 'STUDENT' }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        setProject(projectData.project || projectData);

        // Fetch tasks for the project
        const tasksData = await fetchTasksForProject(projectId);
        setTasks(tasksData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleBack = () => {
    const path = role === 'ADMIN' ? '/admin/projects' : '/student/projects';
    navigate(path);
  };

  const handleViewTasks = () => {
    const path = role === 'ADMIN' ? `/admin/projects/${projectId}/tasks` : `/student/projects/${projectId}/tasks`;
    navigate(path);
  };

  // Calculate task summary
  const taskSummary = {
    toDo: tasks.filter(task => task.status === 'To Do').length,
    inProgress: tasks.filter(task => task.status === 'In Progress').length,
    completed: tasks.filter(task => task.status === 'Done').length,
  };

  // Calculate project progress
  const totalTasks = tasks.length;
  const completedTasks = taskSummary.completed;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading project details...</Typography>
        </Box>
    );
  }

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

  return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            Project Overview
          </Typography>
        </Box>

        {project && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1">Status:</Typography>
                  <Chip
                      label={project.status}
                      color={
                        project.status === 'COMPLETED'
                            ? 'success'
                            : project.status === 'IN_PROGRESS'
                                ? 'primary'
                                : 'default'
                      }
                      sx={{ mt: 1 }}
                  />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<TaskIcon />}
                    onClick={handleViewTasks}
                    sx={{
                      backgroundColor: '#dd2825',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#c42020',
                      },
                    }}
                >
                  View All Tasks
                </Button>
              </Box>

              <Typography variant="subtitle1">Description:</Typography>
              <Typography paragraph>
                {project.description || 'No description available'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                Tasks
              </Typography>
              {tasks.length === 0 ? (
                  <Typography>No tasks found for this project.</Typography>
              ) : (
                  <List>
                    {tasks.map(task => (
                        <ListItem key={task._id}>
                          <ListItemText
                              primary={task.title}
                              secondary={
                                <>
                                  <Typography variant="body2" color="textSecondary">
                                    {task.description || 'No description available'}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Due Date: {new Date(task.dueDate).toLocaleDateString()}
                                  </Typography>
                                  <Chip
                                      label={task.status}
                                      size="small"
                                      color={
                                        task.status === 'Done'
                                            ? 'success'
                                            : task.status === 'In Progress'
                                                ? 'primary'
                                                : 'default'
                                      }
                                      sx={{ mt: 1 }}
                                  />
                                </>
                              }
                          />
                        </ListItem>
                    ))}
                  </List>
              )}
              {role === 'ADMIN' && (
                  <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/projects/${projectId}/tasks/new`)} // Adjust path as needed
                      sx={{
                        backgroundColor: '#dd2825',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#c42020',
                        },
                        mt: 2,
                      }}
                  >
                    Add Task
                  </Button>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                Task Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1">To Do: {taskSummary.toDo}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1">In Progress: {taskSummary.inProgress}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1">Completed: {taskSummary.completed}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                Project Progress
              </Typography>
              <Typography variant="body1">{progressPercentage.toFixed(1)}% Complete</Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                Team Members
              </Typography>
              {project.teamRef && project.teamRef.members && project.teamRef.members.length > 0 ? (
                  <List>
                    {project.teamRef.members.map(member => (
                        <ListItem key={member.user._id}>
                          <ListItemText
                              primary={`${member.user.firstName} ${member.user.lastName}`}
                              secondary={member.user.email}
                          />
                        </ListItem>
                    ))}
                  </List>
              ) : (
                  <Typography>No team members assigned.</Typography>
              )}
            </Paper>
        )}
      </Box>
  );
};

export default ProjectDetails;