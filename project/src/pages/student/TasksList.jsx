import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const TasksList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Placeholder for loading tasks
    const timer = setTimeout(() => {
      setProject({
        _id: projectId,
        name: 'Sample Project'
      });
      
      // Define default tasks
      const defaultTasks = [
        {
          _id: '1',
          title: 'Research Component Design',
          description: 'Research and document UI component design patterns',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'High',
          status: 'In Progress'
        },
        {
          _id: '2',
          title: 'Create Project Documentation',
          description: 'Create documentation for the project setup process',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'Medium',
          status: 'To Do'
        }
      ];
      
      // Check localStorage for updated tasks
      const updatedTasks = defaultTasks.map(task => {
        const savedTask = localStorage.getItem(`task_${task._id}`);
        return savedTask ? JSON.parse(savedTask) : task;
      });
      
      setTasks(updatedTasks);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [projectId]);

  const handleBack = () => {
    navigate(`/student/projects/${projectId}`);
  };

  const handleViewTask = (taskId) => {
    navigate(`/student/projects/${projectId}/tasks/${taskId}`);
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
        <Button sx={{ mt: 2 }} onClick={handleBack}>
          Back to Project
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Project
        </Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          My Tasks for {project?.name}
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No tasks assigned yet</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            Your tutor hasn't assigned any tasks for this project yet.
          </Typography>
        </Paper>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              You can change the status of your tasks at any time, including marking tasks as 'In Progress' even after they were completed.
            </Alert>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><Typography variant="subtitle2">Task</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Due Date</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Priority</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Action</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id} hover>
                    <TableCell>
                      <Typography variant="body1">{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {task.description.length > 60 
                          ? `${task.description.substring(0, 60)}...` 
                          : task.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.priority} 
                        size="small"
                        color={
                          task.priority === 'High' ? 'error' : 
                          task.priority === 'Medium' ? 'warning' : 
                          'info'
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.status} 
                        size="small"
                        color={
                          task.status === 'Done' ? 'success' : 
                          task.status === 'In Progress' ? 'primary' : 
                          'default'
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewTask(task._id)}
                        size="small"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default TasksList;