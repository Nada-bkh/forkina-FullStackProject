import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import { fetchProjectById } from '../../api/projectApi';

const ProjectDetails = ({ role = 'STUDENT' }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (role === 'STUDENT' && !location.state?.githubUrl) {
      navigate('/team-projects');
      return;
    }

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
  }, [projectId, navigate, location.state, role]);

  const handleBack = () => {
    const path = role === 'STUDENT' ? '/student/projects' : '/team-projects';
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
          <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                mr: 2,
                color: '#dd2825',
                '&:hover': {
                  backgroundColor: '#ffe5e5'
                }
              }}
          >
            Back
          </Button>
        </Box>

        {project && (
            <Paper sx={{
              p: 4,
              background: '#ffffff',
              borderRadius: 2,
              boxShadow: 3
            }}>
              {/* GitHub Repository Link */}
              {role === 'STUDENT' && location.state?.githubUrl && (
                  <Box sx={{
                    mb: 4,
                    p: 3,
                    backgroundColor: '#fff5f5',
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" sx={{ color: '#dd2825', mb: 1 }}>
                      <DescriptionIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                      Your GitHub Repository
                    </Typography>
                    <Button
                        variant="contained"
                        href={location.state.githubUrl}
                        target="_blank"
                        sx={{
                          backgroundColor: '#dd2825',
                          '&:hover': {
                            backgroundColor: '#c42020',
                            boxShadow: 2
                          }
                        }}
                    >
                      Open Repository
                    </Button>
                  </Box>
              )}

              {/* Project Header */}
              <Typography variant="h4" sx={{
                color: '#dd2825',
                mb: 3,
                fontWeight: 600
              }}>
                {project.name}
              </Typography>

              {/* Status Chip */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold">Project Status:</Typography>
                <Chip
                    label={project.status}
                    sx={{
                      mt: 1,
                      backgroundColor: project.status === 'COMPLETED' ? '#4caf50' :
                          project.status === 'IN_PROGRESS' ? '#ff9800' : '#dd2825',
                      color: 'white',
                      fontSize: '0.9rem',
                      padding: '8px 12px'
                    }}
                />
              </Box>

              {/* Project Description */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#dd2825' }}>
                  Project Description:
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                  {project.description || 'No description available'}
                </Typography>
              </Box>

              {/* Timeline */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#dd2825' }}>
                  Timeline:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 3 }}>
                  <Chip
                      label={`Start: ${new Date(project.startDate).toLocaleDateString()}`}
                      variant="outlined"
                      sx={{ borderColor: '#dd2825', color: '#dd2825' }}
                  />
                  <Chip
                      label={`End: ${new Date(project.endDate).toLocaleDateString()}`}
                      variant="outlined"
                      sx={{ borderColor: '#dd2825', color: '#dd2825' }}
                  />
                </Box>
              </Box>

              {/* SonarQube Guide Section */}
              {role === 'STUDENT' && (
                  <Box sx={{
                    mt: 4,
                    p: 3,
                    backgroundColor: '#fff5f5',
                    borderRadius: 2,
                    border: '2px solid #dd2825'
                  }}>
                    <Typography variant="h5" sx={{
                      mb: 2,
                      color: '#dd2825',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <ArticleIcon sx={{ mr: 1, fontSize: '1.5rem' }} />
                      Quality Pipeline Setup
                    </Typography>

                    <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                      Download and follow this guide to set up automated code quality analysis:
                    </Typography>

                    <Button
                        variant="contained"
                        component="a"
                        href="/sonarqube-guide.pdf"
                        download="Forkina-SonarQube-Guide.pdf"
                        target="_blank"
                        startIcon={<DescriptionIcon />}
                        sx={{
                          backgroundColor: '#dd2825',
                          '&:hover': {
                            backgroundColor: '#c42020',
                            boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
                          },
                          fontSize: '1rem',
                          padding: '12px 24px'
                        }}
                    >
                      Download Setup Guide (PDF)
                    </Button>

                    <Typography variant="body2" sx={{
                      mt: 3,
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Note: After setup, your code quality metrics will automatically update with each git push
                    </Typography>
                  </Box>
              )}
            </Paper>
        )}
      </Box>
  );
};

export default ProjectDetails;