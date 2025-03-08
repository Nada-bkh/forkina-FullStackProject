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
  LinearProgress
} from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    // Placeholder for loading project details
    const timer = setTimeout(() => {
      setLoading(false);
      setProject({
        _id: projectId,
        name: 'Sample Project',
        description: 'This is a placeholder for the project description with detailed information about goals, scope, and deliverables.',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        tags: ['Web', 'React', 'NodeJS'],
        createdAt: new Date().toISOString()
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [projectId]);

  const handleBack = () => {
    navigate('/student/projects');
  };

  const handleViewTasks = () => {
    navigate(`/student/projects/${projectId}/tasks`);
  };

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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          Project Details
        </Typography>
      </Box>

      {project && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4">{project.name}</Typography>
            <Button
              variant="contained"
              startIcon={<TaskIcon />}
              onClick={handleViewTasks}
              sx={{
                backgroundColor: '#dd2825',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#c42020'
                }
              }}
            >
              View My Tasks
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Description</Typography>
              <Typography paragraph>{project.description}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Status</Typography>
              <Chip 
                label={project.status} 
                color={project.status === 'Completed' ? 'success' : 'primary'} 
                sx={{ mt: 1 }} 
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Timeline</Typography>
              <Typography>
                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6">Skills & Technologies</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {project.tags.map((tag, index) => (
                  <Chip key={index} label={tag} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default ProjectDetails; 