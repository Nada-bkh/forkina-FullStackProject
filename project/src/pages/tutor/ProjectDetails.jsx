import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Alert, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchProjectById } from '../../api/projectApi';
import { getUserRole } from '../../utils/authUtils';

const ProjectDetails = ({ role = getUserRole() }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchProjectById(projectId);
        console.log("Project data received:", response);
        const projectData = response.project ? response.project : response;
        setProject(projectData);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [projectId]);

  const handleBack = () => {
    let path = '/student/projects';
    if (role === 'ADMIN') path = '/admin/projects';
    if (role === 'TUTOR') path = '/tutor/projects';
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
        <Button sx={{ mt: 2 }} onClick={handleBack}>Back to Projects</Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Aucune donnée de projet trouvée. ID de projet: {projectId}</Alert>
        <Button sx={{ mt: 2 }} onClick={handleBack}>Back to Projects</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>Back</Button>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>{project.name || 'Projet sans titre'}</Typography>
      </Box>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
          <Chip
            label={project.status || 'Non défini'}
            color={
              project.status === 'COMPLETED'
                ? 'success'
                : project.status === 'IN_PROGRESS'
                  ? 'primary'
                  : 'default'
            }
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
                <Chip key={index} label={tag} size="small" />
              ))
            ) : (
              <Typography>No skills or tags specified</Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectDetails;