import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  fetchTasksByProject,
  updateTaskStatus,
} from '../../api/taskApi';

const TasksList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [key, setKey] = useState(0); // Force re-render with a key

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        console.log('Fetching tasks for project:', projectId);
        const tasksData = await fetchTasksByProject(projectId);
        console.log('Tasks fetched:', tasksData);
        if (Array.isArray(tasksData)) {
          setTasks(tasksData);
          setKey((prev) => prev + 1); // Update key to force re-render
        } else {
          console.warn('Tasks data is not an array:', tasksData);
          setTasks([]);
          setKey((prev) => prev + 1); // Update key on empty data
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  const groupTasksByStatus = (tasks) => {
    return {
      TODO: tasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
      COMPLETED: tasks.filter((task) => task.status === 'COMPLETED'),
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return '#1976d2'; // Blue
      case 'IN_PROGRESS':
        return '#f57c00'; // Orange
      case 'COMPLETED':
        return '#388e3c'; // Green
      default:
        return '#dd2825'; // Red as fallback
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    console.log('Drag end:', { destination, source, draggableId });
    console.log('Current tasks state:', tasks);

    if (!destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Same position, no update needed');
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    // Verify task exists in current state
    const taskToMove = tasks.find((task) => task._id.toString() === taskId);
    if (!taskToMove) {
      console.error(`Task with id ${taskId} not found in state`);
      setError(`Task with id ${taskId} not found`);
      return;
    }

    console.log(`Dragging task ${taskId} from ${source.droppableId} to ${newStatus}`);

    // Optimistically update the UI
    const updatedTasks = tasks.map((task) =>
      task._id.toString() === taskId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);
    setKey((prev) => prev + 1); // Force re-render

    try {
      await updateTaskStatus(taskId, newStatus);
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
      // Revert the UI change if the API call fails
      const revertedTasks = tasks.map((task) =>
        task._id.toString() === taskId ? { ...task, status: source.droppableId } : task
      );
      setTasks(revertedTasks);
      setKey((prev) => prev + 1); // Force re-render on revert
    }
  };

  const handleBack = () => {
    navigate(`/tutor/project/${projectId}`);
  };

  const handleCreateTask = () => {
    navigate(`/tutor/projects/${projectId}/tasks/create`); // Updated to match route
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading tasks...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const groupedTasks = groupTasksByStatus(tasks);

  return (
    <Box sx={{ p: 3 }} key={key}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
            sx={{ color: '#dd2825', borderColor: '#dd2825' }}
          >
            Back to Project
          </Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>
            Tasks Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{
            backgroundColor: '#dd2825',
            color: 'white',
            '&:hover': {
              backgroundColor: '#c42020',
            },
          }}
        >
          Create Task
        </Button>
      </Box>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#dd2825', mb: 3 }}>
          Kanban Board
        </Typography>
        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={3}>
            {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <Grid item xs={12} md={4} key={status}>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: '300px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        padding: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#dd2825',
                          fontWeight: 'bold',
                          mb: 2,
                          textAlign: 'center',
                        }}
                      >
                        {status} ({groupedTasks[status].length})
                      </Typography>
                      {groupedTasks[status].map((task, index) => {
                        console.log(`Rendering task ${task._id} in ${status} column`);
                        return (
                          <Draggable
                            key={task._id.toString()}
                            draggableId={task._id.toString()}
                            index={index}
                          >
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  mb: 2,
                                  backgroundColor: '#fff',
                                  borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                  cursor: 'grab',
                                  '&:hover': {
                                    boxShadow: 3,
                                  },
                                }}
                              >
                                <CardContent>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {task.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Status: {task.status}
                                  </Typography>
                                  <Typography variant="caption">
                                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                  </Typography>
                                  {task.assignedTo && (
                                    <Typography variant="caption">
                                      Assigned: {task.assignedTo.firstName} {task.assignedTo.lastName}
                                    </Typography>
                                  )}
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    onClick={() => navigate(`/tutor/tasks/${task._id}`)}
                                    sx={{ color: '#dd2825' }}
                                  >
                                    View
                                  </Button>
                                </CardActions>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
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