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
import axios from 'axios';

const ProjectsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);

  // Define visible statuses for students - now only APPROVED projects will be shown
  const VISIBLE_STATUSES = ['APPROVED'];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // API call to fetch student projects - using the standard project API
        const response = await axios.get('http://localhost:5001/api/projects', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        // Verify response.data is an array
        const projectsData = Array.isArray(response.data) ? response.data : 
                           (response.data.projects || response.data.data || []);
        
        console.log('Projects received:', projectsData); // Debug log
        
        // Filter projects to only show APPROVED projects
        const filteredProjects = projectsData.filter(project => {
          const projectStatus = project.status ? project.status.toUpperCase() : '';
          console.log('Checking status:', projectStatus, 'Is visible:', VISIBLE_STATUSES.includes(projectStatus)); // Debug log
          return VISIBLE_STATUSES.includes(projectStatus);
        });
        
        console.log('Filtered projects:', filteredProjects); // Debug log
        setProjects(filteredProjects);
        setLoading(false);
      } catch (err) {
        console.error('Complete error:', err); // Debug log
        setError('Error loading projects: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  const handleViewProject = (projectId) => {
    navigate(`/student/projects/${projectId}`);
  };

  // Map statuses to chip colors
  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || '';
    
    if (statusUpper === 'COMPLETED' || statusUpper === 'APPROVED') {
      return 'success';
    } else if (statusUpper === 'IN_PROGRESS') {
      return 'primary';
    } else if (statusUpper === 'PENDING') {
      return 'warning';
    } else if (statusUpper === 'RECOMMENDED') {
      return 'info';
    }
    return 'default';
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return '';
    // Format status nicely for display
    let formatted = status.replace(/_/g, ' ');
    
    // First letter uppercase, rest lowercase
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Chargement de vos projets...</Typography>
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
        Mes Projets
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Seuls les projets approuvés par l'administrateur sont visibles sur cette page.
      </Alert>

      {projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Vous n'avez pas encore de projets approuvés</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            Seuls les projets approuvés par l'administrateur sont visibles ici. Veuillez patienter pendant que vos tuteurs soumettent des projets pour approbation.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Rafraîchir la page
          </Button>
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
                    <Typography variant="body2">Statut:</Typography>
                    <Chip 
                      label={formatStatus(project.status)}
                      size="small"
                      color={getStatusColor(project.status)}
                    />
                  </Box>
                  {project.progressPercentage !== undefined && (
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Progression: {project.progressPercentage}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={project.progressPercentage} 
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Période: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {project.tags && project.tags.map((tag, index) => (
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
                    Voir Détails
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