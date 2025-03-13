
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ProjectsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Placeholder for loading projects
    const timer = setTimeout(() => {
      setLoading(false);
      setProjects([
        {
          _id: '1',
          name: 'Mobile App Development',
          description: 'Develop a cross-platform mobile app for student resources',
          status: 'In Progress',
          startDate: '2023-10-01',
          endDate: '2023-12-15',
          tags: ['Mobile', 'React Native']
        },
        {
          _id: '2',
          name: 'Database Design Project',
          description: 'Design and implement a normalized database for a school management system',
          status: 'Planning',
          startDate: '2023-11-15',
          endDate: '2024-01-30',
          tags: ['SQL', 'Database', 'Design']
        }
      ]);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewProject = (projectId) => {
    navigate(`/student/projects/${projectId}`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading your projects...</Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>
        My Projects
      </Typography>

      {projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">You haven't been assigned to any projects yet</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            Projects assigned to you by tutors will appear here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip 
                      label={project.status}
                      size="small"
                      color={
                        project.status === 'Completed' ? 'success' : 
                        project.status === 'In Progress' ? 'primary' : 
                        'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Timeline: {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {project.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewProject(project._id)}
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProjectsList; 