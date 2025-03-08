import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Divider,
  Avatar,
  AvatarGroup,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import dayjs from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskIcon from '@mui/icons-material/Task';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch project details');
        }
        
        const data = await response.json();
        setProject(data.project);
        setTasks(data.tasks || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [projectId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/tutor/projects');
  };

  const handleEdit = () => {
    navigate(`/tutor/projects/${projectId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }
      
      // Success - redirect to projects list
      navigate('/tutor/projects');
      
    } catch (err) {
      setError(err.message);
      console.error('Error deleting project:', err);
    }
  };

  const handleManageTasks = () => {
    navigate(`/tutor/projects/${projectId}/tasks`);
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
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Project not found.</Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ color: '#dd2825' }}>{project.name}</Typography>
          <Chip 
            label={project.status.replace('_', ' ')} 
            color={project.status === 'PENDING' ? 'default' : 
                  project.status === 'IN_PROGRESS' ? 'primary' : 
                  project.status === 'COMPLETED' ? 'success' : 'secondary'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit Project
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete Project
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={handleManageTasks}
            sx={{
              backgroundColor: '#dd2825',
              color: 'white',
              '&:hover': {
                backgroundColor: '#c42020'
              }
            }}
          >
            Manage Tasks
          </Button>
        </Box>
      </Box>

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Left column - Project details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Overview" />
              <Tab label="Tasks" />
              <Tab label="Files" />
              <Tab label="Members" />
            </Tabs>
            
            <Divider sx={{ mb: 3 }} />
            
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Project Description</Typography>
                <Typography paragraph>{project.description}</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {dayjs(project.creationDate).format('MMM D, YYYY')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Start Date:</strong> {project.startDate ? dayjs(project.startDate).format('MMM D, YYYY') : 'Not set'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>End Date:</strong> {project.endDate ? dayjs(project.endDate).format('MMM D, YYYY') : 'Not set'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Tags:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          sx={{ backgroundColor: '#f1f1f1' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No tags</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Project Tasks</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/tutor/projects/${projectId}/tasks/create`)}
                    sx={{
                      backgroundColor: '#dd2825',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#c42020'
                      }
                    }}
                  >
                    Add Task
                  </Button>
                </Box>
                
                {tasks.length === 0 ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                    No tasks have been created for this project yet.
                  </Typography>
                ) : (
                  <Typography variant="body1">Task list will be displayed here.</Typography>
                )}
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Project Files</Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                  File management will be implemented soon.
                </Typography>
              </Box>
            )}
            
            {tabValue === 3 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Project Members</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GroupAddIcon />}
                  >
                    Add Member
                  </Button>
                </Box>
                
                {project.members && project.members.length > 0 ? (
                  <Typography variant="body1">Member list will be displayed here.</Typography>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                    No members have been added to this project yet.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right column - Stats and quick info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Project Progress</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progressPercentage || 0} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {`${Math.round(project.progressPercentage || 0)}%`}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 2 }}>
              Task Summary:
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Total Tasks:</Typography>
              <Typography variant="body2">{tasks.length}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Completed:</Typography>
              <Typography variant="body2">{tasks.filter(t => t.status === 'COMPLETED').length}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">In Progress:</Typography>
              <Typography variant="body2">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">To Do:</Typography>
              <Typography variant="body2">{tasks.filter(t => t.status === 'TODO').length}</Typography>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Team Members</Typography>
            
            {project.members && project.members.length > 0 ? (
              <>
                <AvatarGroup max={5} sx={{ justifyContent: 'center', mb: 2 }}>
                  {project.members.map((member, index) => (
                    <Avatar 
                      key={index} 
                      alt={member.user.firstName}
                      src={member.user.profilePicture ? `http://localhost:5001${member.user.profilePicture}` : undefined}
                    >
                      {member.user.firstName?.charAt(0)}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                No members added to this project yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetails; 