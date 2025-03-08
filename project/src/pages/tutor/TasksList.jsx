import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

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
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [projectId]);

  const handleBack = () => {
    navigate(`/tutor/projects/${projectId}`);
  };

  const handleCreateTask = () => {
    navigate(`/tutor/projects/${projectId}/tasks/create`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Project
          </Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>Tasks Management</Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{
            backgroundColor: '#dd2825',
            color: 'white',
            '&:hover': {
              backgroundColor: '#c42020'
            }
          }}
        >
          Create Task
        </Button>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Task Management Coming Soon</Typography>
        <Typography paragraph sx={{ mt: 2 }}>
          This feature is currently under development. You'll be able to create and manage tasks for this project soon.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TasksList; 