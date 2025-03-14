import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Alert, LinearProgress, Grid, Card, CardContent, CardActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { fetchTasksByProject, updateTaskStatus } from '../../api/taskApi';
import { getUserRole } from '../../utils/authUtils';

const TasksList = ({ role = getUserRole(), tasks: propTasks, projectId: propProjectId }) => {
  const { projectId: urlProjectId } = useParams();
  const projectId = propProjectId || urlProjectId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState(propTasks || []);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!propTasks) {
      const fetchTasks = async () => {
        try {
          setLoading(true);
          const tasksData = await fetchTasksByProject(projectId);
          setTasks(tasksData);
          setKey((prev) => prev + 1);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [projectId, propTasks]);

  const groupTasksByStatus = (tasks) => ({
    TODO: tasks.filter((task) => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
    COMPLETED: tasks.filter((task) => task.status === 'COMPLETED'),
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO': return '#1976d2';
      case 'IN_PROGRESS': return '#f57c00';
      case 'COMPLETED': return '#388e3c';
      default: return '#dd2825';
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    const taskId = draggableId;
    const taskToMove = tasks.find((task) => task._id.toString() === taskId);
    if (!taskToMove) {
      setError(`Task with id ${taskId} not found`);
      return;
    }

    const updatedTasks = tasks.map((task) => task._id.toString() === taskId ? { ...task, status: newStatus } : task);
    setTasks(updatedTasks);
    setKey((prev) => prev + 1);

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      setError('Failed to update task status');
      const revertedTasks = tasks.map((task) => task._id.toString() === taskId ? { ...task, status: source.droppableId } : task);
      setTasks(revertedTasks);
      setKey((prev) => prev + 1);
    }
  };

  const handleBack = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects${projectId ? `/${projectId}` : ''}`);
  const handleCreateTask = () => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks/create`);

  if (loading) return <Box sx={{ p: 3 }}><LinearProgress /><Typography sx={{ mt: 2, textAlign: 'center' }}>Loading tasks...</Typography></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

  const groupedTasks = groupTasksByStatus(tasks);

  return (
      <Box sx={{ p: 3 }} key={key}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="outlined" sx={{ color: '#dd2825', borderColor: '#dd2825' }}>
              Back to {projectId ? 'Project' : 'Projects'}
            </Button>
            <Typography variant="h5" sx={{ color: '#dd2825' }}>Tasks Management</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask} sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}>
            Create Task
          </Button>
        </Box>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#dd2825', mb: 3 }}>Kanban Board</Typography>
          <DragDropContext onDragEnd={onDragEnd}>
            <Grid container spacing={3}>
              {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                  <Grid item xs={12} md={4} key={status}>
                    <Droppable droppableId={status}>
                      {(provided) => (
                          <Box
                              ref={provided.innerRef} {...provided.droppableProps}
                              sx={{ minHeight: '300px', backgroundColor: '#f5f5f5', borderRadius: 2, padding: 2 }}
                          >
                            <Typography variant="h6" sx={{ color: '#dd2825', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                              {status} ({groupedTasks[status].length})
                            </Typography>
                            {groupedTasks[status].map((task, index) => (
                                <Draggable key={task._id.toString()} draggableId={task._id.toString()} index={index}>
                                  {(provided) => (
                                      <Card
                                          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                          sx={{ mb: 2, backgroundColor: '#fff', borderLeft: `4px solid ${getStatusColor(task.status)}`, cursor: 'grab', '&:hover': { boxShadow: 3 } }}
                                      >
                                        <CardContent>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{task.title}</Typography>
                                          <Typography variant="body2" color="text.secondary">Status: {task.status}</Typography>
                                          <Typography variant="caption">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Typography>
                                          {task.assignedTo && (
                                              <Typography variant="caption">Assigned: {task.assignedTo.firstName} {task.assignedTo.lastName}</Typography>
                                          )}
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                                          <Button size="small" onClick={() => navigate(`${role === 'ADMIN' ? '/admin' : '/tutor'}/projects/${projectId}/tasks/${task._id}`)} sx={{ color: '#dd2825' }}>
                                            View
                                          </Button>
                                        </CardActions>
                                      </Card>
                                  )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                          </Box>
                      )}
                    </Droppable>
                  </Grid>
              ))}
            </Grid>
          </DragDropContext>
        </Paper>
      </Box>
  );
};

export default TasksList;