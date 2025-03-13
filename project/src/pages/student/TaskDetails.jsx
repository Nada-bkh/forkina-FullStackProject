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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import RestoreIcon from '@mui/icons-material/Restore';

const TaskDetails = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);

  useEffect(() => {
    // Check if we have a saved task in localStorage
    const savedTask = localStorage.getItem(`task_${taskId}`);
    
    // Placeholder for loading task details
    const timer = setTimeout(() => {
      if (savedTask) {
        const parsedTask = JSON.parse(savedTask);
        setTask(parsedTask);
        setStatus(parsedTask.status);
        
        // Get saved status history or create default
        const savedHistory = localStorage.getItem(`task_history_${taskId}`);
        if (savedHistory) {
          setStatusHistory(JSON.parse(savedHistory));
        } else {
          const defaultHistory = [
            { status: 'To Do', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { status: parsedTask.status, timestamp: new Date().toISOString() }
          ];
          setStatusHistory(defaultHistory);
          localStorage.setItem(`task_history_${taskId}`, JSON.stringify(defaultHistory));
        }
      } else {
        const sampleTask = {
          _id: taskId,
          title: 'Research Component Design',
          description: 'Research and document UI component design patterns for the project. This should include a review of modern design libraries and frameworks, focusing on responsive and accessible components that can be reused across the application.',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'Medium',
          status: 'In Progress',
          createdAt: new Date().toISOString()
        };
        
        setTask(sampleTask);
        setStatus(sampleTask.status);
        
        // Save to localStorage
        localStorage.setItem(`task_${taskId}`, JSON.stringify(sampleTask));
        
        // Mock status history
        const defaultHistory = [
          { status: 'To Do', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { status: 'In Progress', timestamp: new Date().toISOString() }
        ];
        setStatusHistory(defaultHistory);
        localStorage.setItem(`task_history_${taskId}`, JSON.stringify(defaultHistory));
      }
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [taskId]);

  const handleBack = () => {
    navigate(`/student/projects/${projectId}/tasks`);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleUpdateStatus = () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    // Simulate saving
    setTimeout(() => {
      // Update task with new status
      const updatedTask = { ...task, status };
      setTask(updatedTask);
      
      // Save to localStorage
      localStorage.setItem(`task_${taskId}`, JSON.stringify(updatedTask));
      
      // Add to status history
      const newHistory = [
        ...statusHistory,
        { status, timestamp: new Date().toISOString() }
      ];
      setStatusHistory(newHistory);
      
      // Save history to localStorage
      localStorage.setItem(`task_history_${taskId}`, JSON.stringify(newHistory));
      
      setSaving(false);
      setSuccess('Task status updated successfully!');
    }, 1000);
  };

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Done':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'To Do':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading task details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={handleBack}>
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          Task Details
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {task && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>{task.title}</Typography>
          
          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Description</Typography>
              <Typography paragraph>{task.description}</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="h6">Priority</Typography>
              <Chip 
                label={task.priority} 
                color={
                  task.priority === 'High' ? 'error' : 
                  task.priority === 'Medium' ? 'warning' : 
                  'info'
                } 
                sx={{ mt: 1 }} 
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="h6">Due Date</Typography>
              <Typography>
                {new Date(task.dueDate).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="h6">Current Status</Typography>
              <Chip 
                label={task.status} 
                color={getStatusColor(task.status)} 
                sx={{ mt: 1 }} 
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6">Update Status</Typography>
                <Tooltip title="You can freely change the task status at any time, even after it has been marked as completed.">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    onChange={handleStatusChange}
                    label="Status"
                    disabled={saving}
                  >
                    <MenuItem value="To Do">To Do</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Done">Done</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleUpdateStatus}
                  disabled={saving || status === task.status}
                  sx={{
                    backgroundColor: '#dd2825',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#c42020'
                    }
                  }}
                >
                  {saving ? 'Updating...' : 'Update Status'}
                </Button>
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Note: You can change the status of your task at any time based on your progress, even if it was previously marked as completed.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Status History</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {statusHistory.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={entry.status} 
                        size="small"
                        color={getStatusColor(entry.status)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                      {index === statusHistory.length - 1 && index > 0 && (
                        <Tooltip title="Revert to this status">
                          <IconButton 
                            size="small" 
                            onClick={() => setStatus(entry.status)}
                            sx={{ ml: 'auto' }}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default TaskDetails; 