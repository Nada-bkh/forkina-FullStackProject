import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Project details:', response.data);
        
        // Vérifier si les données sont dans response.data.project ou directement dans response.data
        const projectData = response.data.project || response.data;
        setProject(projectData);
        
        // Vérifier si l'utilisateur est membre du projet
        const token = localStorage.getItem('token');
        if (token) {
          const userId = JSON.parse(atob(token.split('.')[1])).id;
          const isMemberOfProject = projectData.members && 
            projectData.members.some(m => (m.user === userId || (m.user && m.user._id === userId)));
          setIsMember(isMemberOfProject);
        }
        
        // Si pas de données valides, lever une erreur
        if (!projectData || (!projectData.name && !projectData._id)) {
          throw new Error('Invalid project data received');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
  
    fetchProjectDetails();
  }, [projectId]);
  

  const handleBack = () => {
    navigate('/student/projects');
  };

  const handleViewTasks = () => {
    navigate(`/student/projects/${projectId}/tasks`);
  };

  // Fonction pour rejoindre un projet
  const handleJoinProject = async () => {
    try {
      setJoinLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to join a project');
      }

      const userId = JSON.parse(atob(token.split('.')[1])).id;
      
      const response = await axios.post(
        `http://localhost:5001/api/projects/${projectId}/members`, 
        { userId, role: 'STUDENT' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setIsMember(true);
      console.log('Successfully joined project:', response.data);
      
      // Rafraîchir les données du projet
      window.location.reload();
    } catch (err) {
      console.error('Error joining project:', err);
      setError('Failed to join project: ' + (err.response?.data?.error || err.message));
    } finally {
      setJoinLoading(false);
    }
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
            <Box sx={{ display: 'flex', gap: 2 }}>
     
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
                color={
                  project.status === 'COMPLETED' || project.status === 'APPROVED' 
                    ? 'success' 
                    : project.status === 'IN_PROGRESS' 
                    ? 'primary'
                    : project.status === 'REJECTED'
                    ? 'error'
                    : 'default'
                } 
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