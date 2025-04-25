import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchProjectById } from '../../api/projectApi';

const ProjectDetails = ({ role = 'STUDENT' }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        setProject(projectData.project || projectData);
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
        </Box>

        {project && (
            <Paper sx={{ p: 4, background: '#f8f8f8' }}>
              <Typography variant="h4" sx={{ color: 'red', mb: 3 }}>
                VERSION SIMPLIFIÉE DE PROJET
              </Typography>
              
              <Typography variant="h5" sx={{ color: '#dd2825', mb: 3 }}>
                {project?.name || 'Project Details'}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
                <Chip
                    label={project.status}
                    color="error"
                    sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">Description:</Typography>
                <Typography paragraph>
                  {project.description || 'No description available'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">Timeline:</Typography>
                <Typography>
                  Start Date: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}
                </Typography>
                <Typography>
                  End Date: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not specified'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Skills/Tags:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" color="error" />
                    ))
                  ) : (
                    <Typography>No skills or tags specified</Typography>
                  )}
                </Box>
              </Box>
            </Paper>
        )}
      </Box>
  );
};

export default ProjectDetails;